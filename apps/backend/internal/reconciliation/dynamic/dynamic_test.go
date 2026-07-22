package dynamic

import (
	"math"
	"math/rand"
	"testing"

	"gonum.org/v1/gonum/mat"
)

func variance(series []float64, mean float64) float64 {
	sum := 0.0
	for _, v := range series {
		d := v - mean
		sum += d * d
	}
	return sum / float64(len(series))
}

func TestReconcileSmoothingReducesNoiseVersusSteadyStateAlone(t *testing.T) {
	const trueA, trueB, trueC = 100.0, 60.0, 40.0 // constant process: A = B + C
	tolerances := []float64{0.05, 0.05, 0.05}
	constraints := mat.NewDense(1, 3, []float64{1, -1, -1})

	rng := rand.New(rand.NewSource(3))
	const n = 40
	snapshots := make([]Snapshot, n)
	for i := 0; i < n; i++ {
		noise := func(v float64) float64 { return v + (rng.Float64()*2-1)*v*0.03 }
		snapshots[i] = Snapshot{Measurements: []float64{noise(trueA), noise(trueB), noise(trueC)}}
	}

	steps, err := Reconcile(snapshots, tolerances, constraints, Config{Lambda: 0.2})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(steps) != n {
		t.Fatalf("expected %d steps, got %d", n, len(steps))
	}

	steadyStateSeries := make([]float64, n)
	smoothedSeries := make([]float64, n)
	for i, s := range steps {
		steadyStateSeries[i] = s.SteadyState.ReconciledValues[0]
		smoothedSeries[i] = s.Smoothed[0]
	}

	steadyVar := variance(steadyStateSeries, trueA)
	smoothedVar := variance(smoothedSeries, trueA)

	if smoothedVar >= steadyVar {
		t.Errorf("expected temporal smoothing to reduce variance around the true value: steady-state var=%f, smoothed var=%f", steadyVar, smoothedVar)
	}
}

func TestReconcileLambdaOneMatchesSteadyStateAlone(t *testing.T) {
	tolerances := []float64{0.05, 0.05, 0.05}
	constraints := mat.NewDense(1, 3, []float64{1, -1, -1})
	snapshots := []Snapshot{
		{Measurements: []float64{100, 60, 40}},
		{Measurements: []float64{105, 62, 41}},
	}

	steps, err := Reconcile(snapshots, tolerances, constraints, Config{Lambda: 1})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	for i, s := range steps {
		for j := range s.SteadyState.ReconciledValues {
			if math.Abs(s.Smoothed[j]-s.SteadyState.ReconciledValues[j]) > 1e-9 {
				t.Errorf("step %d var %d: expected Smoothed to equal SteadyState when Lambda=1", i, j)
			}
		}
	}
}

func TestReconcileEmptySnapshots(t *testing.T) {
	steps, err := Reconcile(nil, []float64{0.05}, mat.NewDense(1, 1, []float64{1}), Config{Lambda: 0.5})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if steps != nil {
		t.Errorf("expected nil steps for an empty snapshot series, got %v", steps)
	}
}
