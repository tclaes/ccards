-- How often and when a card was last used. Changed only by an atomic update that
-- does not touch version or updated_at: a use is not an edit. Existing rows start at 0.
alter table loyalty_card add column usage_count bigint not null default 0;
alter table loyalty_card add column last_used_at timestamptz;
