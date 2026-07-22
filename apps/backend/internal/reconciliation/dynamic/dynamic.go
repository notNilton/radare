// Package dynamic extends the steady-state reconciliation solver
// (internal/reconciliation.Reconcile) with a lightweight temporal filter across a sequence
// of snapshots, as a first step toward the dynamic reconciliation framework described by
// Kim et al. (1990). It is deliberately NOT a full dynamic (state-space) reconciliation
// model — there is no estimated process-noise covariance or state-transition model — it is
// a recursive EWMA blend of consecutive steady-state solutions, meant to be a baseline to
// beat before investing in a full Kalman-filter formulation. See
// docs/planning/06-PHASE-6-HEURISTIC-OPTIMIZATION.md, Section 3.
package dynamic

import (
	"radare-datarecon/apps/backend/internal/reconciliation"

	"gonum.org/v1/gonum/mat"
)

// Config controls the temporal smoothing applied across snapshots.
type Config struct {
	// Lambda in (0, 1] controls how much weight the newest steady-state solution
	// receives; Lambda=1 reduces to plain per-snapshot steady-state reconciliation with no
	// memory of prior instants.
	Lambda float64
}

// Snapshot is one instant's raw measurements. Tolerances and constraint topology are
// shared across the whole series — a topology change between snapshots is out of scope
// here (see WorkspaceVersioning, Fase 5, for that concern).
type Snapshot struct {
	Measurements []float64
}

// Step is the result for one snapshot in the series.
type Step struct {
	// SteadyState is this instant's plain, memoryless steady-state reconciliation.
	SteadyState *reconciliation.ReconcileResult
	// Smoothed carries an EWMA blend of this instant's steady-state solution with prior
	// instants, intended to reduce measurement noise a purely instantaneous reconciliation
	// would leave in place.
	Smoothed []float64
}

// Reconcile runs steady-state reconciliation independently on each snapshot, then applies
// an EWMA filter across the resulting series.
func Reconcile(snapshots []Snapshot, tolerances []float64, constraints *mat.Dense, cfg Config) ([]Step, error) {
	if len(snapshots) == 0 {
		return nil, nil
	}
	if cfg.Lambda <= 0 || cfg.Lambda > 1 {
		cfg.Lambda = 1
	}

	steps := make([]Step, len(snapshots))
	var smoothed []float64

	for t, snap := range snapshots {
		result, err := reconciliation.Reconcile(snap.Measurements, tolerances, constraints)
		if err != nil {
			return nil, err
		}

		if t == 0 {
			smoothed = append([]float64(nil), result.ReconciledValues...)
		} else {
			next := make([]float64, len(result.ReconciledValues))
			for i, v := range result.ReconciledValues {
				next[i] = cfg.Lambda*v + (1-cfg.Lambda)*smoothed[i]
			}
			smoothed = next
		}

		steps[t] = Step{SteadyState: result, Smoothed: append([]float64(nil), smoothed...)}
	}

	return steps, nil
}
