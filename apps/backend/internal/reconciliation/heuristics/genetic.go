// Package heuristics implements a real-coded genetic algorithm (GA) solver for the same
// weighted-least-squares reconciliation problem solved analytically by
// internal/reconciliation.Reconcile via Lagrange multipliers. Unlike the closed-form
// solver, this one tolerates inequality bounds per variable and does not require the
// augmented weight/constraint matrix to be invertible — see
// docs/planning/06-PHASE-6-HEURISTIC-OPTIMIZATION.md, Sections 1 and 2.
package heuristics

import (
	"errors"
	"fmt"
	"math"
	"math/rand"

	"gonum.org/v1/gonum/mat"
)

// Bounds restricts a variable to the closed interval [Min, Max].
type Bounds struct {
	Min float64
	Max float64
}

// Unbounded returns a Bounds value that never contributes a penalty.
func Unbounded() Bounds {
	return Bounds{Min: math.Inf(-1), Max: math.Inf(1)}
}

// Violation returns how far x lies outside [Min, Max], or 0 if x is within bounds.
func (b Bounds) Violation(x float64) float64 {
	if x < b.Min {
		return b.Min - x
	}
	if x > b.Max {
		return x - b.Max
	}
	return 0
}

// Config controls the GA's population dynamics and constraint penalties.
type Config struct {
	PopulationSize int
	Generations    int
	CrossoverRate  float64
	MutationRate   float64
	// MutationSigma is the gaussian mutation step size, as a fraction of each variable's
	// search range (which itself is derived from its measurement tolerance).
	MutationSigma float64
	// ConstraintPenalty weighs violations of the linear equality constraints (B*x = 0).
	ConstraintPenalty float64
	// BoundsPenalty weighs violations of per-variable inequality bounds.
	BoundsPenalty float64
	// Seed makes runs reproducible, per the reproducibility protocol in
	// docs/planning/06-PHASE-6-HEURISTIC-OPTIMIZATION.md Section 0.5.
	Seed int64
}

// DefaultConfig returns reasonable defaults for small-to-medium reconciliation problems.
func DefaultConfig() Config {
	return Config{
		PopulationSize:    80,
		Generations:       200,
		CrossoverRate:     0.8,
		MutationRate:      0.1,
		MutationSigma:     0.05,
		ConstraintPenalty: 1e4,
		BoundsPenalty:     1e4,
		Seed:              42,
	}
}

// Result carries the best individual found and its fitness history, which supports the
// convergence plot referenced in the Fase 6 planning doc.
type Result struct {
	Values         []float64
	Fitness        float64
	Generations    int
	FitnessHistory []float64
}

// Solve finds a weighted-least-squares solution to measurements, subject to linear
// equality constraints (constraints*x = 0, pass nil for none) and optional per-variable
// inequality bounds (pass nil for none).
func Solve(measurements, tolerances []float64, constraints *mat.Dense, bounds []Bounds, cfg Config) (*Result, error) {
	n := len(measurements)
	if n == 0 {
		return nil, errors.New("measurements cannot be empty")
	}
	if len(tolerances) != n {
		return nil, fmt.Errorf("dimension mismatch: measurements (%d) vs tolerances (%d)", n, len(tolerances))
	}
	if bounds != nil && len(bounds) != n {
		return nil, fmt.Errorf("dimension mismatch: measurements (%d) vs bounds (%d)", n, len(bounds))
	}
	if cfg.PopulationSize <= 1 {
		return nil, errors.New("population size must be greater than 1")
	}

	numConstraints := 0
	if constraints != nil {
		var cCols int
		numConstraints, cCols = constraints.Dims()
		if cCols != n {
			return nil, fmt.Errorf("dimension mismatch: constraint columns (%d) vs measurements (%d)", cCols, n)
		}
	}

	weights := make([]float64, n)
	searchRange := make([]float64, n)
	for i := range measurements {
		sigma := measurements[i] * tolerances[i]
		if sigma == 0 {
			return nil, fmt.Errorf("absolute tolerance for measurement %d is zero", i)
		}
		weights[i] = 1 / (sigma * sigma)
		searchRange[i] = math.Abs(sigma) * 6
		if searchRange[i] == 0 {
			searchRange[i] = 1
		}
	}

	fitness := func(x []float64) float64 {
		cost := 0.0
		for i := range x {
			d := x[i] - measurements[i]
			cost += weights[i] * d * d
		}
		if numConstraints > 0 {
			xVec := mat.NewVecDense(n, x)
			var residual mat.VecDense
			residual.MulVec(constraints, xVec)
			for i := 0; i < numConstraints; i++ {
				v := residual.AtVec(i)
				cost += cfg.ConstraintPenalty * v * v
			}
		}
		if bounds != nil {
			for i, b := range bounds {
				if v := b.Violation(x[i]); v > 0 {
					cost += cfg.BoundsPenalty * v * v
				}
			}
		}
		return cost
	}

	rng := rand.New(rand.NewSource(cfg.Seed))

	pop := make([][]float64, cfg.PopulationSize)
	popFitness := make([]float64, cfg.PopulationSize)
	for p := range pop {
		ind := make([]float64, n)
		for i := range ind {
			ind[i] = measurements[i] + (rng.Float64()*2-1)*searchRange[i]
		}
		pop[p] = ind
		popFitness[p] = fitness(ind)
	}

	best := append([]float64(nil), pop[0]...)
	bestFitness := popFitness[0]
	for p := 1; p < cfg.PopulationSize; p++ {
		if popFitness[p] < bestFitness {
			bestFitness = popFitness[p]
			best = append([]float64(nil), pop[p]...)
		}
	}

	tournament := func() []float64 {
		a := rng.Intn(cfg.PopulationSize)
		b := rng.Intn(cfg.PopulationSize)
		if popFitness[a] <= popFitness[b] {
			return pop[a]
		}
		return pop[b]
	}

	history := make([]float64, 0, cfg.Generations)
	for gen := 0; gen < cfg.Generations; gen++ {
		newPop := make([][]float64, cfg.PopulationSize)
		newFitness := make([]float64, cfg.PopulationSize)
		for p := 0; p < cfg.PopulationSize; p++ {
			parentA := tournament()
			parentB := tournament()
			child := make([]float64, n)
			for i := 0; i < n; i++ {
				if rng.Float64() < cfg.CrossoverRate {
					alpha := rng.Float64()
					child[i] = alpha*parentA[i] + (1-alpha)*parentB[i]
				} else {
					child[i] = parentA[i]
				}
				if rng.Float64() < cfg.MutationRate {
					child[i] += rng.NormFloat64() * cfg.MutationSigma * searchRange[i]
				}
			}
			newPop[p] = child
			newFitness[p] = fitness(child)
			if newFitness[p] < bestFitness {
				bestFitness = newFitness[p]
				best = append([]float64(nil), child...)
			}
		}
		pop, popFitness = newPop, newFitness
		history = append(history, bestFitness)
	}

	return &Result{
		Values:         best,
		Fitness:        bestFitness,
		Generations:    cfg.Generations,
		FitnessHistory: history,
	}, nil
}
