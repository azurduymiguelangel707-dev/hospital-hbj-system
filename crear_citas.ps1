$BASE = "https://hospital-hbj-system-production.up.railway.app/api"
$HOY  = (Get-Date).ToString("yyyy-MM-dd")

function Login($email, $pass) {
    try {
        $r = Invoke-RestMethod -Uri "$BASE/auth/login" -Method POST -Body (@{username=$email;password=$pass}|ConvertTo-Json) -ContentType "application/json"
        if ($r.access_token) { return $r.access_token }
        return $r.token
    } catch { Write-Host "ERROR login $email" -ForegroundColor Red; return $null }
}

function APIPOST($token, $url, $body) {
    try {
        return Invoke-RestMethod -Uri "$BASE$url" -Method POST -Body ($body|ConvertTo-Json -Depth 5) -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
    } catch { Write-Host "  ERROR $url : $($_.Exception.Message)" -ForegroundColor Red; return $null }
}

# LOGIN
Write-Host "`n[1/3] Login..." -ForegroundColor Cyan
$ta = Login "ADM-000001" "Adm00001"
if (-not $ta) { exit }
$te = Login "ENF-CAR-001" "mpxAQJmkVe"
if (-not $te) { $te = $ta }
Write-Host "OK" -ForegroundColor Green

# DOCTORES por especialidad - turno mañana y tarde
$docs = @{
    "Cardiologia"          = @{ manana="908c5544-1abd-426a-be85-c9bf36538dd2"; tarde="49e54e0d-5f8c-4325-b753-be7311577745" }
    "Neurologia"           = @{ manana="1e8166ce-c7a8-4ac8-b450-ff7b2398985c"; tarde="26cec3b8-358a-49cb-b84a-a25d839f646b" }
    "Gastroenterologia"    = @{ manana="5081b27a-f25f-4532-af23-0bf6b8671fc0"; tarde="09b1c921-3f7e-4bc8-99ed-d943a0c5befc" }
    "Traumatologia"        = @{ manana="93597f41-697e-4f3f-a697-f26ac4671c07"; tarde="089fe913-bb96-4ea0-8b8e-d8e77429ba67" }
    "Otorrinolaringologia" = @{ manana="b7191ece-6469-4ece-a733-db685bab1ef5"; tarde="40fbbad0-18dc-4a30-9ee6-ad9b5fa99913" }
}

# PACIENTES - 3 por especialidad (15 total)
$pacientes = @(
    # Cardiologia
    @{ nombre="DANIEL OMAR MAMANI FLORES";    ci="9400001"; edad=52; genero="Masculino"; tipoSangre="O+";  telefono="71400001"; especialidadRequerida="Cardiologia";          diagnosticosPresuntivos="Hipertension arterial estadio II" },
    @{ nombre="PATRICIA ELENA QUISPE COPA";   ci="9400002"; edad=45; genero="Femenino";  tipoSangre="A+";  telefono="71400002"; especialidadRequerida="Cardiologia";          diagnosticosPresuntivos="Arritmia supraventricular" },
    @{ nombre="MARCOS ANTONIO CONDORI VEGA";  ci="9400003"; edad=61; genero="Masculino"; tipoSangre="B+";  telefono="71400003"; especialidadRequerida="Cardiologia";          diagnosticosPresuntivos="Insuficiencia cardiaca leve" },
    # Neurologia
    @{ nombre="ROSA ANGELA TARQUI MAMANI";    ci="9400004"; edad=38; genero="Femenino";  tipoSangre="AB+"; telefono="71400004"; especialidadRequerida="Neurologia";           diagnosticosPresuntivos="Migrania con aura" },
    @{ nombre="IVAN RODRIGO FLORES CHOQUE";   ci="9400005"; edad=29; genero="Masculino"; tipoSangre="O-";  telefono="71400005"; especialidadRequerida="Neurologia";           diagnosticosPresuntivos="Epilepsia focal" },
    @{ nombre="CARMEN BEATRIZ VARGAS APAZA";  ci="9400006"; edad=55; genero="Femenino";  tipoSangre="A-";  telefono="71400006"; especialidadRequerida="Neurologia";           diagnosticosPresuntivos="Neuropatia periferica" },
    # Gastroenterologia
    @{ nombre="HUGO CESAR SALINAS QUISPE";    ci="9400007"; edad=43; genero="Masculino"; tipoSangre="B-";  telefono="71400007"; especialidadRequerida="Gastroenterologia";    diagnosticosPresuntivos="Gastritis erosiva" },
    @{ nombre="LUCIA ANDREA COPA TORREZ";     ci="9400008"; edad=36; genero="Femenino";  tipoSangre="O+";  telefono="71400008"; especialidadRequerida="Gastroenterologia";    diagnosticosPresuntivos="Colon irritable" },
    @{ nombre="FELIX OMAR MAMANI GUTIERREZ";  ci="9400009"; edad=67; genero="Masculino"; tipoSangre="A+";  telefono="71400009"; especialidadRequerida="Gastroenterologia";    diagnosticosPresuntivos="Reflujo gastroesofagico" },
    # Traumatologia
    @{ nombre="VERONICA ROSA CHOQUE FLORES";  ci="9400010"; edad=32; genero="Femenino";  tipoSangre="AB-"; telefono="71400010"; especialidadRequerida="Traumatologia";        diagnosticosPresuntivos="Fractura consolidada femur" },
    @{ nombre="PABLO CESAR CONDORI MAMANI";   ci="9400011"; edad=48; genero="Masculino"; tipoSangre="O+";  telefono="71400011"; especialidadRequerida="Traumatologia";        diagnosticosPresuntivos="Lumbalgia cronica" },
    @{ nombre="DIANA PATRICIA QUISPE VARGAS"; ci="9400012"; edad=25; genero="Femenino";  tipoSangre="B+";  telefono="71400012"; especialidadRequerida="Traumatologia";        diagnosticosPresuntivos="Esguince rodilla grado II" },
    # Otorrinolaringologia
    @{ nombre="CARLOS MIGUEL COPA SALINAS";   ci="9400013"; edad=41; genero="Masculino"; tipoSangre="A+";  telefono="71400013"; especialidadRequerida="Otorrinolaringologia"; diagnosticosPresuntivos="Sinusitis cronica" },
    @{ nombre="ELENA AURORA MAMANI FLORES";   ci="9400014"; edad=57; genero="Femenino";  tipoSangre="O-";  telefono="71400014"; especialidadRequerida="Otorrinolaringologia"; diagnosticosPresuntivos="Hipoacusia bilateral" },
    @{ nombre="JORGE IVAN TARQUI CONDORI";    ci="9400015"; edad=34; genero="Masculino"; tipoSangre="B-";  telefono="71400015"; especialidadRequerida="Otorrinolaringologia"; diagnosticosPresuntivos="Polipo nasal" }
)

# CREAR PACIENTES
Write-Host "`n[2/3] Creando 15 pacientes (3 por especialidad)..." -ForegroundColor Cyan
$ids = @{}
foreach ($p in $pacientes) {
    $r = APIPOST $ta "/patients" $p
    if ($r -and $r.id) {
        $ids[$r.id] = $p.especialidadRequerida
        Write-Host "  OK $($p.nombre) [$($r.id.Substring(0,8))...]" -ForegroundColor Green
    }
    Start-Sleep -Milliseconds 250
}
Write-Host "  Pacientes creados: $($ids.Count)/15" -ForegroundColor Cyan

# CREAR CITAS - turno manana Y tarde para cada paciente
Write-Host "`n[3/3] Creando citas turno MANANA y TARDE..." -ForegroundColor Cyan

$motivos = @{
    "Cardiologia"          = @("Control presion arterial","Revision cardiologica","Dolor en el pecho")
    "Neurologia"           = @("Control neurologico","Cefalea cronica","Seguimiento epilepsia")
    "Gastroenterologia"    = @("Dolor abdominal","Control gastritis","Revision endoscopia")
    "Traumatologia"        = @("Dolor lumbar","Control post operatorio","Revision radiografia")
    "Otorrinolaringologia" = @("Sinusitis cronica","Control audiometria","Revision polipo")
}

$vitalesBase = @{
    "Cardiologia"          = @(@{pa="165/105";fc=102;fr=22;t=38.2;p=90;sp=93}, @{pa="142/92";fc=88;fr=18;t=37.1;p=72;sp=97}, @{pa="120/80";fc=72;fr=16;t=36.8;p=85;sp=98})
    "Neurologia"           = @(@{pa="118/76";fc=65;fr=14;t=36.5;p=55;sp=99},  @{pa="125/82";fc=78;fr=16;t=36.7;p=68;sp=98}, @{pa="130/88";fc=95;fr=20;t=37.4;p=74;sp=96})
    "Gastroenterologia"    = @(@{pa="110/70";fc=60;fr=15;t=36.6;p=71;sp=98},  @{pa="122/80";fc=75;fr=17;t=36.9;p=80;sp=97}, @{pa="108/68";fc=58;fr=13;t=36.3;p=62;sp=99})
    "Traumatologia"        = @(@{pa="138/88";fc=92;fr=20;t=37.4;p=82;sp=96},  @{pa="115/75";fc=68;fr=15;t=36.6;p=78;sp=98}, @{pa="145/95";fc=85;fr=18;t=37.0;p=90;sp=97})
    "Otorrinolaringologia" = @(@{pa="122/80";fc=75;fr=17;t=36.9;p=63;sp=98},  @{pa="118/76";fc=70;fr=16;t=36.7;p=58;sp=99}, @{pa="130/85";fc=80;fr=18;t=37.1;p=67;sp=97})
}

$citasOK   = 0
$vitalesOK = 0
$espIdx    = @{}

foreach ($pid in $ids.Keys) {
    $esp = $ids[$pid]
    if (-not $espIdx[$esp]) { $espIdx[$esp] = 0 }
    $i   = $espIdx[$esp]
    $mot = $motivos[$esp][$i % $motivos[$esp].Count]
    $vd  = $vitalesBase[$esp][$i % $vitalesBase[$esp].Count]

    # Cita MANANA
    $r1 = APIPOST $ta "/appointments/agendar" @{
        patientId=$pid; doctorId=$docs[$esp].manana
        fecha=$HOY; especialidad=$esp; turno="MANANA"; reason=$mot
    }
    if ($r1 -and $r1.id) {
        $citasOK++
        Write-Host "  OK MANANA $($pid.Substring(0,8)) $esp ficha=$($r1.numeroFicha)" -ForegroundColor Green

        # Vitales turno manana
        $rv = APIPOST $te "/vital-signs" @{
            patientId=$pid; appointmentId=$r1.id
            presionArterial=$vd.pa; frecuenciaCardiaca=$vd.fc
            frecuenciaRespiratoria=$vd.fr; temperatura=$vd.t
            peso=$vd.p; saturacionOxigeno=$vd.sp
            registeredBy="Enfermeria simulacro"
        }
        if ($rv -and $rv.id) {
            $vitalesOK++
            if ($vd.sp -lt 94 -or $vd.fc -gt 100 -or $vd.t -gt 37.5) {
                Write-Host "    VITALES ALERTA PA=$($vd.pa) FC=$($vd.fc) SpO2=$($vd.sp)" -ForegroundColor Red
            } else {
                Write-Host "    VITALES OK PA=$($vd.pa) FC=$($vd.fc) SpO2=$($vd.sp)" -ForegroundColor DarkGreen
            }
        }
    }
    Start-Sleep -Milliseconds 300

    # Cita TARDE
    $r2 = APIPOST $ta "/appointments/agendar" @{
        patientId=$pid; doctorId=$docs[$esp].tarde
        fecha=$HOY; especialidad=$esp; turno="TARDE"; reason="$mot (tarde)"
    }
    if ($r2 -and $r2.id) {
        $citasOK++
        Write-Host "  OK TARDE  $($pid.Substring(0,8)) $esp ficha=$($r2.numeroFicha)" -ForegroundColor Yellow
    }
    Start-Sleep -Milliseconds 300

    $espIdx[$esp] = $i + 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor White
Write-Host "  COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor White
Write-Host "  Pacientes creados  : $($ids.Count)"
Write-Host "  Citas creadas      : $citasOK  (manana + tarde)"
Write-Host "  Vitales registrados: $vitalesOK"
Write-Host "========================================" -ForegroundColor White
Write-Host "Verifica en: https://hospital-hbj-system-production.up.railway.app" -ForegroundColor Cyan
