-- ============================================================
-- AfraLink — Supabase setup SQL
-- Run this entire file in Supabase SQL Editor (one shot)
-- ============================================================


-- ── 1. TABLES ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
  sid         VARCHAR     PRIMARY KEY,
  sess        JSONB       NOT NULL,
  expire      TIMESTAMP   NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

CREATE TABLE IF NOT EXISTS users (
  id                  VARCHAR     PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email               VARCHAR     UNIQUE,
  first_name          VARCHAR,
  last_name           VARCHAR,
  profile_image_url   VARCHAR,
  role                TEXT        NOT NULL DEFAULT 'customer',
  full_name           TEXT,
  phone               TEXT,
  profile_photo_url   TEXT,
  state               TEXT,
  city                TEXT,
  password_hash       TEXT,
  reset_token         TEXT,
  reset_token_expiry  TIMESTAMPTZ,
  is_suspended        BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id              INTEGER     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id         VARCHAR     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint        TEXT        NOT NULL UNIQUE,
  p256dh          TEXT        NOT NULL,
  auth            TEXT        NOT NULL,
  expiration_time TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS states (
  id          INTEGER     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name        TEXT        NOT NULL UNIQUE,
  region      TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cities (
  id          INTEGER     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name        TEXT        NOT NULL,
  state_id    INTEGER     NOT NULL,
  state_name  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drivers (
  id                  INTEGER     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id             TEXT        NOT NULL,
  full_name           TEXT        NOT NULL,
  phone               TEXT        NOT NULL,
  email               TEXT,
  gender              TEXT,
  date_of_birth       TEXT,
  address             TEXT,
  state               TEXT        NOT NULL,
  city                TEXT        NOT NULL,
  vehicle_type        TEXT        NOT NULL,
  vehicle_brand       TEXT,
  vehicle_model       TEXT,
  vehicle_color       TEXT,
  plate_number        TEXT,
  nin_number          TEXT,
  nin_slip_url        TEXT,
  selfie_url          TEXT,
  vehicle_photo_url   TEXT,
  profile_photo_url   TEXT,
  verification_status TEXT        NOT NULL DEFAULT 'pending',
  rejection_note      TEXT,
  is_available        BOOLEAN     NOT NULL DEFAULT true,
  average_rating      REAL,
  review_count        INTEGER     NOT NULL DEFAULT 0,
  is_featured         BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rentals (
  id                  INTEGER     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id             TEXT        NOT NULL,
  owner_name          TEXT,
  owner_phone         TEXT,
  vehicle_name        TEXT        NOT NULL,
  brand               TEXT        NOT NULL,
  model               TEXT        NOT NULL,
  year                INTEGER,
  color               TEXT,
  vehicle_type        TEXT,
  transmission        TEXT,
  fuel_type           TEXT,
  seating_capacity    INTEGER,
  plate_number        TEXT,
  state               TEXT        NOT NULL,
  city                TEXT        NOT NULL,
  daily_price         REAL        NOT NULL,
  weekly_price        REAL,
  monthly_price       REAL,
  photo_urls          TEXT[]      NOT NULL DEFAULT '{}',
  verification_status TEXT        NOT NULL DEFAULT 'pending',
  is_available        BOOLEAN     NOT NULL DEFAULT true,
  is_featured         BOOLEAN     NOT NULL DEFAULT false,
  average_rating      REAL,
  review_count        INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id              INTEGER     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  customer_id     TEXT        NOT NULL,
  driver_id       INTEGER,
  rental_id       INTEGER,
  service_type    TEXT        NOT NULL,
  pickup_location TEXT        NOT NULL,
  destination     TEXT,
  notes           TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
  id            INTEGER     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  reviewer_id   TEXT        NOT NULL,
  reviewer_name TEXT,
  driver_id     INTEGER,
  rental_id     INTEGER,
  rating        INTEGER     NOT NULL,
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
  id          INTEGER     PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  reporter_id TEXT        NOT NULL,
  target_type TEXT        NOT NULL,
  target_id   TEXT        NOT NULL,
  reason      TEXT        NOT NULL,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'open',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ── 2. SEED — Southern Nigeria states ────────────────────────

INSERT INTO states (name, region) VALUES
  ('Lagos',       'South West'),
  ('Ogun',        'South West'),
  ('Oyo',         'South West'),
  ('Osun',        'South West'),
  ('Ondo',        'South West'),
  ('Ekiti',       'South West'),
  ('Anambra',     'South East'),
  ('Imo',         'South East'),
  ('Abia',        'South East'),
  ('Enugu',       'South East'),
  ('Ebonyi',      'South East'),
  ('Rivers',      'South South'),
  ('Delta',       'South South'),
  ('Bayelsa',     'South South'),
  ('Akwa Ibom',   'South South'),
  ('Cross River', 'South South'),
  ('Edo',         'South South')
ON CONFLICT (name) DO NOTHING;


-- ── 3. SEED — Cities (references state IDs via subquery) ─────

INSERT INTO cities (name, state_id, state_name)
SELECT city, s.id, s.name FROM (VALUES
  -- Lagos
  ('Lagos Island',  'Lagos'), ('Ikeja',          'Lagos'), ('Lekki',          'Lagos'),
  ('Victoria Island','Lagos'), ('Surulere',        'Lagos'), ('Yaba',            'Lagos'),
  ('Badagry',        'Lagos'), ('Epe',             'Lagos'), ('Ikorodu',         'Lagos'),
  ('Apapa',          'Lagos'), ('Mushin',          'Lagos'), ('Oshodi',          'Lagos'),
  -- Ogun
  ('Abeokuta',  'Ogun'), ('Sagamu',    'Ogun'), ('Ijebu-Ode', 'Ogun'),
  ('Ota',       'Ogun'), ('Ilaro',     'Ogun'), ('Shagamu',   'Ogun'),
  ('Ifo',       'Ogun'), ('Ewekoro',   'Ogun'),
  -- Oyo
  ('Ibadan',   'Oyo'), ('Ogbomoso', 'Oyo'), ('Oyo',      'Oyo'),
  ('Iseyin',   'Oyo'), ('Saki',     'Oyo'), ('Eruwa',    'Oyo'),
  ('Igbo-Ora', 'Oyo'), ('Kisi',     'Oyo'),
  -- Osun
  ('Osogbo',  'Osun'), ('Ile-Ife', 'Osun'), ('Ilesa',   'Osun'),
  ('Ede',     'Osun'), ('Iwo',     'Osun'), ('Ikirun',  'Osun'),
  ('Inisa',   'Osun'), ('Offa',    'Osun'),
  -- Ondo
  ('Akure',      'Ondo'), ('Ondo City', 'Ondo'), ('Owo',     'Ondo'),
  ('Ikare',      'Ondo'), ('Okitipupa', 'Ondo'), ('Ore',     'Ondo'),
  ('Ifon',       'Ondo'), ('Idanre',   'Ondo'),
  -- Ekiti
  ('Ado-Ekiti', 'Ekiti'), ('Ikere',  'Ekiti'), ('Ikole',  'Ekiti'),
  ('Emure',     'Ekiti'), ('Ilawe',  'Ekiti'), ('Omuo',   'Ekiti'),
  ('Oye',       'Ekiti'), ('Ijero',  'Ekiti'),
  -- Anambra
  ('Awka',      'Anambra'), ('Onitsha',   'Anambra'), ('Nnewi',     'Anambra'),
  ('Ekwulobia', 'Anambra'), ('Oguta Road','Anambra'), ('Ihiala',    'Anambra'),
  ('Aguleri',   'Anambra'), ('Ogbaru',   'Anambra'),
  -- Imo
  ('Owerri', 'Imo'), ('Orlu',    'Imo'), ('Okigwe',  'Imo'),
  ('Mbaise',  'Imo'), ('Mbano',   'Imo'), ('Ideato',  'Imo'),
  ('Ikeduru', 'Imo'), ('Isu',     'Imo'),
  -- Abia
  ('Umuahia',    'Abia'), ('Aba',         'Abia'), ('Ohafia',      'Abia'),
  ('Bende',      'Abia'), ('Ikwuano',     'Abia'), ('Isukwuato',   'Abia'),
  ('Isuikwuato', 'Abia'), ('Ugwunagbo',   'Abia'),
  -- Enugu
  ('Enugu',    'Enugu'), ('Nsukka',   'Enugu'), ('Awgu',     'Enugu'),
  ('Oji River','Enugu'), ('Udi',      'Enugu'), ('Agbani',   'Enugu'),
  ('Ezeagu',   'Enugu'), ('Igbo Eze', 'Enugu'),
  -- Ebonyi
  ('Abakaliki', 'Ebonyi'), ('Afikpo',   'Ebonyi'), ('Onueke',  'Ebonyi'),
  ('Ezzamgbo',  'Ebonyi'), ('Ishielu',  'Ebonyi'), ('Ohaozara','Ebonyi'),
  ('Ikwo',      'Ebonyi'), ('Ivo',      'Ebonyi'),
  -- Rivers
  ('Port Harcourt','Rivers'), ('Obio-Akpor','Rivers'), ('Eleme',  'Rivers'),
  ('Okrika',       'Rivers'), ('Bonny',     'Rivers'), ('Degema', 'Rivers'),
  ('Ahoada',       'Rivers'), ('Tai',       'Rivers'),
  -- Delta
  ('Warri',  'Delta'), ('Asaba',  'Delta'), ('Ughelli', 'Delta'),
  ('Sapele', 'Delta'), ('Agbor',  'Delta'), ('Oghara',  'Delta'),
  ('Abraka', 'Delta'), ('Ozoro',  'Delta'),
  -- Bayelsa
  ('Yenagoa',       'Bayelsa'), ('Ogbia',          'Bayelsa'), ('Sagbama',  'Bayelsa'),
  ('Ekeremor',      'Bayelsa'), ('Southern Ijaw',  'Bayelsa'), ('Kolokuma', 'Bayelsa'),
  ('Brass',         'Bayelsa'), ('Nembe',          'Bayelsa'),
  -- Akwa Ibom
  ('Uyo',        'Akwa Ibom'), ('Eket',       'Akwa Ibom'), ('Ikot Ekpene','Akwa Ibom'),
  ('Oron',       'Akwa Ibom'), ('Abak',       'Akwa Ibom'), ('Ikot Abasi', 'Akwa Ibom'),
  ('Ibeno',      'Akwa Ibom'), ('Etinan',     'Akwa Ibom'),
  -- Cross River
  ('Calabar',  'Cross River'), ('Ogoja',    'Cross River'), ('Ikom',     'Cross River'),
  ('Obudu',    'Cross River'), ('Ugep',     'Cross River'), ('Akamkpa',  'Cross River'),
  ('Odukpani', 'Cross River'), ('Obubra',   'Cross River'),
  -- Edo
  ('Benin City','Edo'), ('Auchi',   'Edo'), ('Ekpoma',  'Edo'),
  ('Uromi',     'Edo'), ('Igarra',  'Edo'), ('Igueben', 'Edo'),
  ('Okpella',   'Edo'), ('Ubiaja',  'Edo')
) AS t(city, state_name)
JOIN states s ON s.name = t.state_name
ON CONFLICT DO NOTHING;
