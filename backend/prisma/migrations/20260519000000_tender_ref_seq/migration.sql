-- Atomic sequence for tender reference numbers.
-- Replaces the racy `SELECT COUNT(*) + 1` pattern.
-- START WITH 1001 so existing rows (if any) don't collide with hand-seeded data.
CREATE SEQUENCE IF NOT EXISTS tender_ref_seq START WITH 1001 INCREMENT BY 1 NO CYCLE;
