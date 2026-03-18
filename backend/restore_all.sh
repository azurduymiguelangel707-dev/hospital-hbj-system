#!/bin/sh
BACKUP=/app/backups/$1
echo Restaurando: $BACKUP
# Extraer solo los INSERTs de datos, ignorar CREATE TABLE y constraints
grep '^INSERT INTO' $BACKUP > /tmp/only_inserts.sql
echo Inserts encontrados: $(wc -l < /tmp/only_inserts.sql)
PGPASSWORD=hospital_secure_2024 psql -h hospital_db -p 5432 -U hospital_admin -d hospital_db -f /tmp/only_inserts.sql > /tmp/restore_log.txt 2>&1
echo Resultado:
grep -c 'INSERT 0 [^0]' /tmp/restore_log.txt || echo 0 inserts exitosos
PGPASSWORD=hospital_secure_2024 psql -h hospital_db -p 5432 -U hospital_admin -d hospital_db -c "SELECT COUNT(*) as pacientes FROM patients; SELECT COUNT(*) as citas FROM appointments WHERE appointment_date = CURRENT_DATE;"
