-- Proposed by a product engineer, who reports that `legacy_status` is unused.
--
-- Heads up: the current migration runner applies every file in this directory
-- in order, with no review step and no safety check. A destructive change like
-- this one will therefore be applied automatically the next time migrations
-- run. Dropping a column is not safely reversible and can break older app
-- versions still running during a rolling deploy.

ALTER TABLE bookings DROP COLUMN legacy_status;
