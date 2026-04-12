package main

import (
	"fmt"
	"os"
	"strconv"

	"radare-datarecon/database"
)

func main() {
	command := "version"
	if len(os.Args) > 1 {
		command = os.Args[1]
	}

	switch command {
	// ── CoreDB ────────────────────────────────────────────────────────────────
	case "up":
		db := database.ConnectAndReturn(database.BuildDSNFromEnv())
		must(database.CoreMigrateUp(db), "coredb migration up")
		v, _ := database.CurrentVersion(db)
		fmt.Printf("coredb migrations applied; version: %d\n", v)

	case "down":
		db := database.ConnectAndReturn(database.BuildDSNFromEnv())
		must(database.CoreMigrateDown(db, parseSteps()), "coredb migration down")
		v, _ := database.CurrentVersion(db)
		fmt.Printf("coredb rolled back; version: %d\n", v)

	case "version":
		db := database.ConnectAndReturn(database.BuildDSNFromEnv())
		v, err := database.CurrentVersion(db)
		must(err, "coredb version")
		fmt.Printf("coredb version: %d\n", v)

	case "seed":
		db := database.ConnectAndReturn(database.BuildDSNFromEnv())
		must(database.CoreSeedUp(db), "coredb seed")
		fmt.Println("coredb seed completed")

	// ── LogDB ─────────────────────────────────────────────────────────────────
	// Reads LOG_DB_URL env var; falls back to CoreDB DSN if unset.
	case "log-up":
		db := database.ConnectAndReturn(logDSN())
		must(database.LogMigrateUp(db), "logdb migration up")
		v, _ := database.CurrentVersion(db)
		fmt.Printf("logdb migrations applied; version: %d\n", v)

	case "log-down":
		db := database.ConnectAndReturn(logDSN())
		must(database.LogMigrateDown(db, parseSteps()), "logdb migration down")
		v, _ := database.CurrentVersion(db)
		fmt.Printf("logdb rolled back; version: %d\n", v)

	case "log-version":
		db := database.ConnectAndReturn(logDSN())
		v, err := database.CurrentVersion(db)
		must(err, "logdb version")
		fmt.Printf("logdb version: %d\n", v)

	case "log-seed":
		db := database.ConnectAndReturn(logDSN())
		must(database.LogSeedUp(db), "logdb seed")
		fmt.Println("logdb seed completed")

	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n\n", command)
		fmt.Fprintln(os.Stderr, "CoreDB commands : up, down [n], version, seed")
		fmt.Fprintln(os.Stderr, "LogDB  commands : log-up, log-down [n], log-version, log-seed")
		os.Exit(1)
	}
}

// parseSteps reads an optional step count from the second argument.
func parseSteps() int {
	if len(os.Args) > 2 {
		n, err := strconv.Atoi(os.Args[2])
		if err != nil || n <= 0 {
			fatalf("invalid step count %q\n", os.Args[2])
		}
		return n
	}
	return 1
}

// logDSN returns LOG_DB_URL if set, otherwise the CoreDB DSN.
func logDSN() string {
	if v := os.Getenv("LOG_DB_URL"); v != "" {
		return v
	}
	return database.BuildDSNFromEnv()
}

func must(err error, label string) {
	if err != nil {
		fatalf("%s failed: %v\n", label, err)
	}
}

func fatalf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format, args...)
	os.Exit(1)
}
