export const migrations: readonly string[] = [
  `
  CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    notes TEXT,
    created_at INTEGER NOT NULL,
    archived_at INTEGER
  );

  CREATE TABLE jobs (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    onsite_rate_cents INTEGER,
    driving_rate_cents INTEGER,
    notes TEXT,
    created_at INTEGER NOT NULL,
    archived_at INTEGER
  );
  CREATE INDEX idx_jobs_client_id ON jobs(client_id);

  CREATE TABLE time_entries (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('onsite','driving')),
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    notes TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX idx_time_entries_job_id ON time_entries(job_id);
  CREATE INDEX idx_time_entries_started_at ON time_entries(started_at);

  CREATE TABLE expenses (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    occurred_at INTEGER NOT NULL,
    description TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX idx_expenses_client_id ON expenses(client_id);
  CREATE INDEX idx_expenses_occurred_at ON expenses(occurred_at);

  CREATE TABLE settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    default_onsite_rate_cents INTEGER,
    default_driving_rate_cents INTEGER,
    currency TEXT NOT NULL DEFAULT 'USD',
    google_refresh_token TEXT,
    google_sheet_id TEXT
  );
  INSERT INTO settings (id, currency) VALUES (1, 'USD');
  `,
] as const;
