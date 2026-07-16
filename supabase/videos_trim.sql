-- Beach Track Club — add non-destructive trim points to video clips. Run once (idempotent).
--
-- Stores an in/out point (seconds) per clip. The player shows only [trim_start, trim_end];
-- the underlying MP4 is never modified, so trims are instant and reversible.
-- null/null means "play the whole clip" (default).

alter table videos add column if not exists trim_start real;
alter table videos add column if not exists trim_end   real;
