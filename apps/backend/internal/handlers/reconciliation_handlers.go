// Package handlers contém os manipuladores de requisições HTTP para a API.
package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"radare-datarecon/apps/backend/internal/middleware"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/apps/backend/internal/reconciliation"
	"radare-datarecon/apps/backend/internal/repositories"
	"radare-datarecon/database"
	"strconv"
	"sync"
	"time"

	"gonum.org/v1/gonum/mat"
	"radare-datarecon/apps/backend/internal/hub"
	"radare-datarecon/apps/backend/internal/workers"
)

// CurrentValues representa uma estrutura de dados de exemplo com dois valores inteiros.
// É usado pelo endpoint /api/current-values para demonstrar a atualização de dados em tempo real.
type CurrentValues struct {
	Value1 int `json:"value1"` // O primeiro valor.
	Value2 int `json:"value2"` // O segundo valor.
}

// ReconciliationRequest representa o corpo da requisição para o endpoint de reconciliação.
// Contém todos os dados necessários para realizar o processo de reconciliação.
type ReconciliationRequest struct {
	// Measurements é um slice de float64 representando os valores medidos.
	Measurements []float64 `json:"measurements"`
	// Tolerances é um slice de float64 representando as tolerâncias percentuais para cada medição.
	Tolerances []float64 `json:"tolerances"`
	// Constraints é uma matriz (slice de slices de float64) que representa as equações de restrição linear.
	Constraints [][]float64 `json:"constraints"`
	// TagNames associa nomes opcionais às medições para identificação de outlier.
	TagNames []string `json:"tag_names,omitempty"`
	// WorkspaceID, when provided, links the result to the latest immutable
	// snapshot of that workspace topology for full traceability.
	WorkspaceID *uint `json:"workspace_id,omitempty"`
	// Async determines if the reconciliation should be processed in the background.
	Async bool `json:"async,omitempty"`
}

// ReconciliationResponse representa a estrutura da resposta JSON para uma reconciliação bem-sucedida.
type ReconciliationResponse struct {
	ReconciledValues    []float64 `json:"reconciled_values,omitempty"`
	Corrections         []float64 `json:"corrections,omitempty"`
	ConsistencyStatus   string    `json:"consistency_status,omitempty"`
	ChiSquare           float64   `json:"chi_square,omitempty"`
	CriticalValue       float64   `json:"critical_value,omitempty"`
	StatisticalValidity bool      `json:"statistical_validity,omitempty"`
	ConfidenceScore     float64   `json:"confidence_score,omitempty"`
	OutlierIndex        int       `json:"outlier_index,omitempty"`
	OutlierTag          string    `json:"outlier_tag,omitempty"`
	OutlierContribution float64   `json:"outlier_contribution,omitempty"`
	Message             string    `json:"message,omitempty"`
}

var (
	currentValues CurrentValues
	mutex         sync.RWMutex // Mutex para garantir o acesso seguro e concorrente à variável `currentValues`.
)

func parseDateParam(value string, endOfDay bool) (*time.Time, error) {
	if value == "" {
		return nil, nil
	}

	layouts := []string{time.RFC3339, "2006-01-02"}
	for _, layout := range layouts {
		parsed, err := time.Parse(layout, value)
		if err == nil {
			if layout == "2006-01-02" && endOfDay {
				parsed = parsed.Add(24*time.Hour - time.Nanosecond)
			}
			return &parsed, nil
		}
	}

	return nil, fmt.Errorf("formato de data inválido: %s", value)
}

// init é uma função especial do Go que é executada na inicialização do pacote.
// Aqui, ela inicia uma goroutine para atualizar os valores de exemplo periodicamente.
func init() {
	go updateValues()
}

// updateValues é uma função executada em uma goroutine que atualiza `currentValues` a cada segundo.
// Ela alterna os valores entre (50, 100) e (100, 50), demonstrando uma fonte de dados dinâmica.
func updateValues() {
	for {
		// Bloqueia o mutex para escrita, garantindo que nenhuma outra goroutine leia ou escreva enquanto os valores são atualizados.
		mutex.Lock()
		if currentValues.Value1 == 50 {
			currentValues.Value1 = 100
			currentValues.Value2 = 50
		} else {
			currentValues.Value1 = 50
			currentValues.Value2 = 100
		}
		mutex.Unlock() // Libera o mutex após a atualização.

		// Pausa a goroutine por 1 segundo antes da próxima atualização.
		time.Sleep(1 * time.Second)
	}
}

// GetCurrentValues é o manipulador para o endpoint GET /api/current-values.
// Ele retorna os valores atuais da estrutura `currentValues` em formato JSON.
// A função retorna um erro para ser tratado pelo middleware ErrorHandler.
func GetCurrentValues(w http.ResponseWriter, r *http.Request) error {
	w.Header().Set("Content-Type", "application/json")

	// Bloqueia o mutex para leitura, permitindo múltiplas leituras concorrentes, mas bloqueando escritas.
	mutex.RLock()
	values := currentValues
	mutex.RUnlock() // Libera o bloqueio de leitura.

	// Codifica a estrutura `values` para JSON e a escreve no corpo da resposta.
	if err := json.NewEncoder(w).Encode(values); err != nil {
		// Se a codificação falhar, o erro é retornado para ser tratado pelo middleware.
		return err
	}
	return nil
}

// ReconcileData é o manipulador para o endpoint POST /api/reconcile.
// Ele processa a requisição de reconciliação de dados.
func ReconcileData(w http.ResponseWriter, r *http.Request) error {
	// Garante que o método da requisição seja POST.
	if r.Method != http.MethodPost {
		broadcastReconcileError("Método não permitido")
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
		return nil // Retorna nil porque a resposta de erro já foi escrita.
	}

	// Decodifica o corpo da requisição JSON para a estrutura ReconciliationRequest.
	var req ReconciliationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		broadcastReconcileError("Corpo da requisição inválido")
		http.Error(w, fmt.Sprintf("Corpo da requisição inválido: %v", err), http.StatusBadRequest)
		return nil
	}
	tenantID, tenantOK := middleware.TenantIDPointerFromContext(r.Context())
	if !tenantOK {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	// Converte a matriz de restrições de [][]float64 para o tipo *mat.Dense esperado pela biblioteca gonum.
	rows := len(req.Constraints)
	if rows == 0 {
		broadcastReconcileError("Erro de validação: constraints vazia")
		http.Error(w, "Erro de validação: A matriz 'constraints' não pode estar vazia.", http.StatusBadRequest)
		return nil
	}
	cols := len(req.Constraints[0])
	if cols != len(req.Measurements) {
		broadcastReconcileError("Erro de validação: dimensões inválidas")
		http.Error(w, fmt.Sprintf("Erro de validação: O número de colunas nas restrições (%d) deve ser igual ao número de medições (%d).", cols, len(req.Measurements)), http.StatusBadRequest)
		return nil
	}

	constraints := mat.NewDense(rows, cols, nil)
	for i, row := range req.Constraints {
		if len(row) != cols {
			broadcastReconcileError("Erro de validação: matriz de restrições inconsistente")
			http.Error(w, fmt.Sprintf("Erro de validação: A linha %d da matriz de restrições tem %d elementos, mas o esperado era %d.", i, len(row), cols), http.StatusBadRequest)
			return nil
		}
		constraints.SetRow(i, row)
	}

	// Handle asynchronous reconciliation
	if req.Async {
		userID, ok := r.Context().Value("userID").(float64)
		if !ok {
			return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
		}

		workers.EnqueueReconciliation(workers.ReconciliationTask{
			Measurements: req.Measurements,
			Tolerances:   req.Tolerances,
			Constraints:  req.Constraints,
			TagNames:     req.TagNames,
			UserID:       uint(userID),
			TenantID:     tenantID,
			WorkspaceID:  req.WorkspaceID,
		})

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		json.NewEncoder(w).Encode(ReconciliationResponse{
			Message: "Reconciliação enviada para processamento em segundo plano.",
		})
		return nil
	}

	// Chama a função de reconciliação principal com os dados da requisição.
	result, err := reconciliation.Reconcile(req.Measurements, req.Tolerances, constraints)
	if err != nil {
		broadcastReconcileError("Erro ao processar a reconciliação")
		http.Error(w, fmt.Sprintf("Erro ao processar a reconciliação: %v", err), http.StatusBadRequest)
		return nil
	}

	// Calcula as correções aplicadas.
	corrections := make([]float64, len(req.Measurements))
	for i := range req.Measurements {
		corrections[i] = result.ReconciledValues[i] - req.Measurements[i]
	}

	// Determina o status de consistência.
	status := "Inconsistente"
	if result.GlobalTest.StatisticalValidity {
		status = "Consistente"
	}
	outlierTag := ""
	if result.GlobalTest.OutlierIndex >= 0 && result.GlobalTest.OutlierIndex < len(req.TagNames) {
		outlierTag = req.TagNames[result.GlobalTest.OutlierIndex]
	}

	// Salva a reconciliação no banco de dados se o usuário estiver autenticado.
	userID, ok := r.Context().Value("userID").(float64)
	if ok {
		// Resolve the latest workspace version when the caller provides a workspace_id.
		var workspaceVersionID *uint
		if req.WorkspaceID != nil && *req.WorkspaceID > 0 {
			vRepo := repositories.NewWorkspaceVersionRepository(database.CoreDB)
			if latest, err := vRepo.LatestByWorkspaceAndTenant(*req.WorkspaceID, *tenantID); err == nil {
				workspaceVersionID = &latest.ID
			}
		}

		repository := repositories.NewReconciliationRepository(database.CoreDB)
		dbRecon := models.Reconciliation{
			UserID:              uint(userID),
			TenantID:            tenantID,
			WorkspaceVersionID:  workspaceVersionID,
			Measurements:        req.Measurements,
			Tolerances:          req.Tolerances,
			Constraints:         req.Constraints,
			ReconciledValues:    result.ReconciledValues,
			Corrections:         corrections,
			ConsistencyStatus:   status,
			ChiSquare:           result.GlobalTest.Statistic,
			CriticalValue:       result.GlobalTest.CriticalValue,
			StatisticalValidity: result.GlobalTest.StatisticalValidity,
			ConfidenceScore:     result.GlobalTest.ConfidenceScore,
			OutlierIndex:        result.GlobalTest.OutlierIndex,
			OutlierTag:          outlierTag,
			OutlierContribution: result.GlobalTest.OutlierContribution,
		}
		_ = repository.Create(&dbRecon)
	}

	// Grava um snapshot efêmero no LogDB para auditoria/observabilidade.
	var snapshotUserID *uint
	if ok {
		uid := uint(userID)
		snapshotUserID = &uid
	}
	var snapshotWorkspaceID *uint
	if req.WorkspaceID != nil && *req.WorkspaceID > 0 {
		snapshotWorkspaceID = req.WorkspaceID
	}
	database.LogReconciliationSnapshot(database.LogDB, snapshotUserID, snapshotWorkspaceID, status, result.GlobalTest.Statistic, result.GlobalTest.ConfidenceScore, map[string]interface{}{
		"measurements":      req.Measurements,
		"tolerances":        req.Tolerances,
		"constraints":       req.Constraints,
		"reconciled_values": result.ReconciledValues,
		"corrections":       corrections,
		"outlier_index":     result.GlobalTest.OutlierIndex,
		"outlier_tag":       outlierTag,
	})

	// Notifica todos os clientes WebSocket sobre o resultado.
	hub.Default.Broadcast(hub.TypeReconciliationResult, map[string]interface{}{
		"status":               status,
		"chi_square":           result.GlobalTest.Statistic,
		"critical_value":       result.GlobalTest.CriticalValue,
		"statistical_validity": result.GlobalTest.StatisticalValidity,
		"confidence_score":     result.GlobalTest.ConfidenceScore,
		"outlier_index":        result.GlobalTest.OutlierIndex,
		"outlier_tag":          outlierTag,
		"outlier_contribution": result.GlobalTest.OutlierContribution,
	})

	// Prepara e envia a resposta de sucesso em formato JSON.
	w.Header().Set("Content-Type", "application/json")
	response := ReconciliationResponse{
		ReconciledValues:    result.ReconciledValues,
		Corrections:         corrections,
		ConsistencyStatus:   status,
		ChiSquare:           result.GlobalTest.Statistic,
		CriticalValue:       result.GlobalTest.CriticalValue,
		StatisticalValidity: result.GlobalTest.StatisticalValidity,
		ConfidenceScore:     result.GlobalTest.ConfidenceScore,
		OutlierIndex:        result.GlobalTest.OutlierIndex,
		OutlierTag:          outlierTag,
		OutlierContribution: result.GlobalTest.OutlierContribution,
	}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		return err
	}

	return nil
}

// GetReconciliationHistory retorna o histórico de reconciliações do usuário autenticado com paginação e filtros.
func GetReconciliationHistory(w http.ResponseWriter, r *http.Request) error {
	userID, ok := r.Context().Value("userID").(float64)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	// Filtros
	status := r.URL.Query().Get("status")
	startDateValue := r.URL.Query().Get("start_date")
	endDateValue := r.URL.Query().Get("end_date")

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page <= 0 {
		page = 1
	}
	pageSize := 10

	startDate, err := parseDateParam(startDateValue, false)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: err.Error()}
	}

	endDate, err := parseDateParam(endDateValue, true)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: err.Error()}
	}

	repository := repositories.NewReconciliationRepository(database.CoreDB)
	history, total, err := repository.ListByUserAndTenant(uint(userID), tenantID, repositories.ReconciliationHistoryFilter{
		Status:    status,
		StartDate: startDate,
		EndDate:   endDate,
		Page:      page,
		PageSize:  pageSize,
	})
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar histórico"}
	}

	response := map[string]interface{}{
		"data":      history,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
		"last_page": (total + int64(pageSize) - 1) / int64(pageSize),
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(response)
}

// ExportReconciliationHistory exporta o histórico do usuário para um arquivo CSV.
func ExportReconciliationHistory(w http.ResponseWriter, r *http.Request) error {
	userID, ok := r.Context().Value("userID").(float64)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	repository := repositories.NewReconciliationRepository(database.CoreDB)
	history, err := repository.ListAllByUserAndTenant(uint(userID), tenantID)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar histórico para exportação"}
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment;filename=reconciliations.csv")

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// Escreve o cabeçalho
	writer.Write([]string{"ID", "Data", "Status", "Medições", "Reconciliados"})

	for _, rec := range history {
		writer.Write([]string{
			fmt.Sprintf("%d", rec.ID),
			rec.CreatedAt.Format("2006-01-02 15:04:05"),
			rec.ConsistencyStatus,
			fmt.Sprintf("%v", rec.Measurements),
			fmt.Sprintf("%v", rec.ReconciledValues),
		})
	}

	return nil
}

// ExportReconciliationHistoryPDF exporta o histórico do usuário para um arquivo PDF simples.
func ExportReconciliationHistoryPDF(w http.ResponseWriter, r *http.Request) error {
	userID, ok := r.Context().Value("userID").(float64)
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}
	tenantID, ok := middleware.TenantIDFromContext(r.Context())
	if !ok {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	repository := repositories.NewReconciliationRepository(database.CoreDB)
	history, err := repository.ListAllByUserAndTenant(uint(userID), tenantID)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao buscar histórico para exportação"}
	}

	lines := []string{
		"Historico de reconciliacoes",
		fmt.Sprintf("Gerado em: %s", time.Now().Format("2006-01-02 15:04:05")),
		fmt.Sprintf("Total de registros: %d", len(history)),
		"",
		"ID | Data | Status | chi2 | valido | confianca",
		"------------------------------------------------",
	}

	for _, rec := range history {
		line := fmt.Sprintf(
			"%d | %s | %s | %.4f | %t | %.1f%%",
			rec.ID,
			rec.CreatedAt.Format("2006-01-02 15:04:05"),
			rec.ConsistencyStatus,
			rec.ChiSquare,
			rec.StatisticalValidity,
			rec.ConfidenceScore*100,
		)
		lines = append(lines, wrapLine(line, 110)...)
	}

	pdfBytes := buildSimplePDF(lines)
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment;filename=reconciliations.pdf")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(pdfBytes)
	return nil
}

func broadcastReconcileError(message string) {
	hub.Default.Broadcast(hub.TypeReconciliationError, map[string]interface{}{
		"error": message,
	})
}
