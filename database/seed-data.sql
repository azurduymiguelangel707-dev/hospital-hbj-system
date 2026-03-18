-- DATOS DE PRUEBA - Sistema Hospitalario

-- 1. Usuarios
INSERT INTO users (id, keycloak_id, email, first_name, last_name, role, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'admin-keycloak-id', 'admin@hospital.bo', 'Admin', 'Sistema', 'ADMIN', true, NOW(), NOW()),
  (gen_random_uuid(), 'doctor-keycloak-id-1', 'dr.garcia@hospital.bo', 'Carlos', 'García', 'MEDICO', true, NOW(), NOW()),
  (gen_random_uuid(), 'doctor-keycloak-id-2', 'dra.martinez@hospital.bo', 'Ana', 'Martínez', 'MEDICO', true, NOW(), NOW()),
  (gen_random_uuid(), 'patient-keycloak-id-1', 'juan.perez@email.com', 'Juan', 'Pérez', 'PACIENTE', true, NOW(), NOW()),
  (gen_random_uuid(), 'patient-keycloak-id-2', 'maria.lopez@email.com', 'María', 'López', 'PACIENTE', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. Médicos (usando los IDs de los usuarios creados arriba)
INSERT INTO doctors (id, user_id, specialty, license_number, phone, consultation_fee, biography, years_experience, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.id,
  'Cardiología',
  'MED-001-2024',
  '+591 70123456',
  250.00,
  'Cardiólogo con más de 15 años de experiencia en diagnóstico y tratamiento de enfermedades cardiovasculares.',
  15,
  NOW(),
  NOW()
FROM users u WHERE u.email = 'dr.garcia@hospital.bo'
ON CONFLICT (license_number) DO NOTHING;

INSERT INTO doctors (id, user_id, specialty, license_number, phone, consultation_fee, biography, years_experience, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.id,
  'Pediatría',
  'MED-002-2024',
  '+591 70234567',
  200.00,
  'Pediatra especializada en el cuidado integral de niños y adolescentes.',
  10,
  NOW(),
  NOW()
FROM users u WHERE u.email = 'dra.martinez@hospital.bo'
ON CONFLICT (license_number) DO NOTHING;

-- 3. Pacientes (usando los IDs de los usuarios creados arriba)
INSERT INTO patients (id, user_id, ci, birth_date, gender, phone, address, emergency_contact, emergency_phone, blood_type, allergies, insurance_number, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.id,
  '1234567 LP',
  '1985-03-15',
  'MASCULINO',
  '+591 71234567',
  'Av. 6 de Marzo #123, El Alto',
  'Rosa Pérez',
  '+591 71234568',
  'O+',
  ARRAY['Penicilina'],
  'SEG-2024-001',
  NOW(),
  NOW()
FROM users u WHERE u.email = 'juan.perez@email.com'
ON CONFLICT (ci) DO NOTHING;

INSERT INTO patients (id, user_id, ci, birth_date, gender, phone, address, emergency_contact, emergency_phone, blood_type, allergies, insurance_number, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.id,
  '7654321 LP',
  '1990-07-22',
  'FEMENINO',
  '+591 72345678',
  'Calle Buenos Aires #456, El Alto',
  'Pedro López',
  '+591 72345679',
  'A+',
  ARRAY[]::text[],
  'SEG-2024-002',
  NOW(),
  NOW()
FROM users u WHERE u.email = 'maria.lopez@email.com'
ON CONFLICT (ci) DO NOTHING;

-- 4. Citas (usando los IDs creados arriba)
INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, status, reason, notes, duration_minutes, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  p.id,
  d.id,
  CURRENT_DATE + INTERVAL '2 days',
  '09:00:00',
  'CONFIRMADA',
  'Chequeo cardiológico de rutina',
  'Paciente con antecedentes familiares de hipertensión',
  30,
  NOW(),
  NOW()
FROM patients p
JOIN users pu ON p.user_id = pu.id
JOIN doctors d ON d.user_id IN (SELECT id FROM users WHERE email = 'dr.garcia@hospital.bo')
WHERE pu.email = 'juan.perez@email.com';

INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, status, reason, notes, duration_minutes, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  p.id,
  d.id,
  CURRENT_DATE + INTERVAL '3 days',
  '10:00:00',
  'PENDIENTE',
  'Control pediátrico anual',
  'Primera consulta del año',
  30,
  NOW(),
  NOW()
FROM patients p
JOIN users pu ON p.user_id = pu.id
JOIN doctors d ON d.user_id IN (SELECT id FROM users WHERE email = 'dra.martinez@hospital.bo')
WHERE pu.email = 'maria.lopez@email.com';

-- Verificar que se insertó correctamente
SELECT 'Usuarios creados:' as info, COUNT(*) as total FROM users;
SELECT 'Médicos creados:' as info, COUNT(*) as total FROM doctors;
SELECT 'Pacientes creados:' as info, COUNT(*) as total FROM patients;
SELECT 'Citas creadas:' as info, COUNT(*) as total FROM appointments;