import type { ConsultaForm, PatientDetail } from '@/lib/types/doctor.types';
import type { AppointmentWithPatient } from '@/lib/types/doctor.types';

interface Props {
  form: ConsultaForm;
  patientDetail: PatientDetail | null;
  appointment: AppointmentWithPatient;
  doctorNombre: string;
  doctorEspecialidad: string;
}

export function imprimirOrdenMedica({ form, patientDetail, appointment, doctorNombre, doctorEspecialidad }: Props) {
  const fecha = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const hora  = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const nombre   = patientDetail?.nombre ?? (appointment.patient as any)?.nombre ?? 'Paciente';
  const ci       = patientDetail?.ci ? 'CI: ' + patientDetail.ci : '';
  const edad     = patientDetail?.edad ? patientDetail.edad + ' anos' : '';
  const historial= patientDetail?.historialNumero ? 'N Historial: ' + patientDetail.historialNumero : '';
  const sangre   = patientDetail?.tipoSangre ? 'Grupo: ' + patientDetail.tipoSangre : '';
  const citaId   = appointment.id?.substring(0,8).toUpperCase() ?? '';
  const turno    = (appointment as any).turno ?? 'Manana';

  const medRows = form.prescripciones.map((p, i) =>
    '<tr><td class="n">' + (i+1) + '</td><td>' + p.medicamento + '</td><td>' + (p.dosis||'—') + '</td><td>' + (p.duracion||'—') + '</td></tr>'
  ).join('');

  const estItems = form.estudiosSolicitados.map(e => '<li>' + e + '</li>').join('');

  const controlFecha = form.fechaControl
    ? new Date(form.fechaControl).toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
    : '';

  const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Orden Medica</title><style>' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'body{font-family:"Times New Roman",serif;font-size:11pt;color:#000;background:#fff}' +
    '.p{width:210mm;min-height:297mm;margin:0 auto;padding:18mm 20mm 15mm 20mm}' +
    '.hn{font-size:15pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;text-align:center}' +
    '.hs{font-size:9pt;text-align:center;margin-top:2px;color:#333}' +
    '.hb{border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:14px}' +
    '.dt{font-size:13pt;font-weight:bold;text-align:center;text-transform:uppercase;letter-spacing:2px;border-top:1px solid #000;border-bottom:1px solid #000;padding:4px 0;margin-top:10px}' +
    '.ig{display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;margin-bottom:14px;font-size:10pt}' +
    '.f{grid-column:1/-1}.lb{font-weight:bold}' +
    '.s{margin-bottom:14px;page-break-inside:avoid}' +
    '.st{font-size:10pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #000;padding-bottom:3px;margin-bottom:8px}' +
    '.sb{font-size:10.5pt;line-height:1.6;text-align:justify;padding-left:4px}' +
    'table{width:100%;border-collapse:collapse;font-size:10pt;margin-top:4px}' +
    'th{border-bottom:1px solid #000;border-top:1px solid #000;padding:4px 6px;text-align:left;font-weight:bold;font-size:9.5pt;text-transform:uppercase}' +
    'td{padding:5px 6px;border-bottom:1px dotted #999;vertical-align:top}' +
    '.n{font-weight:bold;width:24px;text-align:center}' +
    'ul.e{list-style:none;padding:0;columns:2;column-gap:20px}' +
    'ul.e li{padding:3px 0;font-size:10pt;break-inside:avoid}' +
    'ul.e li::before{content:"\\2610  "}' +
    '.fr{margin-top:30px;display:grid;grid-template-columns:1fr 1fr;gap:20px}' +
    '.fb{text-align:center}.fl{border-top:1px solid #000;margin-bottom:4px;margin-top:40px}' +
    '.fn{font-size:10pt;font-weight:bold}.fc{font-size:9pt;color:#333}' +
    '.pie{position:fixed;bottom:12mm;left:20mm;right:20mm;border-top:1px solid #000;padding-top:5px;font-size:8pt;color:#555;display:flex;justify-content:space-between}' +
    '.leg{font-size:8pt;color:#666;text-align:center;margin-top:20px;font-style:italic;border-top:1px dotted #999;padding-top:8px}' +
    '@media print{body{padding:0}.p{padding:15mm 18mm 20mm 18mm}@page{size:A4;margin:0}}' +
    '</style></head><body><div class="p">' +
    '<div class="hb"><div class="hn">Hospital HBJ</div>' +
    '<div class="hs">Sistema Hospitalario Integral — Departamento de ' + doctorEspecialidad + '</div>' +
    '<div class="dt">Orden Medica</div></div>' +
    '<div class="ig">' +
    '<div class="f"><span class="lb">Fecha:</span> ' + fecha + ' — ' + hora + ' hrs</div>' +
    '<div><span class="lb">Paciente:</span> ' + nombre + '</div>' +
    '<div><span class="lb">' + ci + '</span></div>' +
    (edad ? '<div><span class="lb">Edad:</span> ' + edad + '</div>' : '') +
    (historial ? '<div><span class="lb">' + historial + '</span></div>' : '') +
    (sangre ? '<div><span class="lb">' + sangre + '</span></div>' : '') +
    '<div><span class="lb">Medico tratante:</span> Dr./Dra. ' + doctorNombre + '</div>' +
    '<div><span class="lb">Especialidad:</span> ' + doctorEspecialidad + '</div>' +
    '<div><span class="lb">N Cita:</span> ' + citaId + '</div>' +
    '<div><span class="lb">Turno:</span> ' + turno + '</div>' +
    '</div>' +
    (form.motivoConsulta ? '<div class="s"><div class="st">Motivo de Consulta</div><div class="sb">' + form.motivoConsulta + '</div></div>' : '') +
    (form.diagnostico ? '<div class="s"><div class="st">Diagnostico</div><div class="sb">' + form.diagnostico + '</div></div>' : '') +
    (form.tratamiento ? '<div class="s"><div class="st">Plan de Tratamiento</div><div class="sb">' + form.tratamiento + '</div></div>' : '') +
    (form.prescripciones.length > 0 ? '<div class="s"><div class="st">Prescripcion de Medicamentos</div><table><thead><tr><th class="n">N</th><th>Medicamento</th><th>Dosis y Frecuencia</th><th>Duracion</th></tr></thead><tbody>' + medRows + '</tbody></table></div>' : '') +
    (form.estudiosSolicitados.length > 0 ? '<div class="s"><div class="st">Estudios Solicitados</div><div class="sb" style="margin-bottom:6px">Se solicita la realizacion de los siguientes estudios complementarios:</div><ul class="e">' + estItems + '</ul></div>' : '') +
    (form.fechaControl ? '<div class="s"><div class="st">Proximo Control</div><div class="sb">Se indica control medico para el dia <strong>' + controlFecha + '</strong>.</div></div>' : '') +
    '<div class="fr"><div class="fb"><div class="fl"></div><div class="fn">Dr./Dra. ' + doctorNombre + '</div><div class="fc">' + doctorEspecialidad + ' — Hospital HBJ</div></div>' +
    '<div class="fb"><div class="fl"></div><div class="fn">Firma del Paciente</div><div class="fc">' + nombre + ' — Recibido conforme</div></div></div>' +
    '<div class="leg">Documento generado electronicamente por el Sistema HBJ. Valido con firma del medico tratante. Emitido: ' + fecha + '</div>' +
    '</div><div class="pie"><span>Hospital HBJ — Sistema Hospitalario Integral</span><span>Doc. N ' + citaId + ' — ' + fecha + '</span></div></body></html>';

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) { alert('Error al generar la orden'); return; }
  doc.open(); doc.write(html); doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }, 500);
}
