-- Rendered binary exports keyed by project revision and options, so repeated
-- exports of an unchanged project return the stored bytes instead of rendering.
CREATE TABLE export_cache (
  storage_key TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX export_cache_project ON export_cache(project_id, revision);
