-- Add an optional free-text notes field to bookings.
-- This is an additive, backwards-compatible change: the column is nullable and
-- has no default, so existing rows and older app versions are unaffected.

ALTER TABLE bookings ADD COLUMN notes TEXT;
