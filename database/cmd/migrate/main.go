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

	db := database.Connect(database.BuildDSNFromEnv())

	switch command {
	case "up":
		if err := database.MigrateUp(db); err != nil {
			fmt.Fprintf(os.Stderr, "migration up failed: %v\n", err)
			os.Exit(1)
		}
		version, _ := database.CurrentVersion(db)
		fmt.Printf("migrations applied successfully; current version: %d\n", version)
	case "down":
		steps := 1
		if len(os.Args) > 2 {
			parsed, err := strconv.Atoi(os.Args[2])
			if err != nil || parsed <= 0 {
				fmt.Fprintf(os.Stderr, "invalid rollback steps %q\n", os.Args[2])
				os.Exit(1)
			}
			steps = parsed
		}

		if err := database.MigrateDown(db, steps); err != nil {
			fmt.Fprintf(os.Stderr, "migration down failed: %v\n", err)
			os.Exit(1)
		}
		version, _ := database.CurrentVersion(db)
		fmt.Printf("rolled back %d migration(s); current version: %d\n", steps, version)
	case "version":
		version, err := database.CurrentVersion(db)
		if err != nil {
			fmt.Fprintf(os.Stderr, "failed to inspect current version: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("current migration version: %d\n", version)
	case "seed":
		if err := database.SeedUp(db); err != nil {
			fmt.Fprintf(os.Stderr, "seed failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("seed completed successfully")
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n", command)
		fmt.Fprintln(os.Stderr, "supported commands: up, down [steps], version, seed")
		os.Exit(1)
	}
}
