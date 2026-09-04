import * as bcrypt from 'bcrypt';
import { Client } from 'pg';
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.fvvyfbinkpxdwmbqqckq',
  password: 'tB3ILIKGEQiffXxI',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
async function seed() {
  await client.connect();
  await client.query(
    DO seed-superadmin.ts BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUPERADMIN' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_role_enum')) THEN
        ALTER TYPE users_role_enum ADD VALUE 'SUPERADMIN';
      END IF;
    END seed-superadmin.ts.
  ).catch(() => {});
  const hash = await bcrypt.hash('SuperAdmin2024!', 10);
  const exists = await client.query("SELECT id FROM users WHERE email = 'SUP-000001'");
  if (exists.rows.length === 0) {
    await client.query(
      INSERT INTO users (id, email, first_name, last_name, role, password_hash, is_active)
      VALUES (gen_random_uuid(), 'SUP-000001', 'Super', 'Admin', 'SUPERADMIN', , true)
    , [hash]);
    console.log('SuperAdmin creado: SUP-000001 / SuperAdmin2024!');
  } else {
    await client.query('UPDATE users SET password_hash =  WHERE email = ', [hash, 'SUP-000001']);
    console.log('SuperAdmin actualizado: SUP-000001 / SuperAdmin2024!');
  }
  await client.end();
  console.log('Seed completado.');
}
seed().catch(console.error);
