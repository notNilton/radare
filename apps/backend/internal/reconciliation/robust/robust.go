// Package robust implements iteratively reweighted least squares (IRLS) variants of the
// steady-state reconciliation solver using classical robust M-estimators (Huber, Fair).
// These are the mandatory baselines required by
// docs/planning/06-PHASE-6-HEURISTIC-OPTIMIZATION.md Section 0.2: comparing the genetic
// solver's gross-error resilience only against plain OLS (Lagrange) is not a valid claim
// without also comparing it against the robust estimators the literature already uses for
// the same purpose (Romagnoli & Sanchez, 2000).
package robust

import (
	"math"

	"radare-datarecon/apps/backend/internal/reconciliation"

	"gonum.org/v1/gonum/mat"
)

// EstimatorType selects which robust weighting function down-weights large residuals.
type EstimatorType int

const (
	// Huber applies unit weight within the tuning constant and 1/|z| beyond it.
	Huber EstimatorType = iota
	// Fair applies a smoothly decaying weight, softer than Huber far from zero.
	Fair
)

// Config controls the IRLS loop.
type Config struct {
	Estimator     EstimatorType
	Tuning        float64
	MaxIterations int
	// Tolerance is the convergence threshold on the largest change in effective sigma
	// between consecutive iterations.
	Tolerance float64
}

// DefaultConfig returns the classical tuning constants for each estimator (Huber's c=1.345
// gives 95% efficiency under a Gaussian error model; Fair's c=1.4 is the standard choice).
func DefaultConfig(estimator EstimatorType) Config {
	tuning := 1.345
	if estimator == Fair {
		tuning = 1.4
	}
	return Config{Estimator: estimator, Tuning: tuning, MaxIterations: 25, Tolerance: 1e-6}
}

// Result mirrors reconciliation.ReconcileResult and additionally reports IRLS convergence
// and the final per-measurement weight — a weight well below 1 flags a suspected gross
// error without needing a separate outlier test.
type Result struct {
	*reconciliation.ReconcileResult
	Iterations int
	Converged  bool
	Weights    []float64
}

func weight(standardizedResidual float64, cfg Config) float64 {
	a := math.Abs(standardizedResidual)
	switch cfg.Estimator {
	case Fair:
		return 1 / (1 + a/cfg.Tuning)
	default:
		if a <= cfg.Tuning {
			return 1
		}
		return cfg.Tuning / a
	}
}

// Reconcile starts from the ordinary weighted least squares solution (identical to
// internal/reconciliation.Reconcile) and iteratively inflates the effective tolerance of
// measurements with large standardized residuals, converging to a solution that is
// resilient to gross errors without requiring prior knowledge of which sensor is at fault.
func Reconcile(measurements, tolerances []float64, constraints *mat.Dense, cfg Config) (*Result, error) {
	if cfg.MaxIterations <= 0 {
		cfg = DefaultConfig(cfg.Estimator)
	}

	effectiveTolerances := append([]float64(nil), tolerances...)
	var last *reconciliation.ReconcileResult
	converged := false
	iterations := 0

	for iter := 0; iter < cfg.MaxIterations; iter++ {
		iterations = iter + 1
		result, err := reconciliation.Reconcile(measurements, effectiveTolerances, constraints)
		if err != nil {
			return nil, err
		}
		last = result

		maxChange := 0.0
		nextTolerances := make([]float64, len(measurements))
		for i := range measurements {
			sigma := measurements[i] * tolerances[i]
			standardized := (result.ReconciledValues[i] - measurements[i]) / sigma
			w := weight(standardized, cfg)
			if w <= 0 {
				w = 1e-6
			}
			nextTolerances[i] = tolerances[i] / math.Sqrt(w)
			if change := math.Abs(nextTolerances[i] - effectiveTolerances[i]); change > maxChange {
				maxChange = change
			}
		}
		effectiveTolerances = nextTolerances

		if maxChange < cfg.Tolerance {
			converged = true
			break
		}
	}

	weights := make([]float64, len(tolerances))
	for i := range tolerances {
		ratio := tolerances[i] / effectiveTolerances[i]
		weights[i] = ratio * ratio
	}

	return &Result{ReconcileResult: last, Iterations: iterations, Converged: converged, Weights: weights}, nil
}
