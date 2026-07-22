package robust

import (
	"math"
	"testing"

	"radare-datarecon/apps/backend/internal/reconciliation"

	"gonum.org/v1/gonum/mat"
)

// TestReconcileDownweightsWorstOffender is self-verifying: iteration 1 of IRLS is
// mathematically identical to plain OLS (reconciliation.Reconcile), so the measurement
// with the largest standardized residual under OLS is guaranteed — by construction of the
// monotonically non-increasing weight functions — to end up with the smallest final
// weight. This avoids relying on brittle, hand-computed expected values.
func TestReconcileDownweightsWorstOffender(t *testing.T) {
	measurements := []float64{100, 60, 10} // splitter x0 = x1 + x2; badly imbalanced (30 units off)
	tolerances := []float64{0.02, 0.02, 0.02}
	constraints := mat.NewDense(1, 3, []float64{1, -1, -1})

	baseline, err := reconciliation.Reconcile(measurements, tolerances, constraints)
	if err != nil {
		t.Fatalf("baseline reconcile failed: %v", err)
	}

	worst, worstZ := 0, -1.0
	for i := range measurements {
		sigma := measurements[i] * tolerances[i]
		z := math.Abs((baseline.ReconciledValues[i] - measurements[i]) / sigma)
		if z > worstZ {
			worstZ, worst = z, i
		}
	}

	for _, estimator := range []EstimatorType{Huber, Fair} {
		result, err := Reconcile(measurements, tolerances, constraints, DefaultConfig(estimator))
		if err != nil {
			t.Fatalf("IRLS failed for estimator %v: %v", estimator, err)
		}
		if !result.Converged {
			t.Fatalf("expected IRLS to converge for estimator %v within %d iterations", estimator, result.Iterations)
		}

		minIdx := 0
		for i, w := range result.Weights {
			if w < result.Weights[minIdx] {
				minIdx = i
			}
		}
		if minIdx != worst {
			t.Errorf("estimator %v: expected measurement %d (worst OLS offender) to be down-weighted most, got %d", estimator, worst, minIdx)
		}
		if result.Weights[minIdx] >= 0.99 {
			t.Errorf("estimator %v: expected the inconsistent measurement to be meaningfully down-weighted, got weight %f", estimator, result.Weights[minIdx])
		}
	}
}

func TestReconcileConvergesWithoutGrossError(t *testing.T) {
	measurements := []float64{100, 60, 40} // perfectly balanced: x0 = x1 + x2
	tolerances := []float64{0.02, 0.02, 0.02}
	constraints := mat.NewDense(1, 3, []float64{1, -1, -1})

	result, err := Reconcile(measurements, tolerances, constraints, DefaultConfig(Huber))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !result.Converged {
		t.Fatalf("expected convergence for a consistent dataset")
	}
	for i, w := range result.Weights {
		if w < 0.9 {
			t.Errorf("measurement %d: expected weight near 1 for a consistent dataset, got %f", i, w)
		}
	}
}
