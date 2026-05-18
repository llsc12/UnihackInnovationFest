-- Seed data for AutoReviver — mirrors the original data/*.json files.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).

-- ── Sellers ───────────────────────────────────────────────────────────────────
INSERT INTO sellers (id, name, verified, rating, review_count, location) VALUES
  ('slr_01', 'Northside Auto Salvage', true,  4.7, 312,  'Manchester, UK'),
  ('slr_02', 'Mike''s Parts',          false, 4.2, 28,   'Leeds, UK'),
  ('slr_03', 'EuroSpare Direct',       true,  4.9, 1240, 'Birmingham, UK')
ON CONFLICT DO NOTHING;

-- ── Listings ──────────────────────────────────────────────────────────────────
INSERT INTO listings (
  id, seller_id,
  part_type, make, model, year_from, year_to, condition,
  part_number, notes, price, images, has_return_policy,
  title, description, condition_notes, compatibility_summary, keywords,
  created_at
) VALUES
(
  'lst_001', 'slr_01',
  'Headlight', 'Volkswagen', 'Golf', 2013, 2017, 'good',
  '5G1941005', 'Minor scratches on lens, fully working.', 85,
  ARRAY['/placeholder.svg', '/placeholder.svg'], true,
  'Genuine Volkswagen Golf Mk7 Left Headlight 2013-2017',
  'Used genuine VW Golf Mk7 left headlight assembly in good working condition. Suitable for compatible Golf Mk7 models between 2013 and 2017. Minor cosmetic scratches present but does not affect function. Please confirm part number before purchase.',
  'Used - minor cosmetic scratches on lens. Fully functional.',
  'Fits Volkswagen Golf Mk7 (2013-2017). Confirm 5G1941005.',
  ARRAY['VW', 'Golf', 'Mk7', 'headlight', '5G1941005', '2013', '2017'],
  '2026-05-10T09:00:00Z'
),
(
  'lst_002', 'slr_02',
  'Wing Mirror', 'Ford', 'Fiesta', 2013, 2017, 'good',
  '1810307', 'Right-hand drive, powered, electric fold.', 45,
  ARRAY['/placeholder.svg'], false,
  'Ford Fiesta Mk7 Right Wing Mirror 2013-2017 - Powered',
  'Used Ford Fiesta Mk7 right-hand wing mirror with electric fold and heating. Removed from a 2015 vehicle. Fits Fiesta models 2013-2017.',
  'Light scuffs on casing, motor works smoothly.',
  'Fits Ford Fiesta Mk7 (2013-2017).',
  ARRAY['Ford', 'Fiesta', 'wing mirror', '1810307', 'RHD', 'electric'],
  '2026-05-12T14:30:00Z'
),
(
  'lst_003', 'slr_03',
  'Alternator', 'BMW', '3 Series', 2012, 2019, 'like-new',
  '12317605061', 'Replaced under warranty, tested.', 220,
  ARRAY['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'], true,
  'BMW 3 Series F30 Alternator 12317605061 - Tested',
  'Genuine BMW alternator removed from a 2016 F30 320d. Fits various BMW F30/F31 3 Series models 2012-2019. Comes with 30-day return.',
  'Like new, tested on bench. Original packaging.',
  'Fits BMW 3 Series F30/F31 (2012-2019). Verify with VIN.',
  ARRAY['BMW', '3 Series', 'F30', 'alternator', '12317605061'],
  '2026-05-14T11:15:00Z'
)
ON CONFLICT DO NOTHING;

-- ── listing_fits_vehicles ─────────────────────────────────────────────────────
INSERT INTO listing_fits_vehicles (listing_id, make, model, year_from, year_to) VALUES
  ('lst_001', 'Volkswagen', 'Golf',     2013, 2017),
  ('lst_002', 'Ford',       'Fiesta',   2013, 2017),
  ('lst_003', 'BMW',        '3 Series', 2012, 2019)
ON CONFLICT DO NOTHING;

-- ── Vehicles catalogue ────────────────────────────────────────────────────────
INSERT INTO vehicles (make, model, year) VALUES
  ('Volkswagen', 'Golf',     2013),
  ('Volkswagen', 'Golf',     2014),
  ('Volkswagen', 'Golf',     2015),
  ('Volkswagen', 'Golf',     2016),
  ('Volkswagen', 'Golf',     2017),
  ('Volkswagen', 'Polo',     2018),
  ('Ford',       'Fiesta',   2014),
  ('Ford',       'Fiesta',   2015),
  ('Ford',       'Fiesta',   2016),
  ('Ford',       'Fiesta',   2017),
  ('Ford',       'Focus',    2016),
  ('BMW',        '3 Series', 2014),
  ('BMW',        '3 Series', 2016),
  ('BMW',        '3 Series', 2018),
  ('Audi',       'A3',       2015),
  ('Toyota',     'Corolla',  2017)
ON CONFLICT DO NOTHING;

-- ── Compatibility rules ───────────────────────────────────────────────────────
INSERT INTO compatibility_rules (make, model, generation, year_from, year_to, notes) VALUES
  ('Volkswagen', 'Golf',     'Mk6',     2008, 2012, NULL),
  ('Volkswagen', 'Golf',     'Mk7',     2013, 2019, 'Mk7 facelift from 2017 - confirm part number'),
  ('Volkswagen', 'Golf',     'Mk8',     2020, 2026, NULL),
  ('Ford',       'Fiesta',   'Mk7',     2008, 2017, 'Mk7 facelift in 2013 - check trim'),
  ('Ford',       'Fiesta',   'Mk8',     2018, 2023, NULL),
  ('Ford',       'Focus',    'Mk3',     2011, 2018, NULL),
  ('Ford',       'Focus',    'Mk4',     2019, 2026, NULL),
  ('BMW',        '3 Series', 'F30/F31', 2012, 2019, NULL),
  ('BMW',        '3 Series', 'G20/G21', 2019, 2026, NULL),
  ('Audi',       'A3',       '8V',      2013, 2020, NULL),
  ('Audi',       'A3',       '8Y',      2020, 2026, NULL),
  ('Toyota',     'Corolla',  'E170',    2014, 2018, NULL),
  ('Toyota',     'Corolla',  'E210',    2019, 2026, NULL)
ON CONFLICT DO NOTHING;
