import * as bcrypt from 'bcrypt';
import { Client } from 'pg';
const client = new Client({
  host: 'localhost', port: 5433,
  user: 'hospital_admin', password: 'hospital_secure_2024', database: 'hospital_db',
});
async function seed() {
  await client.connect();
  const users = [
    { email: 'SUP-000001',              password: 'Sup00001' },
    { email: 'ADM-000001',              password: 'Adm00001' },
    { email: 'CAR-422691',              password: 'Wil42291' },
    { email: 'GAS-104567',              password: 'Ive10467' },
    { email: 'NEU-247938',              password: 'Dar24738' },
    { email: 'OTO-916075',              password: 'Mel91675' },
    { email: 'TRA-795254',              password: 'Aug79554' },
    { email: 'ENF-000001', password: 'Mar00101' },
  ];
  console.log('Credenciales actualizadas:');
  console.log('='.repeat(45));
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, u.email]);
    console.log(`  ${u.email.padEnd(28)} | ${u.password}`);
  }
  console.log('='.repeat(45));
  await client.end();
  console.log('Completado.');
}
seed().catch(console.error);