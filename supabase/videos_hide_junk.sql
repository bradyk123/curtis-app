-- Hide non-exercise / junk clips from athletes (applied 2026-07-16).
-- These are camera artifacts or bloopers, not real exercises. Admins still see
-- them in edit mode; un-hide by setting hidden = false if any get identified.
update videos set hidden = true
where slug in ('img-3195', 'db-curl-attmpt', 'erinphotobomb', 'maddy-gym-entrance');
