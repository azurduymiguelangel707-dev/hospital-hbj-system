'use client';
import { useState } from 'react';
import { Plus, Trash2, FileSpreadsheet, Printer } from 'lucide-react';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const TIPOS_PACIENTE = ['SUS','SEG','PRI','OTR'];
const ESPECIALIDADES = ['Medicina General','Pediatria','Ginecologia','Cirugia','Traumatologia','Neurologia','Cardiologia','Gastroenterologia','Otorrinolaringologia','Dermatologia','Oftalmologia','Psicologia','Odontologia','Enfermeria','Laboratorio','Farmacia'];
const NIVELES_ATENCION = ['I','II','III'];

interface FilaSOAPS {
  id: string;
  nHC: string;
  nAsegurado: string;
  apellidoNombre: string;
  tipoPaciente: string;
  edadM: string;
  edadF: string;
  peso: string;
  talla: string;
  especialidad: string;
  // Tipo atencion
  consultaNueva: boolean;
  consultaRepetida: boolean;
  emergencia: boolean;
  hospitalizacion: boolean;
  // Nivel
  nivelAtencion: string;
  // SOAPS
  subjetivo: string;
  objetivo: string;
  analisis: string;
  plan: string;
  // Referencia
  referencia: boolean;
  nivelReferencia: string;
  establecimientoReferencia: string;
  contrarreferencia: boolean;
  // CIE
  cie10: string;
  diagnostico: string;
  // Resultado
  alta: boolean;
  seguimiento: boolean;
  internacion: boolean;
}

function nuevaFila(): FilaSOAPS {
  return {
    id: Math.random().toString(36).substr(2,9),
    nHC: '', nAsegurado: '', apellidoNombre: '', tipoPaciente: 'SUS',
    edadM: '', edadF: '', peso: '', talla: '',
    especialidad: 'Medicina General',
    consultaNueva: false, consultaRepetida: false, emergencia: false, hospitalizacion: false,
    nivelAtencion: 'I',
    subjetivo: '', objetivo: '', analisis: '', plan: '',
    referencia: false, nivelReferencia: '', establecimientoReferencia: '',
    contrarreferencia: false,
    cie10: '', diagnostico: '',
    alta: false, seguimiento: false, internacion: false,
  };
}

export function SOAPSPanel() {
  const [fecha, setFecha] = useState({ dia: new Date().getDate().toString(), mes: (new Date().getMonth()+1).toString(), anio: new Date().getFullYear().toString() });
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFin, setHorarioFin] = useState('20:00');
  const [medico, setMedico] = useState('');
  const [nMatricula, setNMatricula] = useState('');
  const [filas, setFilas] = useState<FilaSOAPS[]>([nuevaFila(), nuevaFila(), nuevaFila()]);

  function actualizarFila(id: string, campo: keyof FilaSOAPS, valor: any) {
    setFilas(fs => fs.map(f => f.id === id ? { ...f, [campo]: valor } : f));
  }

  function agregarFila() { setFilas(fs => [...fs, nuevaFila()]); }
  function eliminarFila(id: string) { setFilas(fs => fs.filter(f => f.id !== id)); }

  function exportarExcel() {
    const rows = [
      ['REGISTRO DIARIO DE ATENCION EN PRIMER NIVEL - SOAPS'],
      ['ESTABLECIMIENTO: HOSPITAL MUNICIPAL MODELO BOLIVIANO JAPONES'],
      [`FECHA: ${fecha.dia}/${fecha.mes}/${fecha.anio}`, `HORARIO: ${horarioInicio} a ${horarioFin}`],
      [`MEDICO: ${medico}`, `NÂ° MATRICULA: ${nMatricula}`],
      [],
      ['NÂ° HC','NÂ° ASEGURADO','APELLIDO Y NOMBRES','TIPO PAC','EDAD M','EDAD F','PESO','TALLA','ESPECIALIDAD','CONS. NUEVA','CONS. REP.','EMERGENCIA','HOSPITALIZACION','NIVEL ATENCION','SUBJETIVO','OBJETIVO','ANALISIS','PLAN','REFERENCIA','NIVEL REF.','ESTABLECIMIENTO REF.','CONTRARREF.','CIE 10','DIAGNOSTICO','ALTA','SEGUIMIENTO','INTERNACION'],
      ...filas.map((f,i) => [
        i+1, f.nHC, f.nAsegurado, f.apellidoNombre, f.tipoPaciente,
        f.edadM, f.edadF, f.peso, f.talla, f.especialidad,
        f.consultaNueva?'v':'', f.consultaRepetida?'v':'', f.emergencia?'v':'', f.hospitalizacion?'v':'',
        f.nivelAtencion,
        f.subjetivo, f.objetivo, f.analisis, f.plan,
        f.referencia?'SI':'NO', f.nivelReferencia, f.establecimientoReferencia,
        f.contrarreferencia?'SI':'NO',
        f.cie10, f.diagnostico,
        f.alta?'v':'', f.seguimiento?'v':'', f.internacion?'v':''
      ])
    ];
    const csv = rows.map(r => r.join('\t')).join('\n');
    const blob = new Blob(['\ufeff'+csv], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOAPS_${fecha.dia}-${fecha.mes}-${fecha.anio}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalNuevas = filas.filter(f => f.consultaNueva).length;
  const totalRepetidas = filas.filter(f => f.consultaRepetida).length;
  const totalEmergencias = filas.filter(f => f.emergencia).length;
  const totalReferencias = filas.filter(f => f.referencia).length;
  const totalAltas = filas.filter(f => f.alta).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">Registro Diario de Atencion - SOAPS</h2>
            <p className="text-xs font-semibold text-gray-600 uppercase">Sistema de Organizacion y Atencion en Primer Nivel de Salud</p>
            <p className="text-xs text-gray-500 mt-0.5">Hospital Municipal Modelo Boliviano Japones</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportarExcel} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition">
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition">
              <Printer size={13} /> PDF
            </button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Fecha</label>
            <div className="flex gap-1">
              <input type="number" value={fecha.dia} onChange={e => setFecha(f=>({...f,dia:e.target.value}))} placeholder="DD"
                className="w-12 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-purple-500" />
              <select value={fecha.mes} onChange={e => setFecha(f=>({...f,mes:e.target.value}))}
                className="flex-1 border border-gray-200 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500">
                {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <input type="number" value={fecha.anio} onChange={e => setFecha(f=>({...f,anio:e.target.value}))} placeholder="AAAA"
                className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-purple-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Horario</label>
            <div className="flex items-center gap-1">
              <input type="time" value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500" />
              <span className="text-xs text-gray-400">a</span>
              <input type="time" value={horarioFin} onChange={e => setHorarioFin(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Medico Responsable</label>
            <input value={medico} onChange={e => setMedico(e.target.value)} placeholder="Dr. Nombre Apellido"
              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">NÂ° Matricula</label>
            <input value={nMatricula} onChange={e => setNMatricula(e.target.value)} placeholder="000000"
              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500" />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-2 mb-3 flex-shrink-0">
        {[
          { label: 'Consultas Nuevas', val: totalNuevas, color: '#8b5cf6', bg: '#f5f3ff' },
          { label: 'Repetidas', val: totalRepetidas, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Emergencias', val: totalEmergencias, color: '#ef4444', bg: '#fef2f2' },
          { label: 'Referencias', val: totalReferencias, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Altas', val: totalAltas, color: '#10b981', bg: '#f0fdf4' },
        ].map((k,i) => (
          <div key={i} className="rounded-xl p-3 text-center border" style={{ backgroundColor: k.bg, borderColor: k.color+'30' }}>
            <div className="text-2xl font-bold" style={{ color: k.color }}>{k.val}</div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-xl bg-white min-h-0">
        <div className="overflow-x-auto overflow-y-auto h-full">
          <table className="text-xs border-collapse" style={{ minWidth: '2200px' }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-purple-800 text-white">
                <th className="border border-purple-700 px-1 py-1.5 text-center w-6" rowSpan={2}>#</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center w-16" rowSpan={2}>NÂ° HC</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center w-20" rowSpan={2}>NÂ° Asegurado</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center w-44" rowSpan={2}>Apellido y Nombres</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center w-12" rowSpan={2}>Tipo</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center" colSpan={2}>Edad</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center w-12" rowSpan={2}>Peso</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center w-12" rowSpan={2}>Talla</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center w-32" rowSpan={2}>Especialidad</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center" colSpan={4}>Tipo Atencion</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center w-12" rowSpan={2}>Nivel</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center" colSpan={4}>SOAPS</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center" colSpan={3}>Referencia</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center w-14" rowSpan={2}>Contrarref.</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center w-16" rowSpan={2}>CIE 10</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center w-44" rowSpan={2}>Diagnostico</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center" colSpan={3}>Resultado</th>
                <th className="border border-purple-700 px-1 py-1.5 text-center w-10" rowSpan={2}>Acc.</th>
              </tr>
              <tr className="bg-purple-700 text-white">
                <th className="border border-purple-600 px-1 py-1 text-center w-8">M</th>
                <th className="border border-purple-600 px-1 py-1 text-center w-8">F</th>
                <th className="border border-purple-600 px-1 py-1 text-center w-12">Nueva</th>
                <th className="border border-purple-600 px-1 py-1 text-center w-12">Repet.</th>
                <th className="border border-purple-600 px-1 py-1 text-center w-14">Emerg.</th>
                <th className="border border-purple-600 px-1 py-1 text-center w-14">Hosp.</th>
                <th className="border border-purple-600 px-1 py-1 text-center w-32">Subjetivo (S)</th>
                <th className="border border-purple-600 px-1 py-1 text-center w-32">Objetivo (O)</th>
                <th className="border border-purple-600 px-1 py-1 text-center w-32">Analisis (A)</th>
                <th className="border border-purple-600 px-1 py-1 text-center w-32">Plan (P)</th>
                <th className="border border-purple-600 px-1 py-1 text-center w-12">Si/No</th>
                <th className="border border-purple-600 px-1 py-1 text-center w-12">Nivel</th>
                <th className="border border-purple-600 px-1 py-1 text-center w-32">Establecimiento</th>
                <th className="border border-purple-600 px-1 py-1 text-center w-12">Alta</th>
                <th className="border border-purple-600 px-1 py-1 text-center w-14">Seguim.</th>
                <th className="border border-purple-600 px-1 py-1 text-center w-14">Intern.</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, idx) => (
                <tr key={f.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-purple-50/30'}>
                  <td className="border border-gray-200 px-1 py-0.5 text-center text-gray-400 font-mono">{idx+1}</td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.nHC} onChange={e => actualizarFila(f.id,'nHC',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-purple-50 rounded" placeholder="00000" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.nAsegurado} onChange={e => actualizarFila(f.id,'nAsegurado',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-purple-50 rounded" placeholder="000000" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.apellidoNombre} onChange={e => actualizarFila(f.id,'apellidoNombre',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-purple-50 rounded" placeholder="Apellido y Nombres" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <select value={f.tipoPaciente} onChange={e => actualizarFila(f.id,'tipoPaciente',e.target.value)} className="w-full px-0.5 py-0.5 text-xs focus:outline-none bg-transparent">
                      {TIPOS_PACIENTE.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.edadM} onChange={e => actualizarFila(f.id,'edadM',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-purple-50 rounded text-center" placeholder="M" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.edadF} onChange={e => actualizarFila(f.id,'edadF',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-purple-50 rounded text-center" placeholder="F" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.peso} onChange={e => actualizarFila(f.id,'peso',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-purple-50 rounded text-center" placeholder="0.0" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.talla} onChange={e => actualizarFila(f.id,'talla',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-purple-50 rounded text-center" placeholder="0.0" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <select value={f.especialidad} onChange={e => actualizarFila(f.id,'especialidad',e.target.value)} className="w-full px-0.5 py-0.5 text-xs focus:outline-none bg-transparent">
                      {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </td>
                  {(['consultaNueva','consultaRepetida','emergencia','hospitalizacion'] as const).map(campo => (
                    <td key={campo} className="border border-gray-200 px-0.5 py-0.5 text-center">
                      <input type="checkbox" checked={f[campo] as boolean} onChange={e => actualizarFila(f.id,campo,e.target.checked)} className="w-3 h-3 accent-purple-600 cursor-pointer" />
                    </td>
                  ))}
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <select value={f.nivelAtencion} onChange={e => actualizarFila(f.id,'nivelAtencion',e.target.value)} className="w-full px-0.5 py-0.5 text-xs focus:outline-none bg-transparent text-center">
                      {NIVELES_ATENCION.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  {(['subjetivo','objetivo','analisis','plan'] as const).map(campo => (
                    <td key={campo} className="border border-gray-200 px-0.5 py-0.5">
                      <input value={f[campo] as string} onChange={e => actualizarFila(f.id,campo,e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-purple-50 rounded" placeholder={campo.charAt(0).toUpperCase()+campo.slice(1)+'...'} />
                    </td>
                  ))}
                  <td className="border border-gray-200 px-0.5 py-0.5 text-center">
                    <input type="checkbox" checked={f.referencia} onChange={e => actualizarFila(f.id,'referencia',e.target.checked)} className="w-3 h-3 accent-yellow-500 cursor-pointer" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <select value={f.nivelReferencia} onChange={e => actualizarFila(f.id,'nivelReferencia',e.target.value)} className="w-full px-0.5 py-0.5 text-xs focus:outline-none bg-transparent">
                      <option value="">-</option>
                      {NIVELES_ATENCION.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.establecimientoReferencia} onChange={e => actualizarFila(f.id,'establecimientoReferencia',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-yellow-50 rounded" placeholder="Establecimiento..." />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5 text-center">
                    <input type="checkbox" checked={f.contrarreferencia} onChange={e => actualizarFila(f.id,'contrarreferencia',e.target.checked)} className="w-3 h-3 accent-purple-500 cursor-pointer" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.cie10} onChange={e => actualizarFila(f.id,'cie10',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-purple-50 rounded text-center font-mono" placeholder="X00" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.diagnostico} onChange={e => actualizarFila(f.id,'diagnostico',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-purple-50 rounded" placeholder="Diagnostico..." />
                  </td>
                  {(['alta','seguimiento','internacion'] as const).map(campo => (
                    <td key={campo} className="border border-gray-200 px-0.5 py-0.5 text-center">
                      <input type="checkbox" checked={f[campo] as boolean} onChange={e => actualizarFila(f.id,campo,e.target.checked)} className="w-3 h-3 accent-green-600 cursor-pointer" />
                    </td>
                  ))}
                  <td className="border border-gray-200 px-0.5 py-0.5 text-center">
                    <button onClick={() => eliminarFila(f.id)} className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-purple-800 text-white">
              <tr>
                <td colSpan={10} className="border border-purple-700 px-3 py-1.5 text-xs font-bold uppercase">TOTALES</td>
                <td className="border border-purple-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.consultaNueva).length}</td>
                <td className="border border-purple-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.consultaRepetida).length}</td>
                <td className="border border-purple-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.emergencia).length}</td>
                <td className="border border-purple-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.hospitalizacion).length}</td>
                <td className="border border-purple-700 px-1 py-1.5 text-center text-xs font-bold">-</td>
                <td colSpan={4} className="border border-purple-700 px-1 py-1.5 text-center text-xs font-bold">-</td>
                <td className="border border-purple-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.referencia).length}</td>
                <td colSpan={2} className="border border-purple-700 px-1 py-1.5 text-center text-xs font-bold">-</td>
                <td className="border border-purple-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.contrarreferencia).length}</td>
                <td colSpan={2} className="border border-purple-700 px-1 py-1.5 text-center text-xs font-bold">-</td>
                <td className="border border-purple-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.alta).length}</td>
                <td className="border border-purple-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.seguimiento).length}</td>
                <td className="border border-purple-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.internacion).length}</td>
                <td className="border border-purple-700 px-1 py-1.5 text-center text-xs font-bold">{filas.length}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 flex-shrink-0">
        <button onClick={agregarFila} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition">
          <Plus size={14} /> Agregar Paciente
        </button>
        <div className="flex gap-2">
          <button onClick={exportarExcel} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition">
            <FileSpreadsheet size={13} /> Exportar Excel
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition">
            <Printer size={13} /> Imprimir / PDF
          </button>
        </div>
      </div>
    </div>
  );
}

