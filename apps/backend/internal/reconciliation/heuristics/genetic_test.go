package heuristics

import (
	"math"
	"testing"

	"gonum.org/v1/gonum/mat"
)

func TestSolveMatchesLagrangeUnderEqualityOnly(t *testing.T) {
	// Same "Exemplo 2" fixture as internal/reconciliation.TestReconcile, to validate H1:
	// under known, well-conditioned covariance, the GA should reach essentially the same
	// solution as the closed-form Lagrange multiplier method.
	measurements := []float64{161, 79, 80}
	tolerances := []float64{0.05, 0.01, 0.01}
	constraints := mat.NewDense(1, 3, []float64{1, -1, -1})
	expected := []float64{159.0383, 79.0189, 80.0194}

	cfg := DefaultConfig()
	cfg.Generations = 400

	result, err := Solve(measurements, tolerances, constraints, nil, cfg)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	for i := range expected {
		if diff := math.Abs(result.Values[i] - expected[i]); diff > 0.5 {
			t.Errorf("variable %d: expected close to %f, got %f (diff %f)", i, expected[i], result.Values[i], diff)
		}
	}

	if len(result.FitnessHistory) != cfg.Generations {
		t.Fatalf("expected %d fitness history entries, got %d", cfg.Generations, len(result.FitnessHistory))
	}
}

func TestSolveRespectsInequalityBounds(t *testing.T) {
	// No equality constraints: a single variable measured at 100 but physically capped at
	// 50 (e.g. a valve/tank ceiling). The GA must push the solution toward the feasible
	// boundary instead of the raw (infeasible) measurement.
	measurements := []float64{100}
	tolerances := []float64{0.1}
	bounds := []Bounds{{Min: 0, Max: 50}}

	cfg := DefaultConfig()
	cfg.Generations = 300

	result, err := Solve(measurements, tolerances, nil, bounds, cfg)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.Values[0] > 51 {
		t.Fatalf("expected solution near the upper bound (50), got %f", result.Values[0])
	}
}

func TestSolveRejectsDimensionMismatch(t *testing.T) {
	_, err := Solve([]float64{100, 50}, []float64{0.1}, nil, nil, DefaultConfig())
	if err == nil {
		t.Fatal("expected a dimension mismatch error, got nil")
	}
}
