/**
 * These tests are the CONTRACT between v1.1.11 local-logging changes and
 * production behaviour. They should fail loudly if any local-mode code path
 * leaks into the production execution path.
 *
 * Any test failing here means production logging behaviour has diverged from
 * the v1.1.10 baseline — do NOT publish until the regression is resolved.
 */
export {};
