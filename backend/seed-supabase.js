const bcrypt = require('bcrypt');
const { Client } = require('pg');
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
  console.log('Conectado a Supabase');
  const hash = await bcrypt.hash('SuperAdmin2024!', 10);
  const exists = await client.query("SELECT id FROM users WHERE email = 'SUP-000001'");
  if (exists.rows.length === 0) {
    await client.query(
      "INSERT INTO users (id, email, first_name, last_name, role, password_hash, is_active) VALUES (gen_random_uuid(), 'SUP-000001', 'Super', 'Admin', 'SUPERADMIN', $1, true)",
      [hash]
    );
    console.log('SuperAdmin creado: SUP-000001 / SuperAdmin2024!');
  } else {
    await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'SUP-000001']);
    console.log('SuperAdmin actualizado: SUP-000001 / SuperAdmin2024!');
  }
  await client.end();
}
seed().catch(console.error);
