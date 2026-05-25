
-- Seed default platform owner account
DO $$
DECLARE
  admin_uid UUID;
  existing_uid UUID;
BEGIN
  SELECT id INTO existing_uid FROM auth.users WHERE email = 'admin@condoflow.com' LIMIT 1;

  IF existing_uid IS NULL THEN
    admin_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_uid, 'authenticated', 'authenticated',
      'admin@condoflow.com',
      crypt('CondoFlow@2026', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"CondoFlow Owner"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), admin_uid,
      jsonb_build_object('sub', admin_uid::text, 'email', 'admin@condoflow.com', 'email_verified', true),
      'email', admin_uid::text,
      now(), now(), now()
    );
  ELSE
    admin_uid := existing_uid;
    UPDATE auth.users
      SET encrypted_password = crypt('CondoFlow@2026', gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
      WHERE id = admin_uid;
  END IF;

  -- Ensure profile exists
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (admin_uid, 'admin@condoflow.com', 'CondoFlow Owner')
  ON CONFLICT (id) DO NOTHING;

  -- Promote to platform admin
  INSERT INTO public.platform_admins (user_id, email, full_name)
  VALUES (admin_uid, 'admin@condoflow.com', 'CondoFlow Owner')
  ON CONFLICT DO NOTHING;
END $$;
