package reconciliation

import (
	"math"
	"testing"

	"gonum.org/v1/gonum/mat"
)

// A função auxiliar 'equal' compara dois slices de float64 com uma tolerância.
func equal(a, b []float64, tol float64) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if math.Abs(a[i]-b[i]) > tol {
			return false
		}
	}
	return true
}

func TestReconcile(t *testing.T) {
	t.Run("Exemplo 2 do Documento", func(t *testing.T) {
		measurements := []float64{161, 79, 80}
		tolerances := []float64{0.05, 0.01, 0.01}
		constraintsData := []float64{1, -1, -1}
		constraints := mat.NewDense(1, 3, constraintsData)

		expected := []float64{159.0383, 79.0189, 80.0194}

		result, err := Reconcile(measurements, tolerances, constraints)
		if err != nil {
			t.Fatalf("A função Reconcile retornou um erro inesperado: %v", err)
		}

		if !equal(result.ReconciledValues, expected, 1e-4) {
			t.Errorf("O resultado reconciliado estava incorreto.\nEsperado: %v\nObtido:   %v", expected, result.ReconciledValues)
		}

		if result.DegreesOfFreedom != 1 {
			t.Errorf("Graus de liberdade incorretos. Esperado: 1, Obtido: %d", result.DegreesOfFreedom)
		}

		if result.ChiSquare <= 0 {
			t.Errorf("ChiSquare deve ser positivo. Obtido: %f", result.ChiSquare)
		}
	})

	t.Run("Matriz Singular", func(t *testing.T) {
		measurements := []float64{100, 100}
		tolerances := []float64{0.01, 0.01}
		// Esta restrição resultará em uma matriz de pesos singular porque as colunas são linearmente dependentes.
		constraintsData := []float64{1, 1, 1, 1}
		constraints := mat.NewDense(2, 2, constraintsData)

		_, err := Reconcile(measurements, tolerances, constraints)
		if err == nil {
			t.Error("Esperava-se um erro para uma matriz de pesos singular, mas nenhum foi retornado")
		}
	})

	t.Run("Incompatibilidade de Dimensão", func(t *testing.T) {
		measurements := []float64{100, 50}
		tolerances := []float64{0.01}
		constraints := mat.NewDense(1, 2, []float64{1, -1})

		_, err := Reconcile(measurements, tolerances, constraints)
		if err == nil {
			t.Error("Esperava-se um erro de incompatibilidade de dimensão, mas nenhum foi retornado")
		}
	})
}

func TestIsConsistent(t *testing.T) {
	tests := []struct {
		name      string
		chiSquare float64
		df        int
		alpha     float64
		want      bool
	}{
		{"Consistente df=1", 2.0, 1, 0.05, true},
		{"Inconsistente df=1", 5.0, 1, 0.05, false},
		{"Consistente df=3", 5.0, 3, 0.05, true},
		{"Inconsistente df=3", 10.0, 3, 0.05, false},
		{"Alfa Padrão", 2.0, 1, 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := IsConsistent(tt.chiSquare, tt.df, tt.alpha); got != tt.want {
				t.Errorf("IsConsistent() = %v, want %v", got, tt.want)
			}
		})
	}
}
