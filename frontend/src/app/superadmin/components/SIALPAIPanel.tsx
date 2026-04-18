'use client';
import { useState } from 'react';
import { Plus, Trash2, FileSpreadsheet, Printer } from 'lucide-react';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const TIPOS_PACIENTE = ['SUS','SEG','PRI','OTR'];
const BIOLOGICOS = ['BCG','HB','Pentavalente','IPV','OPV','Rotavirus','Neumococo','SPR','DPT','Influenza','FA','Anti-Hepatitis A','Toxoide','COVID-19'];

interface FilaPAI {
  id: string;
  nHC: string;
  nAsegurado: string;
  apellidoNombre: string;
  tipoPaciente: string;
  edadM: string;
  edadF: string;
  peso: string;
  talla: string;
  // Biologicos
  bcg: boolean;
  hb: boolean;
  pentavalente: boolean;
  ipv: boolean;
  opv: boolean;
  rotavirus: boolean;
  neumococo: boolean;
  spr: boolean;
  dpt: boolean;
  influenza: boolean;
  fa: boolean;
  hepatitisA: boolean;
  toxoide: boolean;
  covid: boolean;
  // Dosis
  dosis1: boolean;
  dosis2: boolean;
  dosis3: boolean;
  dosisR: boolean;
  // Alerta
  alertaEpidemiologica: boolean;
  tipoAlerta: string;
  // ESAVI
  esavi: boolean;
  esaviDescripcion: string;
  observacion: string;
}

function nuevaFila(): FilaPAI {
  return {
    id: Math.random().toString(36).substr(2,9),
    nHC: '', nAsegurado: '', apellidoNombre: '', tipoPaciente: 'SUS',
    edadM: '', edadF: '', peso: '', talla: '',
    bcg: false, hb: false, pentavalente: false, ipv: false, opv: false,
    rotavirus: false, neumococo: false, spr: false, dpt: false,
    influenza: false, fa: false, hepatitisA: false, toxoide: false, covid: false,
    dosis1: false, dosis2: false, dosis3: false, dosisR: false,
    alertaEpidemiologica: false, tipoAlerta: '',
    esavi: false, esaviDescripcion: '',
    observacion: '',
  };
}

export function SIALPAIPanel() {
  const [fecha, setFecha] = useState({ dia: new Date().getDate().toString(), mes: (new Date().getMonth()+1).toString(), anio: new Date().getFullYear().toString() });
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFin, setHorarioFin] = useState('16:00');
  const [responsable, setResponsable] = useState('');
  const [nMatricula, setNMatricula] = useState('');
  const [filas, setFilas] = useState<FilaPAI[]>([nuevaFila(), nuevaFila(), nuevaFila()]);

  function actualizarFila(id: string, campo: keyof FilaPAI, valor: any) {
    setFilas(fs => fs.map(f => f.id === id ? { ...f, [campo]: valor } : f));
  }

  function agregarFila() { setFilas(fs => [...fs, nuevaFila()]); }
  function eliminarFila(id: string) { setFilas(fs => fs.filter(f => f.id !== id)); }

  function exportarExcel() {
    const rows = [
      ['REGISTRO DIARIO DE VACUNACION - SIAL PAI'],
      ['ESTABLECIMIENTO: HOSPITAL MUNICIPAL MODELO BOLIVIANO JAPONES'],
      [`FECHA: ${fecha.dia}/${fecha.mes}/${fecha.anio}`, `HORARIO: ${horarioInicio} a ${horarioFin}`],
      [`RESPONSABLE: ${responsable}`, `NÂ° MATRICULA: ${nMatricula}`],
      [],
      ['NÂ° HC','NÂ° ASEGURADO','APELLIDO Y NOMBRES','TIPO PAC','EDAD M','EDAD F','PESO','TALLA','BCG','HB','PENTAVALENTE','IPV','OPV','ROTAVIRUS','NEUMOCOCO','SPR','DPT','INFLUENZA','FA','HEPATITIS A','TOXOIDE','COVID-19','DOSIS 1','DOSIS 2','DOSIS 3','DOSIS R','ALERTA EPID.','TIPO ALERTA','ESAVI','DESC. ESAVI','OBSERVACION'],
      ...filas.map((f,i) => [
        i+1, f.nHC, f.nAsegurado, f.apellidoNombre, f.tipoPaciente,
        f.edadM, f.edadF, f.peso, f.talla,
        f.bcg?'v':'', f.hb?'v':'', f.pentavalente?'v':'', f.ipv?'v':'', f.opv?'v':'',
        f.rotavirus?'v':'', f.neumococo?'v':'', f.spr?'v':'', f.dpt?'v':'',
        f.influenza?'v':'', f.fa?'v':'', f.hepatitisA?'v':'', f.toxoide?'v':'', f.covid?'v':'',
        f.dosis1?'v':'', f.dosis2?'v':'', f.dosis3?'v':'', f.dosisR?'v':'',
        f.alertaEpidemiologica?'SI':'NO', f.tipoAlerta,
        f.esavi?'SI':'NO', f.esaviDescripcion, f.observacion
      ])
    ];
    const csv = rows.map(r => r.join('\t')).join('\n');
    const blob = new Blob(['\ufeff'+csv], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIAL_PAI_${fecha.dia}-${fecha.mes}-${fecha.anio}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalVacunados = filas.filter(f => f.bcg||f.hb||f.pentavalente||f.ipv||f.opv||f.rotavirus||f.neumococo||f.spr||f.dpt||f.influenza||f.fa||f.hepatitisA||f.toxoide||f.covid).length;
  const totalAlertas = filas.filter(f => f.alertaEpidemiologica).length;
  const totalESAVI = filas.filter(f => f.esavi).length;
  const totalDosis1 = filas.filter(f => f.dosis1).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">Registro Diario de Vacunacion - SIAL PAI</h2>
            <p className="text-xs font-semibold text-gray-600 uppercase">Programa Ampliado de Inmunizacion</p>
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
                className="w-12 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-green-500" />
              <select value={fecha.mes} onChange={e => setFecha(f=>({...f,mes:e.target.value}))}
                className="flex-1 border border-gray-200 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500">
                {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <input type="number" value={fecha.anio} onChange={e => setFecha(f=>({...f,anio:e.target.value}))} placeholder="AAAA"
                className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Horario</label>
            <div className="flex items-center gap-1">
              <input type="time" value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
              <span className="text-xs text-gray-400">a</span>
              <input type="time" value={horarioFin} onChange={e => setHorarioFin(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Responsable PAI</label>
            <input value={responsable} onChange={e => setResponsable(e.target.value)} placeholder="Nombre del responsable"
              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">NÂ° Matricula</label>
            <input value={nMatricula} onChange={e => setNMatricula(e.target.value)} placeholder="000000"
              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-2 mb-3 flex-shrink-0">
        {[
          { label: 'Total Vacunados', val: totalVacunados, color: '#10b981', bg: '#f0fdf4' },
          { label: 'Dosis 1ra vez', val: totalDosis1, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Alertas Epidem.', val: totalAlertas, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'ESAVI Reportados', val: totalESAVI, color: '#ef4444', bg: '#fef2f2' },
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
          <table className="text-xs border-collapse" style={{ minWidth: '2000px' }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-green-800 text-white">
                <th className="border border-green-700 px-1 py-1.5 text-center w-6" rowSpan={2}>#</th>
                <th className="border border-green-700 px-1 py-1.5 text-center w-16" rowSpan={2}>NÂ° HC</th>
                <th className="border border-green-700 px-1 py-1.5 text-center w-20" rowSpan={2}>NÂ° Asegurado</th>
                <th className="border border-green-700 px-1 py-1.5 text-center w-48" rowSpan={2}>Apellido y Nombres</th>
                <th className="border border-green-700 px-1 py-1.5 text-center w-12" rowSpan={2}>Tipo</th>
                <th className="border border-green-700 px-1 py-1.5 text-center" colSpan={2}>Edad</th>
                <th className="border border-green-700 px-1 py-1.5 text-center w-12" rowSpan={2}>Peso</th>
                <th className="border border-green-700 px-1 py-1.5 text-center w-12" rowSpan={2}>Talla</th>
                <th className="border border-green-700 px-1 py-1.5 text-center" colSpan={14}>Biologico Administrado</th>
                <th className="border border-green-700 px-1 py-1.5 text-center" colSpan={4}>Dosis</th>
                <th className="border border-green-700 px-1 py-1.5 text-center" colSpan={2}>Alerta Epidem.</th>
                <th className="border border-green-700 px-1 py-1.5 text-center" colSpan={2}>ESAVI</th>
                <th className="border border-green-700 px-1 py-1.5 text-center w-32" rowSpan={2}>Observacion</th>
                <th className="border border-green-700 px-1 py-1.5 text-center w-10" rowSpan={2}>Acc.</th>
              </tr>
              <tr className="bg-green-700 text-white">
                <th className="border border-green-600 px-1 py-1 text-center w-8">M</th>
                <th className="border border-green-600 px-1 py-1 text-center w-8">F</th>
                <th className="border border-green-600 px-1 py-1 text-center w-10">BCG</th>
                <th className="border border-green-600 px-1 py-1 text-center w-10">HB</th>
                <th className="border border-green-600 px-1 py-1 text-center w-14">Penta</th>
                <th className="border border-green-600 px-1 py-1 text-center w-10">IPV</th>
                <th className="border border-green-600 px-1 py-1 text-center w-10">OPV</th>
                <th className="border border-green-600 px-1 py-1 text-center w-14">Rota</th>
                <th className="border border-green-600 px-1 py-1 text-center w-14">Neumo</th>
                <th className="border border-green-600 px-1 py-1 text-center w-10">SPR</th>
                <th className="border border-green-600 px-1 py-1 text-center w-10">DPT</th>
                <th className="border border-green-600 px-1 py-1 text-center w-14">Influenza</th>
                <th className="border border-green-600 px-1 py-1 text-center w-10">FA</th>
                <th className="border border-green-600 px-1 py-1 text-center w-14">Hep. A</th>
                <th className="border border-green-600 px-1 py-1 text-center w-14">Toxoide</th>
                <th className="border border-green-600 px-1 py-1 text-center w-14">COVID</th>
                <th className="border border-green-600 px-1 py-1 text-center w-10">D1</th>
                <th className="border border-green-600 px-1 py-1 text-center w-10">D2</th>
                <th className="border border-green-600 px-1 py-1 text-center w-10">D3</th>
                <th className="border border-green-600 px-1 py-1 text-center w-10">DR</th>
                <th className="border border-green-600 px-1 py-1 text-center w-10">Si/No</th>
                <th className="border border-green-600 px-1 py-1 text-center w-24">Tipo</th>
                <th className="border border-green-600 px-1 py-1 text-center w-10">Si/No</th>
                <th className="border border-green-600 px-1 py-1 text-center w-28">Descripcion</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, idx) => (
                <tr key={f.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-green-50/30'}>
                  <td className="border border-gray-200 px-1 py-0.5 text-center text-gray-400 font-mono">{idx+1}</td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.nHC} onChange={e => actualizarFila(f.id,'nHC',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-green-50 rounded" placeholder="00000" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.nAsegurado} onChange={e => actualizarFila(f.id,'nAsegurado',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-green-50 rounded" placeholder="000000" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.apellidoNombre} onChange={e => actualizarFila(f.id,'apellidoNombre',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-green-50 rounded" placeholder="Apellido y Nombres" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <select value={f.tipoPaciente} onChange={e => actualizarFila(f.id,'tipoPaciente',e.target.value)} className="w-full px-0.5 py-0.5 text-xs focus:outline-none bg-transparent">
                      {TIPOS_PACIENTE.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.edadM} onChange={e => actualizarFila(f.id,'edadM',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-green-50 rounded text-center" placeholder="M" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.edadF} onChange={e => actualizarFila(f.id,'edadF',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-green-50 rounded text-center" placeholder="F" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.peso} onChange={e => actualizarFila(f.id,'peso',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-green-50 rounded text-center" placeholder="0.0" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.talla} onChange={e => actualizarFila(f.id,'talla',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-green-50 rounded text-center" placeholder="0.0" />
                  </td>
                  {(['bcg','hb','pentavalente','ipv','opv','rotavirus','neumococo','spr','dpt','influenza','fa','hepatitisA','toxoide','covid'] as const).map(campo => (
                    <td key={campo} className="border border-gray-200 px-0.5 py-0.5 text-center">
                      <input type="checkbox" checked={f[campo] as boolean} onChange={e => actualizarFila(f.id,campo,e.target.checked)} className="w-3 h-3 accent-green-600 cursor-pointer" />
                    </td>
                  ))}
                  {(['dosis1','dosis2','dosis3','dosisR'] as const).map(campo => (
                    <td key={campo} className="border border-gray-200 px-0.5 py-0.5 text-center">
                      <input type="checkbox" checked={f[campo] as boolean} onChange={e => actualizarFila(f.id,campo,e.target.checked)} className="w-3 h-3 accent-blue-600 cursor-pointer" />
                    </td>
                  ))}
                  <td className="border border-gray-200 px-0.5 py-0.5 text-center">
                    <input type="checkbox" checked={f.alertaEpidemiologica} onChange={e => actualizarFila(f.id,'alertaEpidemiologica',e.target.checked)} className="w-3 h-3 accent-yellow-500 cursor-pointer" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.tipoAlerta} onChange={e => actualizarFila(f.id,'tipoAlerta',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-yellow-50 rounded" placeholder="Tipo..." />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5 text-center">
                    <input type="checkbox" checked={f.esavi} onChange={e => actualizarFila(f.id,'esavi',e.target.checked)} className="w-3 h-3 accent-red-500 cursor-pointer" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.esaviDescripcion} onChange={e => actualizarFila(f.id,'esaviDescripcion',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-red-50 rounded" placeholder="Descripcion..." />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.observacion} onChange={e => actualizarFila(f.id,'observacion',e.target.value)} className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-green-50 rounded" placeholder="Observacion..." />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5 text-center">
                    <button onClick={() => eliminarFila(f.id)} className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-green-800 text-white">
              <tr>
                <td colSpan={9} className="border border-green-700 px-3 py-1.5 text-xs font-bold uppercase">TOTALES</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.bcg).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.hb).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.pentavalente).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.ipv).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.opv).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.rotavirus).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.neumococo).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.spr).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.dpt).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.influenza).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.fa).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.hepatitisA).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.toxoide).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.covid).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.dosis1).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.dosis2).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.dosis3).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.dosisR).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.alertaEpidemiologica).length}</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">-</td>
                <td className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.esavi).length}</td>
                <td colSpan={3} className="border border-green-700 px-1 py-1.5 text-center text-xs font-bold">{filas.length} pacientes</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 flex-shrink-0">
        <button onClick={agregarFila} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition">
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

