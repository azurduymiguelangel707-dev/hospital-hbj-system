import type { ConsultaForm, PatientDetail } from '@/lib/types/doctor.types';
import type { AppointmentWithPatient } from '@/lib/types/doctor.types';

interface OrdenMedicaProps {
  form: ConsultaForm;
  patientDetail: PatientDetail | null;
  appointment: AppointmentWithPatient;
  doctorNombre: string;
  doctorEspecialidad: string;
}

export function imprimirOrdenMedica({
  form, patientDetail, appointment, doctorNombre, doctorEspecialidad
}: OrdenMedicaProps) {
  const fecha = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  const hora           = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const nombrePaciente = patientDetail?.nombre ?? (appointment.patient as any)?.nombre ?? 'Paciente';
  const edad           = patientDetail?.edad ? patientDetail.edad + ' anos' : '';
  const ci             = patientDetail?.ci ? 'CI: ' + patientDetail.ci : '';
  const historial      = patientDetail?.historialNumero ? 'N Historial: ' + patientDetail.historialNumero : '';
  const tipoSangre     = patientDetail?.tipoSangre ? 'Grupo sanguineo: ' + patientDetail.tipoSangre : '';
  const tieneMeds      = form.prescripciones.length > 0;
  const tieneEstudios  = form.estudiosSolicitados.length > 0;
  const tieneControl   = !!form.fechaControl;

  const estilos = `
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Times New Roman',Times,serif; font-size:11pt; color:#000; background:#fff; }
    .pagina { width:210mm; min-height:297mm; margin:0 auto; padding:18mm 20mm 15mm 20mm; }
    .enc-nombre { font-size:15pt; font-weight:bold; text-transform:uppercase; letter-spacing:1px; text-align:center; }
    .enc-sub { font-size:9pt; text-align:center; margin-top:2px; color:#333; }
    .enc-borde { border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:14px; }
    .doc-tipo { font-size:13pt; font-weight:bold; text-align:center; text-transform:uppercase; letter-spacing:2px; border-top:1px solid #000; border-bottom:1px solid #000; padding:4px 0; margin-top:10px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:4px 20px; margin-bottom:14px; font-size:10pt; }
    .full { grid-column:1/-1; }
    .lbl { font-weight:bold; }
    .sec { margin-bottom:14px; page-break-inside:avoid; }
    .sec-t { font-size:10pt; font-weight:bold; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid #000; padding-bottom:3px; margin-bottom:8px; }
    .sec-b { font-size:10.5pt; line-height:1.6; text-align:justify; padding-left:4px; }
    table { width:100%; border-collapse:collapse; font-size:10pt; margin-top:4px; }
    th { border-bottom:1px solid #000; border-top:1px solid #000; padding:4px 6px; text-align:left; font-weight:bold; font-size:9.5pt; text-transform:uppercase; }
    td { padding:5px 6px; border-bottom:1px dotted #999; vertical-align:top; }
    .num { font-weight:bold; width:24px; text-align:center; }
    ul.estudios { list-style:none; padding:0; columns:2; column-gap:20px; }
    ul.estudios li { padding:3px 0; font-size:10pt; break-inside:avoid; display:flex; align-items:flex-start; gap:6px; }
    ul.estudios li::before { content:"\\2610"; font-size:11pt; flex-shrink:0; }
    .firmas { margin-top:30px; display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    .firma { text-align:center; }
    .firma-linea { border-top:1px solid #000; margin-bottom:4px; margin-top:40px; }
    .firma-nom { font-size:10pt; font-weight:bold; }
    .firma-car { font-size:9pt; color:#333; }
    .pie { position:fixed; bottom:12mm; left:20mm; right:20mm; border-top:1px solid #000; padding-top:5px; font-size:8pt; color:#555; display:flex; justify-content:space-between; }
    .legal { font-size:8pt; color:#666; text-align:center; margin-top:20px; font-style:italic; border-top:1px dotted #999; padding-top:8px; }
    @media print { body{padding:0} .pagina{padding:15mm 18mm 20mm 18mm} @page{size:A4;margin:0} }
  `;

  const medRows = form.prescripciones.map((p, i) =>
    `<tr><td class="num">${i+1}</td><td>${p.medicamento}</td><td>${p.dosis||'—'}</td><td>${p.duracion||'—'}</td></tr>`
  ).join('');

  const estItems = form.estudiosSolicitados.map(e => `<li>${e}</li>`).join('');

  const controlFecha = tieneControl
    ? new Date(form.fechaControl!).toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
    : '';

  const citaId = appointment.id?.substring(0,8).toUpperCase() ?? '';
  const turno  = (appointment as any).turno ?? 'Manana';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Orden Medica — ${nombrePaciente}</title>
<style>${estilos}</style>
</head>
<body>
<div class="pagina">
  <div class="enc-borde">
    <div class="enc-nombre">Hospital HBJ</div>
    <div class="enc-sub">Sistema Hospitalario Integral — Departamento de ${doctorEspecialidad}</div>
    <div class="doc-tipo">Orden Medica</div>
  </div>
  <div class="info-grid">
    <div class="full"><span class="lbl">Fecha:</span> ${fecha} — ${hora} hrs</div>
    <div><span class="lbl">Paciente:</span> ${nombrePaciente}</div>
    <div><span class="lbl">${ci}</span></div>
    ${edad ? `<div><span class="lbl">Edad:</span> ${edad}</div>` : ''}
    ${historial ? `<div><span class="lbl">${historial}</span></div>` : ''}
    ${tipoSangre ? `<div><span class="lbl">${tipoSangre}</span></div>` : ''}
    <div><span class="lbl">Medico tratante:</span> Dr./Dra. ${doctorNombre}</div>
    <div><span class="lbl">Especialidad:</span> ${doctorEspecialidad}</div>
    <div><span class="lbl">N Cita:</span> ${citaId}</div>
    <div><span class="lbl">Turno:</span> ${turno}</div>
  </div>
  ${form.motivoConsulta ? `<div class="sec"><div class="sec-t">Motivo de Consulta</div><div class="sec-b">${form.motivoConsulta}</div></div>` : ''}
  ${form.diagnostico ? `<div class="sec"><div class="sec-t">Diagnostico</div><div class="sec-b">${form.diagnostico}</div></div>` : ''}
  ${form.tratamiento ? `<div class="sec"><div class="sec-t">Plan de Tratamiento</div><div class="sec-b">${form.tratamiento}</div></div>` : ''}
  ${tieneMeds ? `
  <div class="sec">
    <div class="sec-t">Prescripcion de Medicamentos</div>
    <table><thead><tr><th class="num">N</th><th>Medicamento</th><th>Dosis y Frecuencia</th><th>Duracion</th></tr></thead>
    <tbody>${medRows}</tbody></table>
  </div>` : ''}
  ${tieneEstudios ? `
  <div class="sec">
    <div class="sec-t">Estudios y Examenes Solicitados</div>
    <div class="sec-b" style="margin-bottom:6px;">Se solicita la realizacion de los siguientes estudios complementarios:</div>
    <ul class="estudios">${estItems}</ul>
  </div>` : ''}
  ${tieneControl ? `
  <div class="sec">
    <div class="sec-t">Proximo Control</div>
    <div class="sec-b">Se indica control medico para el dia <strong>${controlFecha}</strong>.</div>
  </div>` : ''}
  <div class="firmas">
    <div class="firma">
      <div class="firma-linea"></div>
      <div class="firma-nom">Dr./Dra. ${doctorNombre}</div>
      <div class="firma-car">${doctorEspecialidad} — Hospital HBJ</div>
    </div>
    <div class="firma">
      <div class="firma-linea"></div>
      <div class="firma-nom">Firma del Paciente</div>
      <div class="firma-car">${nombrePaciente} — Recibido conforme</div>
    </div>
  </div>
  <div class="legal">Documento generado electronicamente por el Sistema HBJ. Valido con firma del medico tratante. Emitido: ${fecha}</div>
</div>
<div class="pie">
  <span>Hospital HBJ — Sistema Hospitalario Integral</span>
  <span>Doc. N ${citaId} — ${fecha}</span>
</div>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) { alert('Habilita ventanas emergentes para imprimir'); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 600);
}
