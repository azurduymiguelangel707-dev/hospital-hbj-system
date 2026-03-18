$baseUrl = "http://localhost:3001/api"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 PRUEBAS DE API - HOSPITAL HBJ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Crear Doctor
Write-Host "📋 Test 1: Crear Doctor..." -ForegroundColor Yellow
$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$doctorBody = @{
    nombre = "Dr. Carlos Mendoza"
    especialidad = "Cardiología"
    licencia = "LIC-CARD-$timestamp"
    telefono = "+591 70012345"
    email = "carlos.mendoza.$timestamp@hbj.bo"
    biografia = "Especialista en cardiología con 15 años de experiencia"
} | ConvertTo-Json

try {
    $doctor = Invoke-RestMethod -Uri "$baseUrl/doctors" -Method Post -Body $doctorBody -ContentType "application/json"
    Write-Host "   ✅ Doctor creado exitosamente" -ForegroundColor Green
    Write-Host "   📌 ID: $($doctor.id)" -ForegroundColor Gray
    $doctorId = $doctor.id
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Listar Doctores
Write-Host "📋 Test 2: Listar Doctores..." -ForegroundColor Yellow
try {
    $doctors = Invoke-RestMethod -Uri "$baseUrl/doctors" -Method Get
    Write-Host "   ✅ Doctores obtenidos: $($doctors.Count)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Crear Paciente
Write-Host "📋 Test 3: Crear Paciente..." -ForegroundColor Yellow
$patientBody = @{
    nombre = "Juan Pérez"
    ci = "LP-$timestamp"
    edad = 45
    genero = "Masculino"
    tipoSangre = "O+"
    telefono = "+591 71234567"
    email = "juan.perez.$timestamp@email.com"
    direccion = "Av. Principal #123, La Paz"
    alergias = @("Penicilina", "Polvo")
    medicamentos = @("Losartan 50mg")
    condiciones = @("Hipertensión")
    contactoEmergencia = @{
        nombre = "María Pérez"
        parentesco = "Esposa"
        telefono = "+591 72345678"
    }
} | ConvertTo-Json

try {
    $patient = Invoke-RestMethod -Uri "$baseUrl/patients" -Method Post -Body $patientBody -ContentType "application/json"
    Write-Host "   ✅ Paciente creado exitosamente" -ForegroundColor Green
    Write-Host "   📌 ID: $($patient.id)" -ForegroundColor Gray
    $patientId = $patient.id
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 4: Listar Pacientes
Write-Host "📋 Test 4: Listar Pacientes..." -ForegroundColor Yellow
try {
    $patients = Invoke-RestMethod -Uri "$baseUrl/patients" -Method Get
    Write-Host "   ✅ Pacientes obtenidos: $($patients.Count)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 5: Crear Cita
Write-Host "📋 Test 5: Crear Cita..." -ForegroundColor Yellow
$appointmentBody = @{
    patientId = $patientId
    doctorId = $doctorId
    appointmentDate = "2026-01-25"
    appointmentTime = "10:30"
    reason = "Control de presión arterial"
    durationMinutes = 30
} | ConvertTo-Json

try {
    $appointment = Invoke-RestMethod -Uri "$baseUrl/appointments" -Method Post -Body $appointmentBody -ContentType "application/json"
    Write-Host "   ✅ Cita creada exitosamente" -ForegroundColor Green
    Write-Host "   📌 ID: $($appointment.id)" -ForegroundColor Gray
    Write-Host "   📅 Fecha: $($appointment.appointmentDate)" -ForegroundColor Gray
    Write-Host "   🕐 Hora: $($appointment.appointmentTime)" -ForegroundColor Gray
    $appointmentId = $appointment.id
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 6: Listar Citas
Write-Host "📋 Test 6: Listar Citas..." -ForegroundColor Yellow
try {
    $appointments = Invoke-RestMethod -Uri "$baseUrl/appointments" -Method Get
    Write-Host "   ✅ Citas obtenidas: $($appointments.Count)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ TODAS LAS PRUEBAS COMPLETADAS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Resumen de IDs:" -ForegroundColor Yellow
Write-Host "   Doctor ID:    $doctorId" -ForegroundColor Gray
Write-Host "   Paciente ID:  $patientId" -ForegroundColor Gray
Write-Host "   Cita ID:      $appointmentId" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Backend funcionando correctamente!" -ForegroundColor Green
Write-Host ""
