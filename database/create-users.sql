-- Crear superadmin con contraseña hasheada
INSERT INTO users (id, email, first_name, last_name, role, is_active, password_hash, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'SUP-000001',
  'Super',
  'Admin',
  'SUPERADMIN',
  true,
  '\\\.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, first_name, last_name, role, is_active, password_hash, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ADM-000001',
  'Admin',
  'Manana',
  'ADMIN',
  true,
  '\\\.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
