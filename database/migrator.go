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

// ── Embedded file systems ─────────────────────────────────────────────────────

//go:embed coredb_migrations/*.sql
var coredbMigrationsFS embed.FS

//go:embed logdb_migrations/*.sql
var logdbMigrationsFS embed.FS

//go:embed coredb_seeds/*.sql
var coredbSeedsFS embed.FS

//go:embed logdb_seeds/*.sql
var logdbSeedsFS embed.FS

// migrationsTable tracks applied CoreDB migrations.
const migrationsTable = "schema_migrations"

// logMigrationsTable tracks applied LogDB migrations separately.
// When LogDB is aliased to CoreDB (LOG_DB_URL unset), both sets of migrations
// share the same Postgres instance but use different tracking tables so that
// CoreDB version numbers don't block LogDB migrations from running.
const logMigrationsTable = "log_schema_migrations"

// ── Domain types ──────────────────────────────────────────────────────────────

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

// ── CoreDB migration API ──────────────────────────────────────────────────────

// CoreMigrateUp applies all pending CoreDB migrations.
func CoreMigrateUp(db *gorm.DB) error {
	return MigrateUpWithFS(db, coredbMigrationsFS, "coredb_migrations")
}

// CoreMigrateDown rolls back `steps` CoreDB migrations.
func CoreMigrateDown(db *gorm.DB, steps int) error {
	return MigrateDownWithFS(db, coredbMigrationsFS, "coredb_migrations", steps)
}

// CoreSeedUp seeds the CoreDB with bootstrap fixtures.
func CoreSeedUp(db *gorm.DB) error {
	return seedUpWithFS(db, coredbSeedsFS, "coredb_seeds")
}

// ── LogDB migration API ───────────────────────────────────────────────────────

// LogMigrateUp applies all pending LogDB migrations.
// Uses log_schema_migrations so version numbers don't collide with CoreDB's
// schema_migrations when LOG_DB_URL is unset and both DBs share the same instance.
func LogMigrateUp(db *gorm.DB) error {
	return migrateUpWithTable(db, logdbMigrationsFS, "logdb_migrations", logMigrationsTable)
}

// LogMigrateDown rolls back `steps` LogDB migrations.
func LogMigrateDown(db *gorm.DB, steps int) error {
	return migrateDownWithTable(db, logdbMigrationsFS, "logdb_migrations", steps, logMigrationsTable)
}

// LogSeedUp seeds the LogDB with demo/development observability fixtures.
func LogSeedUp(db *gorm.DB) error {
	return seedUpWithFS(db, logdbSeedsFS, "logdb_seeds")
}

// ── Version inspection ────────────────────────────────────────────────────────

// CurrentVersion returns the highest applied migration version for the given DB.
func CurrentVersion(db *gorm.DB) (int, error) {
	if err := ensureMigrationsTable(db); err != nil {
		return 0, err
	}

	type row struct{ Version int }
	var result row
	err := db.Raw(
		fmt.Sprintf("SELECT COALESCE(MAX(version), 0) AS version FROM %s", migrationsTable),
	).Scan(&result).Error
	return result.Version, err
}

// ── Generic FS-based migration engine ────────────────────────────────────────

// MigrateUpWithFS applies all pending migrations from migFS/dir against db.
func MigrateUpWithFS(db *gorm.DB, migFS embed.FS, dir string) error {
	return migrateUpWithTable(db, migFS, dir, migrationsTable)
}

// MigrateDownWithFS rolls back `steps` migrations from migFS/dir against db.
func MigrateDownWithFS(db *gorm.DB, migFS embed.FS, dir string, steps int) error {
	return migrateDownWithTable(db, migFS, dir, steps, migrationsTable)
}

func migrateUpWithTable(db *gorm.DB, migFS embed.FS, dir string, table string) error {
	migrations, err := loadMigrationsFromFS(migFS, dir)
	if err != nil {
		return err
	}
	if err := ensureMigrationsTableNamed(db, table); err != nil {
		return err
	}
	applied, err := appliedVersionsFromTable(db, table)
	if err != nil {
		return err
	}
	for _, m := range migrations {
		if applied[m.Version] {
			continue
		}
		if err := executeMigrationUpInTable(db, m, table); err != nil {
			return fmt.Errorf("apply migration %03d_%s: %w", m.Version, m.Name, err)
		}
	}
	return nil
}

func migrateDownWithTable(db *gorm.DB, migFS embed.FS, dir string, steps int, table string) error {
	if steps <= 0 {
		steps = 1
	}
	migrations, err := loadMigrationsFromFS(migFS, dir)
	if err != nil {
		return err
	}
	if err := ensureMigrationsTableNamed(db, table); err != nil {
		return err
	}
	applied, err := appliedVersionsFromTable(db, table)
	if err != nil {
		return err
	}

	var toRollback []Migration
	for _, m := range migrations {
		if applied[m.Version] {
			toRollback = append(toRollback, m)
		}
	}
	sort.Slice(toRollback, func(i, j int) bool { return toRollback[i].Version > toRollback[j].Version })
	if len(toRollback) < steps {
		steps = len(toRollback)
	}
	for _, m := range toRollback[:steps] {
		if err := executeMigrationDownInTable(db, m, table); err != nil {
			return fmt.Errorf("rollback migration %03d_%s: %w", m.Version, m.Name, err)
		}
	}
	return nil
}

// ── Internal helpers ──────────────────────────────────────────────────────────

func ensureMigrationsTable(db *gorm.DB) error {
	return ensureMigrationsTableNamed(db, migrationsTable)
}

func ensureMigrationsTableNamed(db *gorm.DB, table string) error {
	return db.Exec(fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS %s (
			version    BIGINT      PRIMARY KEY,
			name       TEXT        NOT NULL,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`, table)).Error
}

func appliedVersions(db *gorm.DB) (map[int]bool, error) {
	return appliedVersionsFromTable(db, migrationsTable)
}

func appliedVersionsFromTable(db *gorm.DB, table string) (map[int]bool, error) {
	type row struct{ Version int }
	var rows []row
	if err := db.Raw(fmt.Sprintf("SELECT version FROM %s", table)).Scan(&rows).Error; err != nil {
		return nil, err
	}
	result := make(map[int]bool, len(rows))
	for _, r := range rows {
		result[r.Version] = true
	}
	return result, nil
}

func executeMigrationUp(db *gorm.DB, m Migration) error {
	return executeMigrationUpInTable(db, m, migrationsTable)
}

func executeMigrationUpInTable(db *gorm.DB, m Migration, table string) error {
	return db.Transaction(func(tx *gorm.DB) error {
		if strings.TrimSpace(m.UpSQL) == "" {
			return fmt.Errorf("missing up SQL for migration %d", m.Version)
		}
		if err := tx.Exec(m.UpSQL).Error; err != nil {
			return err
		}
		return tx.Exec(
			fmt.Sprintf("INSERT INTO %s (version, name, applied_at) VALUES (?, ?, ?)", table),
			m.Version, m.Name, time.Now().UTC(),
		).Error
	})
}

func executeMigrationDown(db *gorm.DB, m Migration) error {
	return executeMigrationDownInTable(db, m, migrationsTable)
}

func executeMigrationDownInTable(db *gorm.DB, m Migration, table string) error {
	return db.Transaction(func(tx *gorm.DB) error {
		if strings.TrimSpace(m.DownSQL) == "" {
			return fmt.Errorf("missing down SQL for migration %d", m.Version)
		}
		if err := tx.Exec(m.DownSQL).Error; err != nil {
			return err
		}
		return tx.Exec(
			fmt.Sprintf("DELETE FROM %s WHERE version = ?", table),
			m.Version,
		).Error
	})
}

func loadMigrationsFromFS(migFS embed.FS, dir string) ([]Migration, error) {
	entries, err := fs.ReadDir(migFS, dir)
	if err != nil {
		return nil, err
	}

	type partial struct {
		version        int
		name           string
		upSQL, downSQL string
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
		content, err := fs.ReadFile(migFS, filepath.ToSlash(filepath.Join(dir, entry.Name())))
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
	for _, p := range parts {
		migrations = append(migrations, Migration{
			Version: p.version, Name: p.name,
			UpSQL: p.upSQL, DownSQL: p.downSQL,
		})
	}
	sort.Slice(migrations, func(i, j int) bool { return migrations[i].Version < migrations[j].Version })
	return migrations, nil
}

func seedUpWithFS(db *gorm.DB, seedFS embed.FS, dir string) error {
	entries, err := fs.ReadDir(seedFS, dir)
	if err != nil {
		return err
	}
	var seeds []Seed
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}
		version, name, _, err := parseVersionedName(entry.Name())
		if err != nil {
			return err
		}
		content, err := fs.ReadFile(seedFS, filepath.ToSlash(filepath.Join(dir, entry.Name())))
		if err != nil {
			return err
		}
		seeds = append(seeds, Seed{Version: version, Name: name, SQL: string(content)})
	}
	sort.Slice(seeds, func(i, j int) bool { return seeds[i].Version < seeds[j].Version })

	for _, s := range seeds {
		if strings.TrimSpace(s.SQL) == "" {
			continue
		}
		if err := db.Exec(s.SQL).Error; err != nil {
			return fmt.Errorf("apply seed %03d_%s: %w", s.Version, s.Name, err)
		}
	}
	return nil
}

func parseVersionedName(filename string) (int, string, string, error) {
	base := strings.TrimSuffix(filename, filepath.Ext(filename))
	parts := strings.Split(base, ".")
	if len(parts) != 2 {
		return 0, "", "", fmt.Errorf("invalid versioned filename %q", filename)
	}
	chunks := strings.SplitN(parts[0], "_", 2)
	if len(chunks) != 2 {
		return 0, "", "", fmt.Errorf("invalid migration identifier %q", filename)
	}
	version, err := strconv.Atoi(chunks[0])
	if err != nil {
		return 0, "", "", fmt.Errorf("invalid migration version in %q: %w", filename, err)
	}
	return version, chunks[1], parts[1], nil
}
