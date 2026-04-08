package database

import (
	"embed"
	"fmt"
	"io/fs"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

//go:embed seeds/*.sql
var seedsFS embed.FS

const migrationsTable = "schema_migrations"

type Migration struct {
	Version int
	Name    string
	UpSQL   string
	DownSQL string
}

type Seed struct {
	Version int
	Name    string
	SQL     string
}

func MigrateUp(db *gorm.DB) error {
	migrations, err := loadMigrations()
	if err != nil {
		return err
	}

	if err := ensureMigrationsTable(db); err != nil {
		return err
	}

	applied, err := appliedVersions(db)
	if err != nil {
		return err
	}

	for _, migration := range migrations {
		if applied[migration.Version] {
			continue
		}

		if err := executeMigrationUp(db, migration); err != nil {
			return fmt.Errorf("apply migration %03d_%s: %w", migration.Version, migration.Name, err)
		}
	}

	return nil
}

func MigrateDown(db *gorm.DB, steps int) error {
	if steps <= 0 {
		steps = 1
	}

	migrations, err := loadMigrations()
	if err != nil {
		return err
	}

	if err := ensureMigrationsTable(db); err != nil {
		return err
	}

	applied, err := appliedVersions(db)
	if err != nil {
		return err
	}

	var pendingRollback []Migration
	for _, migration := range migrations {
		if applied[migration.Version] {
			pendingRollback = append(pendingRollback, migration)
		}
	}

	sort.Slice(pendingRollback, func(i, j int) bool {
		return pendingRollback[i].Version > pendingRollback[j].Version
	})

	if len(pendingRollback) < steps {
		steps = len(pendingRollback)
	}

	for _, migration := range pendingRollback[:steps] {
		if err := executeMigrationDown(db, migration); err != nil {
			return fmt.Errorf("rollback migration %03d_%s: %w", migration.Version, migration.Name, err)
		}
	}

	return nil
}

func CurrentVersion(db *gorm.DB) (int, error) {
	if err := ensureMigrationsTable(db); err != nil {
		return 0, err
	}

	type row struct {
		Version int
	}

	var result row
	err := db.Raw(
		fmt.Sprintf("SELECT version FROM %s ORDER BY version DESC LIMIT 1", migrationsTable),
	).Scan(&result).Error
	if err != nil {
		return 0, err
	}

	return result.Version, nil
}

func SeedUp(db *gorm.DB) error {
	seeds, err := loadSeeds()
	if err != nil {
		return err
	}

	for _, seed := range seeds {
		if strings.TrimSpace(seed.SQL) == "" {
			continue
		}
		if err := db.Exec(seed.SQL).Error; err != nil {
			return fmt.Errorf("apply seed %03d_%s: %w", seed.Version, seed.Name, err)
		}
	}

	return nil
}

func ensureMigrationsTable(db *gorm.DB) error {
	return db.Exec(fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s (
			version BIGINT PRIMARY KEY,
			name TEXT NOT NULL,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`, migrationsTable)).Error
}

func appliedVersions(db *gorm.DB) (map[int]bool, error) {
	type row struct {
		Version int
	}

	var rows []row
	if err := db.Raw(fmt.Sprintf("SELECT version FROM %s", migrationsTable)).Scan(&rows).Error; err != nil {
		return nil, err
	}

	result := make(map[int]bool, len(rows))
	for _, row := range rows {
		result[row.Version] = true
	}

	return result, nil
}

func executeMigrationUp(db *gorm.DB, migration Migration) error {
	return db.Transaction(func(tx *gorm.DB) error {
		if strings.TrimSpace(migration.UpSQL) == "" {
			return fmt.Errorf("missing up SQL")
		}

		if err := tx.Exec(migration.UpSQL).Error; err != nil {
			return err
		}

		return tx.Exec(
			fmt.Sprintf("INSERT INTO %s (version, name, applied_at) VALUES (?, ?, ?)", migrationsTable),
			migration.Version,
			migration.Name,
			time.Now().UTC(),
		).Error
	})
}

func executeMigrationDown(db *gorm.DB, migration Migration) error {
	return db.Transaction(func(tx *gorm.DB) error {
		if strings.TrimSpace(migration.DownSQL) == "" {
			return fmt.Errorf("missing down SQL")
		}

		if err := tx.Exec(migration.DownSQL).Error; err != nil {
			return err
		}

		return tx.Exec(
			fmt.Sprintf("DELETE FROM %s WHERE version = ?", migrationsTable),
			migration.Version,
		).Error
	})
}

func loadMigrations() ([]Migration, error) {
	entries, err := fs.ReadDir(migrationsFS, "migrations")
	if err != nil {
		return nil, err
	}

	type partial struct {
		version int
		name    string
		upSQL   string
		downSQL string
	}

	parts := map[string]*partial{}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}

		version, name, direction, err := parseVersionedName(entry.Name())
		if err != nil {
			return nil, err
		}

		content, err := fs.ReadFile(migrationsFS, filepath.ToSlash(filepath.Join("migrations", entry.Name())))
		if err != nil {
			return nil, err
		}

		key := fmt.Sprintf("%03d_%s", version, name)
		if parts[key] == nil {
			parts[key] = &partial{version: version, name: name}
		}

		switch direction {
		case "up":
			parts[key].upSQL = string(content)
		case "down":
			parts[key].downSQL = string(content)
		}
	}

	migrations := make([]Migration, 0, len(parts))
	for _, part := range parts {
		migrations = append(migrations, Migration{
			Version: part.version,
			Name:    part.name,
			UpSQL:   part.upSQL,
			DownSQL: part.downSQL,
		})
	}

	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Version < migrations[j].Version
	})

	return migrations, nil
}

func loadSeeds() ([]Seed, error) {
	entries, err := fs.ReadDir(seedsFS, "seeds")
	if err != nil {
		return nil, err
	}

	var seeds []Seed
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}

		version, name, _, err := parseVersionedName(entry.Name())
		if err != nil {
			return nil, err
		}

		content, err := fs.ReadFile(seedsFS, filepath.ToSlash(filepath.Join("seeds", entry.Name())))
		if err != nil {
			return nil, err
		}

		seeds = append(seeds, Seed{
			Version: version,
			Name:    name,
			SQL:     string(content),
		})
	}

	sort.Slice(seeds, func(i, j int) bool {
		return seeds[i].Version < seeds[j].Version
	})

	return seeds, nil
}

func parseVersionedName(filename string) (int, string, string, error) {
	base := strings.TrimSuffix(filename, filepath.Ext(filename))
	parts := strings.Split(base, ".")
	if len(parts) != 2 {
		return 0, "", "", fmt.Errorf("invalid versioned filename %q", filename)
	}

	versionAndName := parts[0]
	direction := parts[1]
	chunks := strings.SplitN(versionAndName, "_", 2)
	if len(chunks) != 2 {
		return 0, "", "", fmt.Errorf("invalid migration identifier %q", filename)
	}

	version, err := strconv.Atoi(chunks[0])
	if err != nil {
		return 0, "", "", fmt.Errorf("invalid migration version in %q: %w", filename, err)
	}

	return version, chunks[1], direction, nil
}
