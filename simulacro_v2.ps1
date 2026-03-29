# ============================================================
# SIMULACRO HBJ - Railway
# ============================================================

$BASE = "https://hospital-hbj-system-production.up.railway.app/api"
$HOY  = (Get-Date).ToString("yyyy-MM-dd")

function Login($email, $pass) {
    $body = @{ username = $email; password = $pass } | ConvertTo-Json
    try {
        $r = Invoke-RestMethod -Uri "$BASE/auth/login" -Method POST -Body $body -ContentType "application/json"
        if ($r.access_token) { return $r.access_token }
        return $r.token
    } catch {
        Write-Host "ERROR login $email : $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function POST($token, $url, $body) {
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $json    = $body | ConvertTo-Json -Depth 5
        return Invoke-RestMethod -Uri "$BASE$url" -Method POST -Body $json -ContentType "application/json" -Headers $headers
    } catch {
        Write-Host "ERROR POST $url : $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function GET($token, $url) {
    try {
        $headers = @{ Authorization = "Bearer $token" }
        return Invoke-RestMethod -Uri "$BASE$url" -Method GET -Headers $headers
    } catch {
        Write-Host "ERROR GET $url : $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# ============================================================
# PASO 1 - Login
# ============================================================
Write-Host "`n[1/5] Login como Admin en Railway..." -ForegroundColor Cyan
$tokenAdmin = Login "ADM-000001" "Adm00001"
if (-not $tokenAdmin) { Write-Host "FALLO login. Abortando." -ForegroundColor Red; exit }
Write-Host "OK token obtenido" -ForegroundColor Green

# ============================================================
# PASO 2 - Crear 6 pacientes nuevos
# ============================================================
Write-Host "`n[2/5] Creando pacientes nuevos..." -ForegroundColor Cyan

$pacientes = @(
    @{ nombre="RODRIGO GABRIEL MAMANI QUISPE"; ci="9200101"; edad=34; genero="Masculino"; tipoSangre="O+"; telefono="71234501"; especialidadRequerida="Cardiologia";         diagnosticosPresuntivos="Hipertension arterial" },
    @{ nombre="CARMEN LUCIA FLORES TARQUI";   ci="9200102"; edad=52; genero="Femenino";  tipoSangre="A+"; telefono="71234502"; especialidadRequerida="Neurologia";          diagnosticosPresuntivos="Cefalea cronica" },
    @{ nombre="MARIO ANTONIO CONDORI APAZA";  ci="9200103"; edad=67; genero="Masculino"; tipoSangre="B+"; telefono="71234503"; especialidadRequerida="Gastroenterologia";    diagnosticosPresuntivos="Gastritis cronica" },
    @{ nombre="PATRICIA ROSA CHOQUE VILLCA";  ci="9200104"; edad=41; genero="Femenino";  tipoSangre="AB+";telefono="71234504"; especialidadRequerida="Traumatologia";       diagnosticosPresuntivos="Dolor lumbar" },
    @{ nombre="EDGAR RENE HUANCA COLQUE";     ci="9200105"; edad=28; genero="Masculino"; tipoSangre="O-"; telefono="71234505"; especialidadRequerida="Otorrinolaringologia"; diagnosticosPresuntivos="Sinusitis cronica" },
    @{ nombre="SILVIA BEATRIZ VARGAS MAMANI"; ci="9200106"; edad=45; genero="Femenino";  tipoSangre="A-"; telefono="71234506"; especialidadRequerida="Gastroenterologia";    diagnosticosPresuntivos="Colon irritable" }
)

$idsNuevos = @{}
foreach ($p in $pacientes) {
    $r = POST $tokenAdmin "/patients" $p
    if ($r -and $r.id) {
        $idsNuevos[$p.nombre] = @{ id=$r.id; esp=$p.especialidadRequerida }
        Write-Host "  OK $($p.nombre) -> $($r.id)" -ForegroundColor Green
    }
    Start-Sleep -Milliseconds 300
}

# ============================================================
# PASO 3 - Crear citas
# ============================================================
Write-Host "`n[3/5] Creando citas medicas..." -ForegroundColor Cyan

$doctores = @{
    "Cardiologia"          = "908c5544-1abd-426a-be85-c9bf36538dd2"
    "Neurologia"           = "1e8166ce-c7a8-4ac8-b450-ff7b2398985c"
    "Gastroenterologia"    = "09b1c921-3f7e-4bc8-99ed-d943a0c5befc"
    "Traumatologia"        = "089fe913-bb96-4ea0-8b8e-d8e77429ba67"
    "Otorrinolaringologia" = "b7191ece-6469-4ece-a733-db685bab1ef5"
}

$pacientesExistentes = @(
    @{ id="a22f63f2-d866-44d5-8e95-afcf9a932d92"; esp="Cardiologia";          nombre="JUAN CARLOS MAMANI QUISPE" },
    @{ id="e23fd0f6-1848-4c57-9e26-b75e57d8a779"; esp="Cardiologia";          nombre="MARIA ELENA CONDORI FLORES" },
    @{ id="f9a7f363-2b82-4cfb-9cda-b881b511c14a"; esp="Neurologia";           nombre="TERESA VIRGINIA MAMANI APAZA" },
    @{ id="eb061f8a-6064-44b4-b7f0-d252c89f5290"; esp="Neurologia";           nombre="RICHARD PAUL QUISPE CHOQUE" },
    @{ id="329d207b-68a6-4cf0-aa9e-5f1294d0b6f9"; esp="Gastroenterologia";    nombre="ALFREDO MARIO FLORES MAMANI" },
    @{ id="25f28fcd-6e8b-410b-9a9e-b0f659ee642f"; esp="Gastroenterologia";    nombre="ROSARIO DE LOS ANGELES JEMIO" },
    @{ id="008a953a-dec7-47b2-832a-e59720ef8218"; esp="Traumatologia";        nombre="MONICA ISABEL FLORES COLQUE" },
    @{ id="ba947c49-f7ba-4afa-a507-a31757aece7a"; esp="Traumatologia";        nombre="ALEJANDRO JOSE CHOQUE TARQUI" },
    @{ id="a659d3d7-bd6b-429f-a4b1-b87993295041"; esp="Cardiologia";          nombre="ANA PATRICIA MAMANI COLQUE" }
)

$motivos = @(
    "Control rutinario",
    "Dolor en el pecho",
    "Revision post operatoria",
    "Consulta por resultados de laboratorio",
    "Control de presion arterial",
    "Seguimiento de tratamiento",
    "Primera consulta",
    "Dolor cronico",
    "Chequeo general"
)

$citasCreadas = @()
$idx = 0

foreach ($p in $pacientesExistentes) {
    $body = @{
        patientId    = $p.id
        doctorId     = $doctores[$p.esp]
        fecha        = $HOY
        especialidad = $p.esp
        turno        = "MANANA"
        reason       = $motivos[$idx % $motivos.Count]
    }
    $r = POST $tokenAdmin "/appointments/agendar" $body
    if ($r -and $r.id) {
        $citasCreadas += $r.id
        $hora = if ($r.appointmentTime) { $r.appointmentTime } else { "--" }
        Write-Host "  OK $($p.nombre) $($p.esp) $hora" -ForegroundColor Green
    } else {
        Write-Host "  SKIP $($p.nombre)" -ForegroundColor Yellow
    }
    $idx++
    Start-Sleep -Milliseconds 400
}

foreach ($nombre in $idsNuevos.Keys) {
    $info     = $idsNuevos[$nombre]
    $doctorId = $doctores[$info.esp]
    if (-not $doctorId) { Write-Host "  SKIP $nombre sin doctor" -ForegroundColor Yellow; continue }
    $body = @{
        patientId    = $info.id
        doctorId     = $doctorId
        fecha        = $HOY
        especialidad = $info.esp
        turno        = "MANANA"
        reason       = $motivos[$idx % $motivos.Count]
    }
    $r = POST $tokenAdmin "/appointments/agendar" $body
    if ($r -and $r.id) {
        $citasCreadas += $r.id
        Write-Host "  OK nuevo $nombre $($info.esp)" -ForegroundColor Green
    }
    $idx++
    Start-Sleep -Milliseconds 400
}

Write-Host "  Total citas creadas: $($citasCreadas.Count)" -ForegroundColor Cyan

# ============================================================
# PASO 4 - Registrar signos vitales
# ============================================================
Write-Host "`n[4/5] Registrando signos vitales..." -ForegroundColor Cyan

$tokenEnf = Login "ENF-CAR-001" "mpxAQJmkVe"
if (-not $tokenEnf) { $tokenEnf = $tokenAdmin }

$vitalesData = @(
    @{ patientId="a22f63f2-d866-44d5-8e95-afcf9a932d92"; presion="120/80";  fc=72;  fr=16; temp=36.8; peso=74; spo2=98 },
    @{ patientId="e23fd0f6-1848-4c57-9e26-b75e57d8a779"; presion="145/95";  fc=88;  fr=18; temp=37.1; peso=68; spo2=97 },
    @{ patientId="f9a7f363-2b82-4cfb-9cda-b881b511c14a"; presion="118/76";  fc=65;  fr=14; temp=36.5; peso=55; spo2=99 },
    @{ patientId="eb061f8a-6064-44b4-b7f0-d252c89f5290"; presion="130/85";  fc=92;  fr=20; temp=37.4; peso=82; spo2=96 },
    @{ patientId="329d207b-68a6-4cf0-aa9e-5f1294d0b6f9"; presion="110/70";  fc=60;  fr=15; temp=36.6; peso=71; spo2=98 },
    @{ patientId="008a953a-dec7-47b2-832a-e59720ef8218"; presion="165/100"; fc=102; fr=22; temp=38.2; peso=90; spo2=93 },
    @{ patientId="ba947c49-f7ba-4afa-a507-a31757aece7a"; presion="122/82";  fc=75;  fr=17; temp=36.9; peso=78; spo2=98 },
    @{ patientId="25f28fcd-6e8b-410b-9a9e-b0f659ee642f"; presion="108/68";  fc=58;  fr=13; temp=36.3; peso=62; spo2=99 },
    @{ patientId="a659d3d7-bd6b-429f-a4b1-b87993295041"; presion="138/88";  fc=84;  fr=17; temp=37.0; peso=66; spo2=97 }
)

foreach ($v in $vitalesData) {
    $body = @{
        patientId              = $v.patientId
        presionArterial        = $v.presion
        frecuenciaCardiaca     = $v.fc
        frecuenciaRespiratoria = $v.fr
        temperatura            = $v.temp
        peso                   = $v.peso
        saturacionOxigeno      = $v.spo2
        registeredBy           = "Enfermeria simulacro"
    }
    $r = POST $tokenEnf "/vital-signs" $body
    if ($r -and $r.id) {
        if ($v.spo2 -lt 94 -or $v.fc -gt 100 -or $v.temp -gt 37.5) {
            Write-Host "  OK vitales $($v.patientId.Substring(0,8)) PA=$($v.presion) FC=$($v.fc) SpO2=$($v.spo2) *** ALERTA" -ForegroundColor Yellow
        } else {
            Write-Host "  OK vitales $($v.patientId.Substring(0,8)) PA=$($v.presion) FC=$($v.fc) SpO2=$($v.spo2)" -ForegroundColor Green
        }
    }
    Start-Sleep -Milliseconds 300
}

# ============================================================
# PASO 5 - Resumen
# ============================================================
Write-Host "`n[5/5] Verificando..." -ForegroundColor Cyan
$citasHoy = GET $tokenAdmin "/appointments?fecha=$HOY"
$total    = if ($citasHoy) { @($citasHoy).Count } else { 0 }

Write-Host ""
Write-Host "========================================" -ForegroundColor White
Write-Host "  SIMULACRO RAILWAY COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor White
Write-Host "  Pacientes nuevos  : $($idsNuevos.Count)"
Write-Host "  Citas creadas     : $($citasCreadas.Count)"
Write-Host "  Vitales enviados  : $($vitalesData.Count)"
Write-Host "  Citas en BD (hoy) : $total"
Write-Host "  Fecha             : $HOY"
Write-Host "========================================" -ForegroundColor White
Write-Host ""
Write-Host "Verifica en: https://hospital-hbj-system-production.up.railway.app" -ForegroundColor Cyan
