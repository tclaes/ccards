-- Optimistic locking (@Version). Existing rows start at version 0.
alter table loyalty_card add column version bigint not null default 0;
