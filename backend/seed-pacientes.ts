import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

const client = new Client({
  host: 'localhost', port: 5433,
  user: 'hospital_admin', password: 'hospital_secure_2024', database: 'hospital_db',
});

const pacientes = [
  // Cardiologia
  { nombre: 'JUAN CARLOS MAMANI QUISPE', ci: '1234001', edad: 52, genero: 'Masculino', sangre: 'A+', tel: '71234001', dir: 'AV. AMERICA 101', esp: 'Cardiologia' },
  { nombre: 'MARIA ELENA CONDORI FLORES', ci: '1234002', edad: 45, genero: 'Femenino', sangre: 'O+', tel: '71234002', dir: 'CALLE JUNIN 202', esp: 'Cardiologia' },
  { nombre: 'PEDRO ALBERTO QUISPE MAMANI', ci: '1234003', edad: 61, genero: 'Masculino', sangre: 'B+', tel: '71234003', dir: 'AV. BLANCO GALINDO 303', esp: 'Cardiologia' },
  { nombre: 'ROSA AMALIA CHOQUE VARGAS', ci: '1234004', edad: 58, genero: 'Femenino', sangre: 'AB+', tel: '71234004', dir: 'CALLE COLOMBIA 404', esp: 'Cardiologia' },
  { nombre: 'JORGE LUIS VILLCA TARQUI', ci: '1234005', edad: 49, genero: 'Masculino', sangre: 'O-', tel: '71234005', dir: 'AV. HEROINAS 505', esp: 'Cardiologia' },
  { nombre: 'ANA PATRICIA MAMANI COLQUE', ci: '1234006', edad: 55, genero: 'Femenino', sangre: 'A-', tel: '71234006', dir: 'CALLE POTOSI 606', esp: 'Cardiologia' },
  { nombre: 'CARLOS RENE APAZA HUANCA', ci: '1234007', edad: 67, genero: 'Masculino', sangre: 'O+', tel: '71234007', dir: 'AV. OQUENDO 707', esp: 'Cardiologia' },
  { nombre: 'LUCIA BEATRIZ FLORES QUISPE', ci: '1234008', edad: 43, genero: 'Femenino', sangre: 'B-', tel: '71234008', dir: 'CALLE LADISLAO CABRERA 808', esp: 'Cardiologia' },
  { nombre: 'VICTOR HUGO CONDORI MAMANI', ci: '1234009', edad: 71, genero: 'Masculino', sangre: 'A+', tel: '71234009', dir: 'AV. AROMA 909', esp: 'Cardiologia' },
  { nombre: 'SILVIA ROXANA TARQUI CHOQUE', ci: '1234010', edad: 38, genero: 'Femenino', sangre: 'O+', tel: '71234010', dir: 'CALLE SUCRE 110', esp: 'Cardiologia' },
  { nombre: 'ROBERTO DANIEL HUANCA QUISPE', ci: '1234011', edad: 60, genero: 'Masculino', sangre: 'AB-', tel: '71234011', dir: 'AV. REPUBLICA 111', esp: 'Cardiologia' },
  { nombre: 'CARMEN YOLANDA VARGAS APAZA', ci: '1234012', edad: 47, genero: 'Femenino', sangre: 'O+', tel: '71234012', dir: 'CALLE JORDAN 112', esp: 'Cardiologia' },
  { nombre: 'FRANKLIN OMAR COLQUE TARQUI', ci: '1234013', edad: 54, genero: 'Masculino', sangre: 'A+', tel: '71234013', dir: 'AV. MANACO 113', esp: 'Cardiologia' },
  { nombre: 'PATRICIA ELENA HUANCA FLORES', ci: '1234014', edad: 42, genero: 'Femenino', sangre: 'B+', tel: '71234014', dir: 'CALLE HAMIRAYA 114', esp: 'Cardiologia' },
  { nombre: 'NELSON DAVID MAMANI TARQUI', ci: '1234015', edad: 65, genero: 'Masculino', sangre: 'O-', tel: '71234015', dir: 'AV. CIRCUNVALACION 115', esp: 'Cardiologia' },
  // Traumatologia
  { nombre: 'EDGAR MARCELO QUISPE COLQUE', ci: '1234016', edad: 35, genero: 'Masculino', sangre: 'O+', tel: '71234016', dir: 'AV. AMERICA 116', esp: 'Traumatologia' },
  { nombre: 'GLADYS MIRIAM CHOQUE MAMANI', ci: '1234017', edad: 28, genero: 'Femenino', sangre: 'A+', tel: '71234017', dir: 'CALLE BOLIVAR 117', esp: 'Traumatologia' },
  { nombre: 'MARIO ANTONIO FLORES VARGAS', ci: '1234018', edad: 42, genero: 'Masculino', sangre: 'B+', tel: '71234018', dir: 'AV. LIBERTAD 118', esp: 'Traumatologia' },
  { nombre: 'SUSANA CECILIA APAZA QUISPE', ci: '1234019', edad: 33, genero: 'Femenino', sangre: 'O-', tel: '71234019', dir: 'CALLE ANTEZANA 119', esp: 'Traumatologia' },
  { nombre: 'RAUL ALEJANDRO TARQUI CONDORI', ci: '1234020', edad: 50, genero: 'Masculino', sangre: 'AB+', tel: '71234020', dir: 'AV. KANATA 120', esp: 'Traumatologia' },
  { nombre: 'BEATRIZ LORENA MAMANI HUANCA', ci: '1234021', edad: 29, genero: 'Femenino', sangre: 'A-', tel: '71234021', dir: 'CALLE BAPTISTA 121', esp: 'Traumatologia' },
  { nombre: 'OSCAR IVAN VILLCA FLORES', ci: '1234022', edad: 44, genero: 'Masculino', sangre: 'O+', tel: '71234022', dir: 'AV. PETROLERA 122', esp: 'Traumatologia' },
  { nombre: 'MIRTHA ESTHER COLQUE CHOQUE', ci: '1234023', edad: 37, genero: 'Femenino', sangre: 'B-', tel: '71234023', dir: 'CALLE LANZA 123', esp: 'Traumatologia' },
  { nombre: 'DAVID FERNANDO HUANCA MAMANI', ci: '1234024', edad: 56, genero: 'Masculino', sangre: 'A+', tel: '71234024', dir: 'AV. MELCHOR URQUIDI 124', esp: 'Traumatologia' },
  { nombre: 'ELIZABETH RUTH VARGAS QUISPE', ci: '1234025', edad: 31, genero: 'Femenino', sangre: 'O+', tel: '71234025', dir: 'CALLE CALAMA 125', esp: 'Traumatologia' },
  { nombre: 'GONZALO ERNESTO CONDORI APAZA', ci: '1234026', edad: 48, genero: 'Masculino', sangre: 'AB-', tel: '71234026', dir: 'AV. GERMAN JORDAN 126', esp: 'Traumatologia' },
  { nombre: 'NATALIA ANDREA TARQUI MAMANI', ci: '1234027', edad: 26, genero: 'Femenino', sangre: 'A+', tel: '71234027', dir: 'CALLE ESTEBAN ARZE 127', esp: 'Traumatologia' },
  { nombre: 'PABLO CESAR QUISPE VILLCA', ci: '1234028', edad: 39, genero: 'Masculino', sangre: 'O+', tel: '71234028', dir: 'AV. BALLIVIAN 128', esp: 'Traumatologia' },
  { nombre: 'MONICA ISABEL FLORES COLQUE', ci: '1234029', edad: 45, genero: 'Femenino', sangre: 'B+', tel: '71234029', dir: 'CALLE PUNATA 129', esp: 'Traumatologia' },
  { nombre: 'ALEJANDRO JOSE CHOQUE TARQUI', ci: '1234030', edad: 53, genero: 'Masculino', sangre: 'O-', tel: '71234030', dir: 'AV. TADEO HAENKE 130', esp: 'Traumatologia' },
  // Neurologia
  { nombre: 'TERESA VIRGINIA MAMANI APAZA', ci: '1234031', edad: 62, genero: 'Femenino', sangre: 'O+', tel: '71234031', dir: 'AV. AMERICA 131', esp: 'Neurologia' },
  { nombre: 'RICHARD PAUL QUISPE CHOQUE', ci: '1234032', edad: 44, genero: 'Masculino', sangre: 'A+', tel: '71234032', dir: 'CALLE JORDAN 132', esp: 'Neurologia' },
  { nombre: 'LORENA PATRICIA CONDORI VILLCA', ci: '1234033', edad: 38, genero: 'Femenino', sangre: 'B+', tel: '71234033', dir: 'AV. SIMON LOPEZ 133', esp: 'Neurologia' },
  { nombre: 'HUGO WILLY TARQUI FLORES', ci: '1234034', edad: 57, genero: 'Masculino', sangre: 'O-', tel: '71234034', dir: 'CALLE ECUADOR 134', esp: 'Neurologia' },
  { nombre: 'SANDRA PATRICIA HUANCA COLQUE', ci: '1234035', edad: 41, genero: 'Femenino', sangre: 'AB+', tel: '71234035', dir: 'AV. VILLAZÓN 135', esp: 'Neurologia' },
  { nombre: 'FELIX RODRIGO APAZA MAMANI', ci: '1234036', edad: 66, genero: 'Masculino', sangre: 'A-', tel: '71234036', dir: 'CALLE MEXICO 136', esp: 'Neurologia' },
  { nombre: 'CLAUDIA VANESA VARGAS QUISPE', ci: '1234037', edad: 33, genero: 'Femenino', sangre: 'O+', tel: '71234037', dir: 'AV. BARRIENTOS 137', esp: 'Neurologia' },
  { nombre: 'WALTER IVAN COLQUE CHOQUE', ci: '1234038', edad: 49, genero: 'Masculino', sangre: 'B-', tel: '71234038', dir: 'CALLE JUNIN 138', esp: 'Neurologia' },
  { nombre: 'DIANA ELIZABETH MAMANI TARQUI', ci: '1234039', edad: 36, genero: 'Femenino', sangre: 'A+', tel: '71234039', dir: 'AV. UYUNI 139', esp: 'Neurologia' },
  { nombre: 'JAIME AUGUSTO FLORES HUANCA', ci: '1234040', edad: 72, genero: 'Masculino', sangre: 'O+', tel: '71234040', dir: 'CALLE HAMIRAYA 140', esp: 'Neurologia' },
  { nombre: 'VIVIANA RUTH QUISPE APAZA', ci: '1234041', edad: 28, genero: 'Femenino', sangre: 'AB-', tel: '71234041', dir: 'AV. CIRCUNVALACION 141', esp: 'Neurologia' },
  { nombre: 'MAURICIO ANDRES CHOQUE CONDORI', ci: '1234042', edad: 55, genero: 'Masculino', sangre: 'O+', tel: '71234042', dir: 'CALLE PUNATA 142', esp: 'Neurologia' },
  { nombre: 'GABRIELA SOFIA TARQUI VILLCA', ci: '1234043', edad: 43, genero: 'Femenino', sangre: 'A+', tel: '71234043', dir: 'AV. KANATA 143', esp: 'Neurologia' },
  { nombre: 'RONALD EFRAIN MAMANI FLORES', ci: '1234044', edad: 60, genero: 'Masculino', sangre: 'B+', tel: '71234044', dir: 'CALLE SUCRE 144', esp: 'Neurologia' },
  { nombre: 'JENNIFER PAOLA HUANCA VARGAS', ci: '1234045', edad: 31, genero: 'Femenino', sangre: 'O-', tel: '71234045', dir: 'AV. PETROLERA 145', esp: 'Neurologia' },
  // Otorrinolaringologia
  { nombre: 'DANIEL ENRIQUE APAZA TARQUI', ci: '1234046', edad: 34, genero: 'Masculino', sangre: 'O+', tel: '71234046', dir: 'AV. AMERICA 146', esp: 'Otorrinolaringologia' },
  { nombre: 'VERONICA JUDITH QUISPE MAMANI', ci: '1234047', edad: 27, genero: 'Femenino', sangre: 'A+', tel: '71234047', dir: 'CALLE BOLIVAR 147', esp: 'Otorrinolaringologia' },
  { nombre: 'CRISTIAN OMAR COLQUE FLORES', ci: '1234048', edad: 41, genero: 'Masculino', sangre: 'B+', tel: '71234048', dir: 'AV. HEROINAS 148', esp: 'Otorrinolaringologia' },
  { nombre: 'PAOLA ALEJANDRA CONDORI CHOQUE', ci: '1234049', edad: 29, genero: 'Femenino', sangre: 'O-', tel: '71234049', dir: 'CALLE ANTEZANA 149', esp: 'Otorrinolaringologia' },
  { nombre: 'LUIS FERNANDO TARQUI HUANCA', ci: '1234050', edad: 46, genero: 'Masculino', sangre: 'AB+', tel: '71234050', dir: 'AV. LIBERTAD 150', esp: 'Otorrinolaringologia' },
  { nombre: 'GRACIELA NOEMI MAMANI VARGAS', ci: '1234051', edad: 38, genero: 'Femenino', sangre: 'A-', tel: '71234051', dir: 'CALLE LANZA 151', esp: 'Otorrinolaringologia' },
  { nombre: 'SERGIO ANTONIO FLORES QUISPE', ci: '1234052', edad: 53, genero: 'Masculino', sangre: 'O+', tel: '71234052', dir: 'AV. MELCHOR URQUIDI 152', esp: 'Otorrinolaringologia' },
  { nombre: 'KARLA VANESA HUANCA APAZA', ci: '1234053', edad: 32, genero: 'Femenino', sangre: 'B-', tel: '71234053', dir: 'CALLE CALAMA 153', esp: 'Otorrinolaringologia' },
  { nombre: 'MARCOS IVAN CHOQUE COLQUE', ci: '1234054', edad: 44, genero: 'Masculino', sangre: 'A+', tel: '71234054', dir: 'AV. BALLIVIAN 154', esp: 'Otorrinolaringologia' },
  { nombre: 'JESSICA LORENA VARGAS TARQUI', ci: '1234055', edad: 36, genero: 'Femenino', sangre: 'O+', tel: '71234055', dir: 'CALLE ESTEBAN ARZE 155', esp: 'Otorrinolaringologia' },
  { nombre: 'HENRY RODRIGO MAMANI CONDORI', ci: '1234056', edad: 58, genero: 'Masculino', sangre: 'AB-', tel: '71234056', dir: 'AV. GERMAN JORDAN 156', esp: 'Otorrinolaringologia' },
  { nombre: 'ANDREA CAROLINA QUISPE FLORES', ci: '1234057', edad: 25, genero: 'Femenino', sangre: 'A+', tel: '71234057', dir: 'CALLE BAPTISTA 157', esp: 'Otorrinolaringologia' },
  { nombre: 'IVAN EDUARDO APAZA VILLCA', ci: '1234058', edad: 47, genero: 'Masculino', sangre: 'O+', tel: '71234058', dir: 'AV. TADEO HAENKE 158', esp: 'Otorrinolaringologia' },
  { nombre: 'ROXANA ELIZABETH HUANCA MAMANI', ci: '1234059', edad: 40, genero: 'Femenino', sangre: 'B+', tel: '71234059', dir: 'CALLE PUNATA 159', esp: 'Otorrinolaringologia' },
  { nombre: 'GABRIEL OMAR TARQUI CHOQUE', ci: '1234060', edad: 30, genero: 'Masculino', sangre: 'O-', tel: '71234060', dir: 'AV. SIMON LOPEZ 160', esp: 'Otorrinolaringologia' },
  // Gastroenterologia
  { nombre: 'XIMENA PATRICIA COLQUE QUISPE', ci: '1234061', edad: 39, genero: 'Femenino', sangre: 'O+', tel: '71234061', dir: 'AV. AMERICA 161', esp: 'Gastroenterologia' },
  { nombre: 'ALFREDO MARIO FLORES MAMANI', ci: '1234062', edad: 51, genero: 'Masculino', sangre: 'A+', tel: '71234062', dir: 'CALLE JORDAN 162', esp: 'Gastroenterologia' },
  { nombre: 'NATALY SUSANA CONDORI APAZA', ci: '1234063', edad: 44, genero: 'Femenino', sangre: 'B+', tel: '71234063', dir: 'AV. OQUENDO 163', esp: 'Gastroenterologia' },
  { nombre: 'FREDDY GONZALO MAMANI CHOQUE', ci: '1234064', edad: 57, genero: 'Masculino', sangre: 'O-', tel: '71234064', dir: 'CALLE COLOMBIA 164', esp: 'Gastroenterologia' },
  { nombre: 'KARINA ALEJANDRA VARGAS TARQUI', ci: '1234065', edad: 33, genero: 'Femenino', sangre: 'AB+', tel: '71234065', dir: 'AV. BLANCO GALINDO 165', esp: 'Gastroenterologia' },
  { nombre: 'WILSON CESAR HUANCA VILLCA', ci: '1234066', edad: 48, genero: 'Masculino', sangre: 'A-', tel: '71234066', dir: 'CALLE POTOSI 166', esp: 'Gastroenterologia' },
  { nombre: 'FANNY ROSARIO QUISPE COLQUE', ci: '1234067', edad: 42, genero: 'Femenino', sangre: 'O+', tel: '71234067', dir: 'AV. CIRCUNVALACION 167', esp: 'Gastroenterologia' },
  { nombre: 'JHONNY ALEX APAZA CONDORI', ci: '1234068', edad: 63, genero: 'Masculino', sangre: 'B-', tel: '71234068', dir: 'CALLE LADISLAO CABRERA 168', esp: 'Gastroenterologia' },
  { nombre: 'CELIA MIRTHA TARQUI FLORES', ci: '1234069', edad: 36, genero: 'Femenino', sangre: 'A+', tel: '71234069', dir: 'AV. AROMA 169', esp: 'Gastroenterologia' },
  { nombre: 'RAMIRO PABLO MAMANI HUANCA', ci: '1234070', edad: 55, genero: 'Masculino', sangre: 'O+', tel: '71234070', dir: 'CALLE HAMIRAYA 170', esp: 'Gastroenterologia' },
  { nombre: 'LIDIA CARMEN CHOQUE VARGAS', ci: '1234071', edad: 47, genero: 'Femenino', sangre: 'AB-', tel: '71234071', dir: 'AV. MANACO 171', esp: 'Gastroenterologia' },
  { nombre: 'HECTOR ROLANDO VILLCA MAMANI', ci: '1234072', edad: 69, genero: 'Masculino', sangre: 'O+', tel: '71234072', dir: 'CALLE SUCRE 172', esp: 'Gastroenterologia' },
  { nombre: 'VANESA ANDREA FLORES QUISPE', ci: '1234073', edad: 30, genero: 'Femenino', sangre: 'A+', tel: '71234073', dir: 'AV. REPUBLICA 173', esp: 'Gastroenterologia' },
  { nombre: 'MARCO ANTONIO COLQUE APAZA', ci: '1234074', edad: 43, genero: 'Masculino', sangre: 'B+', tel: '71234074', dir: 'CALLE MEXICO 174', esp: 'Gastroenterologia' },
  { nombre: 'SONIA ELENA HUANCA TARQUI', ci: '1234075', edad: 58, genero: 'Femenino', sangre: 'O-', tel: '71234075', dir: 'AV. KANATA 175', esp: 'Gastroenterologia' },
];

const doctores: Record<string, string> = {
  Cardiologia: '908c5544-1abd-426a-be85-c9bf36538dd2',
  Traumatologia: '93597f41-697e-4f3f-a697-f26ac4671c07',
  Neurologia: '1e8166ce-c7a8-4ac8-b450-ff7b2398985c',
  Otorrinolaringologia: 'b7191ece-6469-4ece-a733-db685bab1ef5',
  Gastroenterologia: '5081b27a-f25f-4532-af23-0bf6b8671fc0',
};

const turnos = [
  { turno: 'manana', inicio: '08:00', fin: '14:00' },
  { turno: 'tarde', inicio: '15:00', fin: '18:00' },
];

async function seed() {
  await client.connect();
  console.log('Conectado a la base de datos\n');

  // Obtener ultimo historial
  const lastRes = await client.query('SELECT MAX(numero_historial) as last FROM patients');
  let historial = (lastRes.rows[0].last ?? 28929) + 1;

  const today = new Date().toISOString().split('T')[0];
  let fichasPorEspTurno: Record<string, number> = {};

  console.log('Creando 75 pacientes con citas...\n');

  for (const p of pacientes) {
    // Verificar si ya existe
    const exists = await client.query('SELECT id FROM patients WHERE ci = $1', [p.ci]);
    let patientId: string;

    if (exists.rows.length > 0) {
      patientId = exists.rows[0].id;
    } else {
      const res = await client.query(
        `INSERT INTO patients (id, nombre, ci, edad, genero, "tipoSangre", telefono, direccion, numero_historial, especialidad_requerida, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING id`,
        [p.nombre, p.ci, p.edad, p.genero, p.sangre, p.tel, p.dir, historial++, p.esp]
      );
      patientId = res.rows[0].id;
    }

    // Asignar turno alternado
    const turnoIdx = pacientes.indexOf(p) % 2;
    const turno = turnos[turnoIdx];
    const key = `${p.esp}_${turno.turno}`;
    fichasPorEspTurno[key] = (fichasPorEspTurno[key] ?? 0) + 1;
    const ficha = fichasPorEspTurno[key];

    // Crear cita
    await client.query(
      `INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, status, turno, especialidad, numero_ficha, total_fichas_turno, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'CONFIRMADA', $5, $6, $7, 15, NOW(), NOW())`,
      [patientId, doctores[p.esp], today, turno.inicio, turno.turno, p.esp, ficha]
    );

    console.log(`  [OK] ${p.nombre} | ${p.esp} | Turno ${turno.turno} | Ficha ${ficha}/15`);
  }

  console.log('\n=== Resumen ===');
  for (const key of Object.keys(fichasPorEspTurno)) {
    console.log(`  ${key}: ${fichasPorEspTurno[key]} citas`);
  }

  await client.end();
  console.log('\nSeed completado. 75 pacientes creados.');
}

seed().catch(console.error);