// Package sensornetwork classifies observability and redundancy for a measurement network
// defined by linear balance equations (B*x = 0), and greedily recommends where to add
// sensors under a budget. It implements the classical sequential-elimination method for
// observability classification (cf. Kretsovalis & Mah, 1987; Stanley & Mah, 1981) and
// treats sensor placement as the cost/precision trade-off studied by Kelly (1988) and
// Bagajewicz (2000) — see docs/planning/06-PHASE-6-HEURISTIC-OPTIMIZATION.md, Section 5.
package sensornetwork

import (
	"errors"

	"gonum.org/v1/gonum/mat"
)

// Report summarizes which variables can be determined (directly measured, or calculable
// from the balance equations given the measured ones) and how much redundancy is left
// over once every determinable variable has been resolved.
type Report struct {
	// Observable[i] is true if variable i is measured, or can be uniquely calculated from
	// the balance equations given the measured variables.
	Observable []bool
	// Unobservable lists the indices of variables that remain unknown even after
	// elimination — no combination of sensors and equations determines them.
	Unobservable []int
	// Redundancy is the number of balance equations left over after resolving every
	// determinable variable — each one is an independent cross-check that lets a gross
	// error be detected (Madron, 1992; Veverka & Madron, 1997).
	Redundancy int
}

// Analyze classifies a network's observability and computes its redundancy degree via
// sequential elimination: repeatedly scan equations for one with exactly one remaining
// unknown, resolve it, and repeat until no further progress is made. An equation left with
// zero unknowns is a redundant cross-check; one left with two or more unknowns and no path
// to resolution marks its variables (that aren't otherwise resolved) as unobservable.
func Analyze(constraints *mat.Dense, measured []bool) (*Report, error) {
	numConstraints, numVars := constraints.Dims()
	if len(measured) != numVars {
		return nil, errors.New("measured mask length must match the number of variables")
	}

	known := append([]bool(nil), measured...)
	usedEquation := make([]bool, numConstraints)
	redundancy := 0

	progress := true
	for progress {
		progress = false
		for r := 0; r < numConstraints; r++ {
			if usedEquation[r] {
				continue
			}
			unknownCol, unknownCount := -1, 0
			for c := 0; c < numVars; c++ {
				if known[c] {
					continue
				}
				if constraints.At(r, c) != 0 {
					unknownCount++
					unknownCol = c
				}
			}
			switch unknownCount {
			case 1:
				known[unknownCol] = true
				usedEquation[r] = true
				progress = true
			case 0:
				usedEquation[r] = true
				redundancy++
				progress = true
			}
		}
	}

	var unobservable []int
	for c, k := range known {
		if !k {
			unobservable = append(unobservable, c)
		}
	}

	return &Report{Observable: known, Unobservable: unobservable, Redundancy: redundancy}, nil
}

// SuggestSensors greedily recommends up to budget additional sensor placements (among
// currently unmeasured variables) that maximize the resulting redundancy degree — a
// simplified, computational analogue of instrumentation network design under a fixed
// sensor budget.
func SuggestSensors(constraints *mat.Dense, measured []bool, budget int) ([]int, error) {
	current := append([]bool(nil), measured...)
	suggestions := make([]int, 0, budget)

	for step := 0; step < budget; step++ {
		bestCandidate, bestRedundancy := -1, -1
		for c, isMeasured := range current {
			if isMeasured {
				continue
			}
			trial := append([]bool(nil), current...)
			trial[c] = true
			report, err := Analyze(constraints, trial)
			if err != nil {
				return nil, err
			}
			if report.Redundancy > bestRedundancy {
				bestRedundancy, bestCandidate = report.Redundancy, c
			}
		}
		if bestCandidate == -1 {
			break
		}
		current[bestCandidate] = true
		suggestions = append(suggestions, bestCandidate)
	}

	return suggestions, nil
}
