package handlers

import (
	"fmt"
	"math"
	"net/http"
	"strconv"

	"github.com/xuri/excelize/v2"
	"radare-datarecon/apps/backend/internal/middleware"
	"radare-datarecon/apps/backend/internal/models"
	"radare-datarecon/database"
)

// ExportReconciliationByIDExcel handles GET /api/reconciliations/{id}/export/excel.
// It streams an xlsx file containing per-tag reconciliation data for the given record.
func ExportReconciliationByIDExcel(w http.ResponseWriter, r *http.Request) error {
	if r.Method != http.MethodGet {
		return middleware.HTTPError{Code: http.StatusMethodNotAllowed, Message: "Método não permitido"}
	}

	_, authOK := authenticatedUserID(r)
	if !authOK {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Usuário não autenticado"}
	}
	tenantID, tenantOK := middleware.TenantIDFromContext(r.Context())
	if !tenantOK {
		return middleware.HTTPError{Code: http.StatusUnauthorized, Message: "Tenant não identificado"}
	}

	reconID, err := reconciliationIDFromPath(r.URL.Path)
	if err != nil {
		return middleware.HTTPError{Code: http.StatusBadRequest, Message: "ID de reconciliação inválido"}
	}

	var rec models.Reconciliation
	if err := database.CoreDB.
		Where("id = ? AND tenant_id = ?", reconID, tenantID).
		First(&rec).Error; err != nil {
		return middleware.HTTPError{Code: http.StatusNotFound, Message: "Reconciliação não encontrada"}
	}

	f := excelize.NewFile()
	defer f.Close()

	sheet := "Reconciliation"
	f.SetSheetName("Sheet1", sheet)

	// Bold style for header row.
	boldStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
	})

	headers := []string{
		"tag_name",
		"measured_value",
		"reconciled_value",
		"adjustment",
		"adjustment_pct",
		"chi_contribution",
		"tolerance",
	}
	for col, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(col+1, 1)
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, boldStyle)
	}

	n := len(rec.ReconciledValues)
	for i := 0; i < n; i++ {
		row := i + 2
		tagName := fmt.Sprintf("tag_%d", i)

		measured := 0.0
		if i < len(rec.Measurements) {
			measured = rec.Measurements[i]
		}
		reconciled := rec.ReconciledValues[i]
		adjustment := reconciled - measured
		adjPct := 0.0
		if measured != 0 {
			adjPct = (adjustment / measured) * 100
		}
		tolerance := 0.0
		if i < len(rec.Tolerances) {
			tolerance = rec.Tolerances[i]
		}
		sigma := math.Abs(measured) * tolerance
		chiContrib := 0.0
		if sigma > 0 {
			chiContrib = math.Pow(adjustment/sigma, 2)
		}

		rowData := []interface{}{
			tagName,
			measured,
			reconciled,
			adjustment,
			adjPct,
			chiContrib,
			tolerance,
		}
		for col, val := range rowData {
			cell, _ := excelize.CoordinatesToCellName(col+1, row)
			f.SetCellValue(sheet, cell, val)
		}
	}

	w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"reconciliation_%s.xlsx\"", strconv.FormatUint(uint64(reconID), 10)))

	if err := f.Write(w); err != nil {
		return middleware.HTTPError{Code: http.StatusInternalServerError, Message: "Erro ao gerar arquivo Excel"}
	}

	return nil
}
