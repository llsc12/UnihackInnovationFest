-- Back-fill demo auth accounts and profiles for the three seed sellers.
-- Password for all demo accounts: demo1234
-- Safe to run multiple times (ON CONFLICT DO NOTHING throughout).

DO $$
DECLARE
  uid_01 CONSTANT UUID := '11111111-1111-1111-1111-111111111111';
  uid_02 CONSTANT UUID := '22222222-2222-2222-2222-222222222222';
  uid_03 CONSTANT UUID := '33333333-3333-3333-3333-333333333333';
BEGIN

  -- ── auth.users ──────────────────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id,
    email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    role, aud,
    raw_app_meta_data, raw_user_meta_data
  ) VALUES
    (
      uid_01, '00000000-0000-0000-0000-000000000000',
      'northside@autoreviver.demo',
      crypt('demo1234', gen_salt('bf')),
      '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z',
      'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}', '{}'
    ),
    (
      uid_02, '00000000-0000-0000-0000-000000000000',
      'mikes@autoreviver.demo',
      crypt('demo1234', gen_salt('bf')),
      '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z',
      'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}', '{}'
    ),
    (
      uid_03, '00000000-0000-0000-0000-000000000000',
      'eurospare@autoreviver.demo',
      crypt('demo1234', gen_salt('bf')),
      '2025-06-01T00:00:00Z', '2025-06-01T00:00:00Z', '2025-06-01T00:00:00Z',
      'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}', '{}'
    )
  ON CONFLICT DO NOTHING;

  -- ── profiles ─────────────────────────────────────────────────────────────────
  INSERT INTO profiles (id, username, full_name, date_of_birth, privacy_mode, created_at) VALUES
    (uid_01, 'northside_auto', 'Northside Auto Salvage', '1985-03-15', 'public',  '2026-01-01T00:00:00Z'),
    (uid_02, 'mikes_parts',    'Mike Thompson',          '1978-07-22', 'public',  '2026-01-15T00:00:00Z'),
    (uid_03, 'eurospare',      'EuroSpare Direct',       '1990-11-08', 'public',  '2025-06-01T00:00:00Z')
  ON CONFLICT DO NOTHING;

  -- ── sellers — link user_id ────────────────────────────────────────────────────
  UPDATE sellers SET user_id = uid_01 WHERE id = 'slr_01' AND user_id IS NULL;
  UPDATE sellers SET user_id = uid_02 WHERE id = 'slr_02' AND user_id IS NULL;
  UPDATE sellers SET user_id = uid_03 WHERE id = 'slr_03' AND user_id IS NULL;

  -- ── listings — link user_id + fill new columns ────────────────────────────────
  UPDATE listings SET
    user_id               = uid_01,
    part_origin           = 'oem',
    postage_info          = 'Royal Mail Tracked 48, £6.99. Dispatched within 1 business day.',
    return_policy_details = '14-day returns accepted. Part must be unused. Buyer pays return postage.'
  WHERE id = 'lst_001' AND user_id IS NULL;

  UPDATE listings SET
    user_id      = uid_02,
    part_origin  = 'oem',
    postage_info = 'Hermes Standard, £3.99. Collection also available from Leeds LS1.'
  WHERE id = 'lst_002' AND user_id IS NULL;

  UPDATE listings SET
    user_id               = uid_03,
    part_origin           = 'oem',
    postage_info          = 'DHL Next Day, £8.50. Same-day dispatch for orders before 2 pm.',
    return_policy_details = '30-day returns. Return postage covered by us. Part must be in original condition.'
  WHERE id = 'lst_003' AND user_id IS NULL;

END $$;
