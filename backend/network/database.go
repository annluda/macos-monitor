package network

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

const (
	dbFileName    = "network_stats.db"
	trafficTableStmt = `
	CREATE TABLE IF NOT EXISTS daily_traffic (
		date TEXT PRIMARY KEY,
		first_bytes_recv INTEGER NOT NULL,
		first_bytes_sent INTEGER NOT NULL,
		last_bytes_recv  INTEGER NOT NULL,
		last_bytes_sent  INTEGER NOT NULL,
		timestamp INTEGER NOT NULL
	);`
)

// DBManager handles database operations for network statistics.
type DBManager struct {
	db *sql.DB
}

// NewDBManager creates and initializes a new DBManager.
func NewDBManager() (*DBManager, error) {
	db, err := sql.Open("sqlite3", dbFileName)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if _, err := db.Exec(trafficTableStmt); err != nil {
		return nil, fmt.Errorf("failed to create traffic table: %w", err)
	}

	return &DBManager{db: db}, nil
}

// Close closes the database connection.
func (m *DBManager) Close() {
	m.db.Close()
}

// UpdateSample persists the current cumulative network stats.
func (m *DBManager) UpdateSample(stats IOStats) error {
	date := time.Now().Format("2006-01-02")
	var count int
	err := m.db.QueryRow("SELECT COUNT(*) FROM daily_traffic WHERE date = ?", date).Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to query for date: %w", err)
	}

	tx, err := m.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	if count == 0 {
		// First sample of the day
		stmt, err := tx.Prepare(`
			INSERT INTO daily_traffic (date, first_bytes_recv, first_bytes_sent, last_bytes_recv, last_bytes_sent, timestamp)
			VALUES (?, ?, ?, ?, ?, ?)
		`)
		if err != nil {
			return fmt.Errorf("failed to prepare insert statement: %w", err)
		}
		defer stmt.Close()
		_, err = stmt.Exec(date, stats.BytesRecv, stats.BytesSent, stats.BytesRecv, stats.BytesSent, stats.Time.Unix())
		if err != nil {
			return fmt.Errorf("failed to execute insert: %w", err)
		}
	} else {
		// Subsequent sample of the day
		stmt, err := tx.Prepare(`
			UPDATE daily_traffic
			SET last_bytes_recv = ?, last_bytes_sent = ?, timestamp = ?
			WHERE date = ?
		`)
		if err != nil {
			return fmt.Errorf("failed to prepare update statement: %w", err)
		}
		defer stmt.Close()
		_, err = stmt.Exec(stats.BytesRecv, stats.BytesSent, stats.Time.Unix(), date)
		if err != nil {
			return fmt.Errorf("failed to execute update: %w", err)
		}
	}

	return tx.Commit()
}

// GetDailyTrafficForLast7Days retrieves aggregated traffic data for the past 7 days.
func (m *DBManager) GetDailyTrafficForLast7Days() ([]DailyTraffic, error) {
	sevenDaysAgo := time.Now().AddDate(0, 0, -6).Format("2006-01-02")
	rows, err := m.db.Query(`
		SELECT date, last_bytes_recv - first_bytes_recv, last_bytes_sent - first_bytes_sent
		FROM daily_traffic
		WHERE date >= ?
		ORDER BY date DESC
	`, sevenDaysAgo)
	if err != nil {
		return nil, fmt.Errorf("failed to query daily traffic: %w", err)
	}
	defer rows.Close()

	var results []DailyTraffic
	for rows.Next() {
		var dt DailyTraffic
		if err := rows.Scan(&dt.Date, &dt.DownBytes, &dt.UpBytes); err != nil {
			return nil, fmt.Errorf("failed to scan daily traffic row: %w", err)
		}
		results = append(results, dt)
	}

	return results, nil
}
