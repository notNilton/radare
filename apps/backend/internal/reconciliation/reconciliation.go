// Package reconciliation fornece a lógica para a reconciliação de dados.
// A reconciliação de dados é um processo estatístico que ajusta um conjunto de medições
// para satisfazer um conjunto de restrições, como leis de conservação.
package reconciliation

import (
	"errors"
	"fmt"
	"math"

	"gonum.org/v1/gonum/mat"
	"gonum.org/v1/gonum/stat/distuv"
)

// Reconcile ajusta os valores medidos para que obedeçam às equações de restrição,
// utilizando o método dos multiplicadores de Lagrange para minimizar o erro quadrático ponderado.
//
// A função resolve o seguinte sistema de equações lineares:
//
// | W   B^T | | x |   | W*m |
// |         | |   | = |     |
// | B    0  | | λ |   |  0  |
// ReconcileResult contém os resultados de uma operação de reconciliação.
type ReconcileResult struct {
	ReconciledValues []float64
	ChiSquare        float64
	DegreesOfFreedom int
	GlobalTest       GlobalTestResult
}

// GlobalTestResult contains the chi-square gross-error detection result.
type GlobalTestResult struct {
	Statistic           float64
	CriticalValue       float64
	StatisticalValidity bool
	ConfidenceScore     float64
	OutlierIndex        int
	OutlierContribution float64
}

// Reconcile ajusta os valores medidos para que obedeçam às equações de restrição,
// utilizando o método dos multiplicadores de Lagrange para minimizar o erro quadrático ponderado.
//
// Parâmetros:
//   - measurements: Um slice de float64 representando os valores medidos (m).
//   - tolerances: Um slice de float64 representando as tolerâncias percentuais (p), usadas para calcular os desvios padrão.
//   - constraints: Uma matriz densa (*mat.Dense) representando as equações de restrição (B).
//
// Retorna:
//   - Um ponteiro para ReconcileResult com os valores reconciliados e estatísticas.
//   - Um erro se os cálculos falharem (ex: matriz singular, dimensões incompatíveis).
func Reconcile(measurements, tolerances []float64, constraints *mat.Dense) (*ReconcileResult, error) {
	numMeasurements := len(measurements)
	if numMeasurements == 0 {
		return nil, errors.New("o slice de medições não pode estar vazio")
	}
	if len(tolerances) != numMeasurements {
		return nil, fmt.Errorf("incompatibilidade de dimensão: medições (%d) e tolerâncias (%d)", numMeasurements, len(tolerances))
	}

	numConstraints, cCols := constraints.Dims()
	if cCols != numMeasurements {
		return nil, fmt.Errorf("incompatibilidade de dimensão: colunas das restrições (%d) e medições (%d)", cCols, numMeasurements)
	}

	// Calcula os desvios padrão absolutos (σ_i = m_i * p_i)
	absDeviations := make([]float64, numMeasurements)
	for i := 0; i < numMeasurements; i++ {
		absDeviations[i] = measurements[i] * tolerances[i]
		if absDeviations[i] == 0 {
			return nil, fmt.Errorf("a tolerância absoluta para a medição %d é zero, causando divisão por zero", i)
		}
	}

	// Constrói a matriz aumentada do sistema de Lagrange.
	totalDim := numMeasurements + numConstraints
	lagrangeMatrix := mat.NewDense(totalDim, totalDim, nil)

	weightsData := make([]float64, numMeasurements)
	for i := 0; i < numMeasurements; i++ {
		weightsData[i] = 1 / (absDeviations[i] * absDeviations[i])
	}
	weightsMatrix := mat.NewDiagDense(numMeasurements, weightsData)
	lagrangeMatrix.Slice(0, numMeasurements, 0, numMeasurements).(*mat.Dense).Copy(weightsMatrix)
	lagrangeMatrix.Slice(0, numMeasurements, numMeasurements, totalDim).(*mat.Dense).Copy(constraints.T())
	lagrangeMatrix.Slice(numMeasurements, totalDim, 0, numMeasurements).(*mat.Dense).Copy(constraints)

	rhsData := make([]float64, totalDim)
	for i := 0; i < numMeasurements; i++ {
		rhsData[i] = weightsData[i] * measurements[i]
	}
	rhsVec := mat.NewVecDense(totalDim, rhsData)

	var invLagrange mat.Dense
	if err := invLagrange.Inverse(lagrangeMatrix); err != nil {
		return nil, errors.New("a matriz de lagrange é singular e não pode ser invertida, verifique as restrições")
	}

	var resultVec mat.VecDense
	resultVec.MulVec(&invLagrange, rhsVec)

	reconciled := make([]float64, numMeasurements)
	for i := 0; i < numMeasurements; i++ {
		reconciled[i] = resultVec.AtVec(i)
	}

	// Calcula o valor de Qui-quadrado (h = r^T V^-1 r) para o teste global.
	contributions := make([]float64, numMeasurements)
	for i := 0; i < numMeasurements; i++ {
		residual := (reconciled[i] - measurements[i]) / absDeviations[i]
		contributions[i] = residual * residual
	}
	globalTest := GlobalTest(contributions, numConstraints, 0.05)

	return &ReconcileResult{
		ReconciledValues: reconciled,
		ChiSquare:        globalTest.Statistic,
		DegreesOfFreedom: numConstraints,
		GlobalTest:       globalTest,
	}, nil
}

// GlobalTest evaluates h = r^T V^-1 r against a chi-square distribution.
func GlobalTest(contributions []float64, df int, alpha float64) GlobalTestResult {
	if alpha <= 0 {
		alpha = 0.05
	}

	statistic := 0.0
	outlierIndex := -1
	outlierContribution := 0.0
	for i, contribution := range contributions {
		statistic += contribution
		if contribution > outlierContribution {
			outlierIndex = i
			outlierContribution = contribution
		}
	}

	if df <= 0 {
		return GlobalTestResult{
			Statistic:           statistic,
			CriticalValue:       math.Inf(1),
			StatisticalValidity: true,
			ConfidenceScore:     1,
			OutlierIndex:        outlierIndex,
			OutlierContribution: outlierContribution,
		}
	}

	distribution := distuv.ChiSquared{K: float64(df)}
	criticalValue := distribution.Quantile(1 - alpha)
	confidenceScore := distribution.Survival(statistic)
	if math.IsNaN(confidenceScore) {
		confidenceScore = 0
	}

	return GlobalTestResult{
		Statistic:           statistic,
		CriticalValue:       criticalValue,
		StatisticalValidity: statistic <= criticalValue,
		ConfidenceScore:     confidenceScore,
		OutlierIndex:        outlierIndex,
		OutlierContribution: outlierContribution,
	}
}

// IsConsistent verifica se o resultado da reconciliação é estatisticamente consistente
// dado um nível de significância (alfa).
func IsConsistent(chiSquare float64, df int, alpha float64) bool {
	return GlobalTest([]float64{chiSquare}, df, alpha).StatisticalValidity
}
