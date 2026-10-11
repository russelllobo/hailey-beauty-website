CREATE TABLE IF NOT EXISTS analytics_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT OR IGNORE INTO analytics_meta VALUES ('tracking_since', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'));
CREATE TABLE IF NOT EXISTS analytics_events (
  event_id TEXT PRIMARY KEY,
  pageview_id TEXT NOT NULL,
  received_at INTEGER NOT NULL,
  visitor_key TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pageview', 'booking_click')),
  path TEXT NOT NULL,
  source TEXT NOT NULL,
  country TEXT NOT NULL,
  device TEXT NOT NULL CHECK (device IN ('Mobile', 'Tablet', 'Desktop'))
);
CREATE INDEX IF NOT EXISTS analytics_events_time ON analytics_events (received_at, type);
CREATE INDEX IF NOT EXISTS analytics_events_visitor ON analytics_events (visitor_key, received_at);
CREATE UNIQUE INDEX IF NOT EXISTS analytics_pageview_once ON analytics_events (pageview_id) WHERE type = 'pageview';
CREATE TABLE IF NOT EXISTS analytics_login_attempts (client_key TEXT PRIMARY KEY, window_start INTEGER NOT NULL, attempts INTEGER NOT NULL);
