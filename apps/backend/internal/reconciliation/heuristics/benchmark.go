package heuristics

import (
	"fmt"
	"math"

	"radare-datarecon/apps/backend/internal/reconciliation"

	"gonum.org/v1/gonum/mat"
)

// ComparisonResult captures the outcome of running both the closed-form Lagrange solver
// and the genetic algorithm solver against the same equality-constrained problem.
type ComparisonResult struct {
	Lagrange *reconciliation.ReconcileResult
	Genetic  *Result
	// MaxAbsoluteDifference is the largest per-variable gap between the two solutions.
	MaxAbsoluteDifference float64
}

// Compare runs both solvers on an equality-only problem (no inequality bounds — the
// Lagrange solver has no notion of those) and reports their agreement. This is the
// harness required to validate H1 from docs/planning/06-PHASE-6-HEURISTIC-OPTIMIZATION.md
// Section 0.1: under known, well-conditioned covariance, the two solvers should agree.
func Compare(measurements, tolerances []float64, constraints *mat.Dense, cfg Config) (*ComparisonResult, error) {
	lagrangeResult, err := reconciliation.Reconcile(measurements, tolerances, constraints)
	if err != nil {
		return nil, fmt.Errorf("lagrange solver failed: %w", err)
	}

	geneticResult, err := Solve(measurements, tolerances, constraints, nil, cfg)
	if err != nil {
		return nil, fmt.Errorf("genetic solver failed: %w", err)
	}

	maxDiff := 0.0
	for i := range lagrangeResult.ReconciledValues {
		diff := math.Abs(lagrangeResult.ReconciledValues[i] - geneticResult.Values[i])
		if diff > maxDiff {
			maxDiff = diff
		}
	}

	return &ComparisonResult{
		Lagrange:              lagrangeResult,
		Genetic:               geneticResult,
		MaxAbsoluteDifference: maxDiff,
	}, nil
}
