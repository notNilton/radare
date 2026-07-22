// Package drift implements sequential change-detection statistics (CUSUM and EWMA control
// charts) over a sensor's reconciliation residual history, to catch gradual precision
// degradation that the instantaneous chi-square Global Test (Fase 4) cannot see — see
// docs/planning/06-PHASE-6-HEURISTIC-OPTIMIZATION.md, Section 4 (H2).
package drift

import "math"

// CUSUMConfig configures a tabular (two-sided) CUSUM detector.
type CUSUMConfig struct {
	// Target is the in-control mean of the residual (normally 0 for an unbiased sensor).
	Target float64
	// Slack (k) is the allowed drift per sample before it accumulates, typically 0.5*sigma.
	Slack float64
	// Threshold (h) triggers an alarm once the cumulative sum exceeds it, typically 4-5*sigma.
	Threshold float64
}

// CUSUMResult reports the running sums and the first sample index where an alarm fired.
type CUSUMResult struct {
	Upper       []float64
	Lower       []float64
	AlarmIndex  int // -1 if no alarm fired
	AlarmOnHigh bool
}

// CUSUM runs a two-sided cumulative sum control chart over a residual series.
func CUSUM(residuals []float64, cfg CUSUMConfig) CUSUMResult {
	upper := make([]float64, len(residuals))
	lower := make([]float64, len(residuals))
	result := CUSUMResult{Upper: upper, Lower: lower, AlarmIndex: -1}

	prevUpper, prevLower := 0.0, 0.0
	for i, r := range residuals {
		deviation := r - cfg.Target
		su := math.Max(0, prevUpper+deviation-cfg.Slack)
		sl := math.Max(0, prevLower-deviation-cfg.Slack)
		upper[i], lower[i] = su, sl
		prevUpper, prevLower = su, sl

		if result.AlarmIndex == -1 {
			if su > cfg.Threshold {
				result.AlarmIndex, result.AlarmOnHigh = i, true
			} else if sl > cfg.Threshold {
				result.AlarmIndex, result.AlarmOnHigh = i, false
			}
		}
	}
	return result
}

// EWMAConfig configures an exponentially weighted moving average control chart.
type EWMAConfig struct {
	// Lambda is the smoothing factor in (0, 1]; smaller values weigh history more heavily,
	// catching slower drifts at the cost of detection latency.
	Lambda float64
	// Target is the in-control mean of the residual.
	Target float64
	// Sigma is the in-control standard deviation of the residual.
	Sigma float64
	// L is the control-limit width in standard deviations (typically 2.7-3.0).
	L float64
}

// EWMAResult reports the smoothed statistic series and the first alarm index.
type EWMAResult struct {
	Statistic  []float64
	UpperLimit []float64
	LowerLimit []float64
	AlarmIndex int
}

// EWMA runs an exponentially weighted moving average control chart with the standard
// time-varying (asymptotic) control limits.
func EWMA(residuals []float64, cfg EWMAConfig) EWMAResult {
	n := len(residuals)
	stat := make([]float64, n)
	upper := make([]float64, n)
	lower := make([]float64, n)
	result := EWMAResult{Statistic: stat, UpperLimit: upper, LowerLimit: lower, AlarmIndex: -1}

	z := cfg.Target
	for i, r := range residuals {
		z = cfg.Lambda*r + (1-cfg.Lambda)*z
		stat[i] = z

		variance := (cfg.Lambda / (2 - cfg.Lambda)) * (1 - math.Pow(1-cfg.Lambda, 2*float64(i+1)))
		width := cfg.L * cfg.Sigma * math.Sqrt(variance)
		upper[i] = cfg.Target + width
		lower[i] = cfg.Target - width

		if result.AlarmIndex == -1 && (z > upper[i] || z < lower[i]) {
			result.AlarmIndex = i
		}
	}
	return result
}
