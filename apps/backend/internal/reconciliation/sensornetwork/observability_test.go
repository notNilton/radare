package sensornetwork

import (
	"testing"

	"gonum.org/v1/gonum/mat"
)

// splitterConstraints models A - B - C = 0 (a splitter node) chained with B - D = 0
// (a downstream measurement point), variables ordered [A, B, C, D].
func splitterConstraints() *mat.Dense {
	return mat.NewDense(2, 4, []float64{
		1, -1, -1, 0,
		0, 1, 0, -1,
	})
}

func TestAnalyzeFullyObservableWithEndpointSensors(t *testing.T) {
	// A and D measured: B resolves via eq2 (B-D=0), then C resolves via eq1 (A-B-C=0).
	measured := []bool{true, false, false, true}

	report, err := Analyze(splitterConstraints(), measured)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(report.Unobservable) != 0 {
		t.Errorf("expected full observability, got unobservable variables: %v", report.Unobservable)
	}
	if report.Redundancy != 0 {
		t.Errorf("expected zero redundancy (both equations needed to resolve B and C), got %d", report.Redundancy)
	}
}

func TestAnalyzeUnderInstrumented(t *testing.T) {
	// Only A measured: neither equation ever has exactly one unknown, so nothing resolves.
	measured := []bool{true, false, false, false}

	report, err := Analyze(splitterConstraints(), measured)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(report.Unobservable) != 3 {
		t.Errorf("expected B, C and D to be unobservable, got %v", report.Unobservable)
	}
	if report.Redundancy != 0 {
		t.Errorf("expected zero redundancy when no equation can be resolved, got %d", report.Redundancy)
	}
}

func TestAnalyzeOverInstrumentedYieldsRedundancy(t *testing.T) {
	// All four variables measured: both equations become pure cross-checks.
	measured := []bool{true, true, true, true}

	report, err := Analyze(splitterConstraints(), measured)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(report.Unobservable) != 0 {
		t.Errorf("expected full observability, got unobservable variables: %v", report.Unobservable)
	}
	if report.Redundancy != 2 {
		t.Errorf("expected both equations to become redundant cross-checks, got redundancy %d", report.Redundancy)
	}
}

func TestSuggestSensorsAchievesFullObservability(t *testing.T) {
	measured := []bool{true, false, false, false}
	constraints := splitterConstraints()

	suggestions, err := SuggestSensors(constraints, measured, 1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(suggestions) != 1 {
		t.Fatalf("expected exactly one suggestion, got %v", suggestions)
	}

	augmented := append([]bool(nil), measured...)
	augmented[suggestions[0]] = true

	report, err := Analyze(constraints, augmented)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(report.Unobservable) != 0 {
		t.Errorf("expected the suggested sensor to achieve full observability, still unobservable: %v", report.Unobservable)
	}
}

func TestAnalyzeRejectsMaskLengthMismatch(t *testing.T) {
	_, err := Analyze(splitterConstraints(), []bool{true, false})
	if err == nil {
		t.Fatal("expected an error for mismatched mask length, got nil")
	}
}
