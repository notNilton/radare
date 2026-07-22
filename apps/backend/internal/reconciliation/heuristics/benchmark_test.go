package heuristics

import (
	"testing"

	"gonum.org/v1/gonum/mat"
)

func TestCompareAgreesUnderKnownCovariance(t *testing.T) {
	measurements := []float64{161, 79, 80}
	tolerances := []float64{0.05, 0.01, 0.01}
	constraints := mat.NewDense(1, 3, []float64{1, -1, -1})

	cfg := DefaultConfig()
	cfg.Generations = 400

	comparison, err := Compare(measurements, tolerances, constraints, cfg)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if comparison.MaxAbsoluteDifference > 0.5 {
		t.Errorf("expected GA and Lagrange to agree within 0.5, max difference was %f", comparison.MaxAbsoluteDifference)
	}

	if comparison.Lagrange.ChiSquare < 0 {
		t.Errorf("expected non-negative chi-square from the Lagrange baseline, got %f", comparison.Lagrange.ChiSquare)
	}
}
