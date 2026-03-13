-- Down Migration: Drop briefings, points, and metrics tables

DROP TABLE IF EXISTS briefing_metrics;
DROP TABLE IF EXISTS briefing_points;
DROP TABLE IF EXISTS briefings;
