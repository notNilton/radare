package main

import (
	"fmt"
	"os"
)

func main() {
	command := "version"
	if len(os.Args) > 1 {
		command = os.Args[1]
	}

	switch command {
	case "up", "down", "drop", "version", "seed":
		fmt.Printf("database migrate: command %q acknowledged; migrations scaffold is ready for implementation\n", command)
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n", command)
		os.Exit(1)
	}
}
