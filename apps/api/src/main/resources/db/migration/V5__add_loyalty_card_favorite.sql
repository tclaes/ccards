-- Favorite cards come first in the list. Like usage, changed only by an atomic update
-- that does not touch version or updated_at: marking is not an edit.
alter table loyalty_card add column favorite boolean not null default false;
