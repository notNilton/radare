package drift

import (
	"math/rand"
	"testing"
)

// syntheticResiduals builds a residual series with a stable phase (small noise around
// zero) followed by a gradually growing bias, simulating a sensor drifting out of
// calibration — the scenario a single instantaneous chi-square test cannot catch but a
// sequential detector should.
func syntheticResiduals(stableLen, driftLen int, noiseAmplitude, maxBias float64, seed int64) []float64 {
	rng := rand.New(rand.NewSource(seed))
	series := make([]float64, 0, stableLen+driftLen)
	for i := 0; i < stableLen; i++ {
		series = append(series, (rng.Float64()*2-1)*noiseAmplitude)
	}
	for i := 0; i < driftLen; i++ {
		bias := maxBias * float64(i) / float64(driftLen)
		series = append(series, bias+(rng.Float64()*2-1)*noiseAmplitude)
	}
	return series
}

func TestCUSUMDetectsGradualDriftWithoutFalseAlarm(t *testing.T) {
	const stableLen = 40
	residuals := syntheticResiduals(stableLen, 40, 0.05, 1.0, 7)

	cfg := CUSUMConfig{Target: 0, Slack: 0.05, Threshold: 0.5}
	result := CUSUM(residuals, cfg)

	if result.AlarmIndex == -1 {
		t.Fatal("expected CUSUM to eventually flag the injected drift")
	}
	if result.AlarmIndex < stableLen {
		t.Errorf("expected no false alarm during the stable phase (first %d samples), got alarm at %d", stableLen, result.AlarmIndex)
	}
	if !result.AlarmOnHigh {
		t.Errorf("expected the alarm to fire on the upper sum, since the injected drift is positive")
	}
}

func TestEWMADetectsGradualDriftWithoutFalseAlarm(t *testing.T) {
	const stableLen = 40
	residuals := syntheticResiduals(stableLen, 40, 0.05, 1.0, 7)

	cfg := EWMAConfig{Lambda: 0.2, Target: 0, Sigma: 0.03, L: 3}
	result := EWMA(residuals, cfg)

	if result.AlarmIndex == -1 {
		t.Fatal("expected EWMA to eventually flag the injected drift")
	}
	if result.AlarmIndex < stableLen {
		t.Errorf("expected no false alarm during the stable phase (first %d samples), got alarm at %d", stableLen, result.AlarmIndex)
	}
}

func TestCUSUMNoAlarmOnPureNoise(t *testing.T) {
	residuals := syntheticResiduals(80, 0, 0.05, 0, 11)

	cfg := CUSUMConfig{Target: 0, Slack: 0.05, Threshold: 0.5}
	result := CUSUM(residuals, cfg)

	if result.AlarmIndex != -1 {
		t.Errorf("expected no alarm on pure noise, got alarm at index %d", result.AlarmIndex)
	}
}
