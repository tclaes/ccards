-- owner_id has no foreign key on purpose: there is no users table yet (CC-16)
-- and sharing will add other ways to access a card.
create table loyalty_card (
    id           uuid         primary key,
    name         varchar(100) not null,
    store        varchar(100) not null,
    card_number  varchar(100) not null,
    barcode_type varchar(20)  not null
        constraint loyalty_card_barcode_type_check
        check (barcode_type in ('CODE_128', 'EAN_13', 'EAN_8', 'UPC_A', 'QR_CODE')),
    color        varchar(32),
    note         varchar(1000),
    owner_id     uuid         not null,
    created_at   timestamptz  not null,
    updated_at   timestamptz  not null
);

create index loyalty_card_owner_id_idx on loyalty_card (owner_id);
