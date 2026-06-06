// Provide dummy env so importing modules that construct a pg Pool (server/db.ts) doesn't throw.
// The pool is lazy — no connection is opened unless a query runs (DB integration tests gate on RUN_DB_TESTS).
process.env.DATABASE_URL ||= "postgres://test:test@localhost:5432/test";
process.env.SESSION_SECRET ||= "test-secret";
process.env.NODE_ENV ||= "test";
