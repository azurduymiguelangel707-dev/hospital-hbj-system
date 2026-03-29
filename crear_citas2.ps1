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

Write-Host "`n[1/3] Login..." -ForegroundColor Cyan
$ta = Login "ADM-000001" "Adm00001"
if (-not $ta) { exit }
$te = Login "ENF-CAR-001" "mpxAQJmkVe"
if (-not $te) { $te = $ta }
Write-Host "OK" -ForegroundColor Green

$docs = @{
    "Cardiologia"          = @{ manana="908c5544-1abd-426a-be85-c9bf36538dd2"; tarde="49e54e0d-5f8c-4325-b753-be7311577745" }
    "Neurologia"           = @{ manana="1e8166ce-c7a8-4ac8-b450-ff7b2398985c"; tarde="26cec3b8-358a-49cb-b84a-a25d839f646b" }
    "Gastroenterologia"    = @{ manana="5081b27a-f25f-4532-af23-0bf6b8671fc0"; tarde="09b1c921-3f7e-4bc8-99ed-d943a0c5befc" }
    "Traumatologia"        = @{ manana="93597f41-697e-4f3f-a697-f26ac4671c07"; tarde="089fe913-bb96-4ea0-8b8e-d8e77429ba67" }
    "Otorrinolaringologia" = @{ manana="b7191ece-6469-4ece-a733-db685bab1ef5"; tarde="40fbbad0-18dc-4a30-9ee6-ad9b5fa99913" }
}

$pacientes = @(
    @{ id="d3739f8f-01b6-4e9d-b49d-3c217809c75a"; esp="Cardiologia";          motivo="Control presion arterial";  vpa="165/105"; vfc=102; vfr=22; vt=38.2; vp=90; vsp=93  },
    @{ id="f110cd79-6ad8-4e44-a40d-6b4f714e4d14"; esp="Cardiologia";          motivo="Revision cardiologica";     vpa="142/92";  vfc=88;  vfr=18; vt=37.1; vp=72; vsp=97  },
    @{ id="de3f39a0-4c17-416e-a3de-2812b3e47601"; esp="Cardiologia";          motivo="Dolor en el pecho";         vpa="120/80";  vfc=72;  vfr=16; vt=36.8; vp=85; vsp=98  },
    @{ id="c4182b92-28f9-4de4-ab06-21f7d4bd23eb"; esp="Neurologia";           motivo="Migrania con aura";         vpa="118/76";  vfc=65;  vfr=14; vt=36.5; vp=55; vsp=99  },
    @{ id="075871d5-aedc-4e48-ad96-aebb94ada20b"; esp="Neurologia";           motivo="Control epilepsia";         vpa="125/82";  vfc=78;  vfr=16; vt=36.7; vp=68; vsp=98  },
    @{ id="30a83cad-8fc2-4184-bf04-3d240ac6a6f0"; esp="Neurologia";           motivo="Neuropatia periferica";     vpa="130/88";  vfc=95;  vfr=20; vt=37.4; vp=74; vsp=96  },
    @{ id="d9a75f73-ff3e-4014-b650-5f0fac8cb598"; esp="Gastroenterologia";    motivo="Gastritis erosiva";         vpa="110/70";  vfc=60;  vfr=15; vt=36.6; vp=71; vsp=98  },
    @{ id="c8ec2cb1-0ec1-4b23-a42c-a4677aec7cd6"; esp="Gastroenterologia";    motivo="Colon irritable";           vpa="122/80";  vfc=75;  vfr=17; vt=36.9; vp=80; vsp=97  },
    @{ id="a6089fe8-18e6-4215-994d-92c8afa435c6"; esp="Gastroenterologia";    motivo="Reflujo gastroesofagico";   vpa="108/68";  vfc=58;  vfr=13; vt=36.3; vp=62; vsp=99  },
    @{ id="e02e1c83-cb31-465d-8485-8d994b7f53b0"; esp="Traumatologia";        motivo="Fractura consolidada";      vpa="138/88";  vfc=92;  vfr=20; vt=37.4; vp=82; vsp=96  },
    @{ id="11482616-220d-45e4-9444-7eafda593286"; esp="Traumatologia";        motivo="Lumbalgia cronica";         vpa="115/75";  vfc=68;  vfr=15; vt=36.6; vp=78; vsp=98  },
    @{ id="4da5350a-5fb5-4637-94ae-357c744c30f3"; esp="Traumatologia";        motivo="Esguince rodilla";          vpa="145/95";  vfc=85;  vfr=18; vt=37.0; vp=90; vsp=97  },
    @{ id="74f4d7d8-afa6-4c1e-be37-223474ebaf37"; esp="Otorrinolaringologia"; motivo="Sinusitis cronica";         vpa="122/80";  vfc=75;  vfr=17; vt=36.9; vp=63; vsp=98  },
    @{ id="c40ff1ab-096a-4468-8861-e5e7076de5af"; esp="Otorrinolaringologia"; motivo="Hipoacusia bilateral";      vpa="118/76";  vfc=70;  vfr=16; vt=36.7; vp=58; vsp=99  },
    @{ id="5181e4d9-666d-44a0-a9da-5d3acdcd3574"; esp="Otorrinolaringologia"; motivo="Polipo nasal";              vpa="130/85";  vfc=80;  vfr=18; vt=37.1; vp=67; vsp=97  }
)

Write-Host "`n[2/3] Creando citas MANANA y TARDE + vitales..." -ForegroundColor Cyan

$citasOK   = 0
$vitalesOK = 0

foreach ($pac in $pacientes) {
    $espNombre = $pac.esp.Substring(0, [Math]::Min(8, $pac.esp.Length))

    # --- CITA MANANA ---
    $rm = APIPOST $ta "/appointments/agendar" @{
        patientId    = $pac.id
        doctorId     = $docs[$pac.esp].manana
        fecha        = $HOY
        especialidad = $pac.esp
        turno        = "MANANA"
        reason       = $pac.motivo
    }
    if ($rm -and $rm.id) {
        $citasOK++
        Write-Host "  MANANA $espNombre ficha=$($rm.numeroFicha) hora=$($rm.appointmentTime)" -ForegroundColor Green

        # Vitales turno manana
        $rv = APIPOST $te "/vital-signs" @{
            patientId              = $pac.id
            appointmentId          = $rm.id
            presionArterial        = $pac.vpa
            frecuenciaCardiaca     = $pac.vfc
            frecuenciaRespiratoria = $pac.vfr
            temperatura            = $pac.vt
            peso                   = $pac.vp
            saturacionOxigeno      = $pac.vsp
            registeredBy           = "Enfermeria simulacro"
        }
        if ($rv -and $rv.id) {
            $vitalesOK++
            if ($pac.vsp -lt 94 -or $pac.vfc -gt 100 -or $pac.vt -gt 37.5) {
                Write-Host "    VITALES ALERTA PA=$($pac.vpa) FC=$($pac.vfc) SpO2=$($pac.vsp) T=$($pac.vt)" -ForegroundColor Red
            } else {
                Write-Host "    VITALES OK PA=$($pac.vpa) FC=$($pac.vfc) SpO2=$($pac.vsp)" -ForegroundColor DarkGreen
            }
        }
    }
    Start-Sleep -Milliseconds 300

    # --- CITA TARDE ---
    $rt = APIPOST $ta "/appointments/agendar" @{
        patientId    = $pac.id
        doctorId     = $docs[$pac.esp].tarde
        fecha        = $HOY
        especialidad = $pac.esp
        turno        = "TARDE"
        reason       = "$($pac.motivo) — control tarde"
    }
    if ($rt -and $rt.id) {
        $citasOK++
        Write-Host "  TARDE  $espNombre ficha=$($rt.numeroFicha) hora=$($rt.appointmentTime)" -ForegroundColor Yellow
    }
    Start-Sleep -Milliseconds 300
}

Write-Host ""
Write-Host "========================================" -ForegroundColor White
Write-Host "  COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor White
Write-Host "  Citas creadas      : $citasOK de 30 esperadas"
Write-Host "  Vitales registrados: $vitalesOK de 15 esperados"
Write-Host "========================================" -ForegroundColor White
Write-Host "Verifica en: https://hospital-hbj-system-production.up.railway.app" -ForegroundColor Cyan
