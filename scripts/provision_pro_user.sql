-- ─────────────────────────────────────────────────────────────────────────────
-- MANUAL PRO USER PROVISIONING SCRIPT
-- ─────────────────────────────────────────────────────────────────────────────
-- Usage: 
-- 1. Open this file and replace 'USER_EMAIL_HERE' and 'FULL_NAME_HERE'.
-- 2. Copy the entire DO block and run it in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  user_email TEXT := 'USER_EMAIL_HERE'; -- <--- CHANGE THIS
  user_name TEXT := 'FULL_NAME_HERE';   -- <--- CHANGE THIS
BEGIN

  -- 1. Create the Auth shell (if it doesn't exist)
  -- This allows Google OAuth to link correctly on first login.
  -- We check for existence first to avoid constraint errors.
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = lower(trim(user_email))) THEN
    INSERT INTO auth.users (
      id, 
      instance_id, 
      email, 
      encrypted_password, 
      email_confirmed_at, 
      raw_app_meta_data, 
      raw_user_meta_data, 
      aud, 
      role,
      created_at,
      updated_at,
      last_sign_in_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      lower(trim(user_email)),
      '', 
      now(),
      '{"provider": "google", "providers": ["google"]}',
      jsonb_build_object('full_name', user_name),
      'authenticated',
      'authenticated',
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  -- 2. Create or Upgrade the Public Profile
  -- We fetch the ID from auth.users (handles both new and existing users)
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    plan, 
    subscription_status,
    created_at
  )
  SELECT 
    id, 
    email, 
    user_name, 
    'pro', 
    'active',
    now()
  FROM auth.users 
  WHERE email = lower(trim(user_email))
  ON CONFLICT (id) DO UPDATE 
  SET 
    plan = 'pro', 
    subscription_status = 'active';

  RAISE NOTICE 'User % has been provisioned/upgraded to Pro successfully.', user_email;

END $$;
