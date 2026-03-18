// seed-superadmin.ts
import * as bcrypt from 'bcrypt';
import { Client } from 'pg';

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'hospital_admin',
  password: 'hospital_secure_2024',
  database: 'hospital_db',
});

async function seed() {
  await client.connect();

  // Actualizar enum si no tiene SUPERADMIN
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUPERADMIN' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_role_enum')) THEN
        ALTER TYPE users_role_enum ADD VALUE 'SUPERADMIN';
      END IF;
    END $$;
  `).catch(() => {});

  const hash = await bcrypt.hash('SuperAdmin2024!', 10);

  // Verificar si ya existe
  const exists = await client.query("SELECT id FROM users WHERE email = 'SUP-000001'");
  if (exists.rows.length === 0) {
    await client.query(`
      INSERT INTO users (id, email, first_name, last_name, role, password_hash, is_active)
      VALUES (gen_random_uuid(), 'SUP-000001', 'Super', 'Admin', 'SUPERADMIN', $1, true)
    `, [hash]);
    console.log('  [OK] SuperAdmin creado: SUP-000001 / SuperAdmin2024!');
  } else {
    await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'SUP-000001']);
    console.log('  [OK] SuperAdmin actualizado: SUP-000001 / SuperAdmin2024!');
  }

  await client.end();
  console.log('Seed superadmin completado.');
}

seed().catch(console.error);
