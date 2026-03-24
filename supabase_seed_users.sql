-- Script para crear usuarios de prueba directamente en Supabase (desde el SQL Editor)
-- NOTA: Supabase usa criptografía para las contraseñas, por lo que este script
-- utiliza una técnica para insertar usuarios con contraseñas que luego puedes cambiar
-- o usar las que te propongo si el hash coincide.

-- 1. Crear el usuario Profesor
-- Contraseña propuesta: profe123
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'profe@chemstock.edu',
  crypt('profe123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Profesor Test"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 2. Crear el usuario Alumno
-- Contraseña propuesta: alumno123
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'alumno@chemstock.edu',
  crypt('alumno123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Alumno Test"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 3. Actualizar los roles en la tabla profiles (el trigger debería hacerlo solo, 
-- pero por si acaso forzamos al Profesor)
UPDATE public.profiles SET role = 'profe' WHERE id IN (SELECT id FROM auth.users WHERE email = 'profe@chemstock.edu');
