package reconciliation

import (
	"encoding/csv"
	"io"
	"strconv"
)

// ParseCSVMeasurements lê medições de um CSV.
func ParseCSVMeasurements(r io.Reader) ([]float64, error) {
	reader := csv.NewReader(r)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}

	var measurements []float64
	for _, record := range records {
		for _, value := range record {
			f, err := strconv.ParseFloat(value, 64)
			if err == nil {
				measurements = append(measurements, f)
			}
		}
	}
	return measurements, nil
}
