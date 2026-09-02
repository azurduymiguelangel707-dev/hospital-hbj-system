SELECT d.id, d.specialty, u.first_name, u.last_name, u.employee_id FROM doctors d JOIN users u ON d.user_id = u.id WHERE u.first_name ILIKE '%Augusto%' OR u.last_name ILIKE '%Kuno%';
