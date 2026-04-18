'use client';
import { useState, useRef } from 'react';
import { Plus, Trash2, Download, FileSpreadsheet, Printer, Save, X, ChevronDown } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null; }

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const TIPOS_PACIENTE = ['SUS','SEG','PRI','OTR'];
const DIAGNOSTICOS_COMUNES = [
  'E11 Diabetes Mellitus Tipo 2',
  'I10 HipertensiÃ³n Arterial SistÃ©mica',
  'J06 InfecciÃ³n Respiratoria Aguda',
  'K29 Gastritis',
  'N39 InfecciÃ³n de Tracto Urinario',
  'B02 Herpes Zoster',
  'M54 Gonalgia',
  'L27 Dermatitis Medicamentosa',
  'K42 Hernia Umbilical',
  'R51 Cefalea',
];

interface FilaRegistro {
  id: string;
  nHC: string;
  nAsegurado: string;
  apellidoNombre: string;
  tipoPaciente: string;
  edadM: string;
  edadF: string;
  peso: string;
  talla: string;
  consultaN: boolean;
  consultaR: boolean;
  // Estado nutricional
  desnutricionModerada: boolean;
  desnutricionGrave: boolean;
  sobrepeso: boolean;
  normal: boolean;
  // Mujer embarazada
  areasDelMes: boolean;
  conMes: boolean;
  repetidas: boolean;
  controlPrenatal: boolean;
  h48PostParto: boolean;
  // DetecciÃ³n
  diabetesMellitus: boolean;
  hipertensionArterial: boolean;
  itsVihSida: boolean;
  examMama: boolean;
  pap: boolean;
  tuberculosis: boolean;
  // Referencia
  referencia: boolean;
  contrarreferencia: boolean;
  cie10: string;
  diagnostico: string;
}

function nuevaFila(): FilaRegistro {
  return {
    id: Math.random().toString(36).substr(2,9),
    nHC: '', nAsegurado: '', apellidoNombre: '', tipoPaciente: 'SUS',
    edadM: '', edadF: '', peso: '', talla: '',
    consultaN: false, consultaR: false,
    desnutricionModerada: false, desnutricionGrave: false, sobrepeso: false, normal: false,
    areasDelMes: false, conMes: false, repetidas: false, controlPrenatal: false, h48PostParto: false,
    diabetesMellitus: false, hipertensionArterial: false, itsVihSida: false, examMama: false, pap: false, tuberculosis: false,
    referencia: false, contrarreferencia: false,
    cie10: '', diagnostico: '',
  };
}

export function SNISPanel() {
  const [fecha, setFecha] = useState({ dia: new Date().getDate().toString(), mes: (new Date().getMonth()+1).toString(), anio: new Date().getFullYear().toString() });
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFin, setHorarioFin] = useState('20:00');
  const [medico, setMedico] = useState('');
  const [nMatricula, setNMatricula] = useState('');
  const [titular, setTitular] = useState('');
  const [suplente, setSuplente] = useState('');
  const [filas, setFilas] = useState<FilaRegistro[]>([nuevaFila(), nuevaFila(), nuevaFila()]);
  const [guardado, setGuardado] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  function actualizarFila(id: string, campo: keyof FilaRegistro, valor: any) {
    setFilas(fs => fs.map(f => f.id === id ? { ...f, [campo]: valor } : f));
  }

  function agregarFila() {
    setFilas(fs => [...fs, nuevaFila()]);
  }

  function eliminarFila(id: string) {
    setFilas(fs => fs.filter(f => f.id !== id));
  }

  function exportarExcel() {
    const rows = [
      ['REGISTRO DIARIO DE CONSULTA EXTERNA - MEDICINA, CONTROL PRENATAL Y PUERPERIO'],
      ['ESTABLECIMIENTO: HOSPITAL MUNICIPAL MODELO BOLIVIANO JAPONES'],
      [`FECHA: ${fecha.dia}/${fecha.mes}/${fecha.anio}`, `HORARIO: ${horarioInicio} a ${horarioFin}`],
      [`MÃ‰DICO: ${medico}`, `NÂ° MATRÃCULA: ${nMatricula}`],
      [],
      ['NÂ° HC','NÂ° ASEGURADO','APELLIDO PATERNO, MATERNO Y NOMBRES','TIPO PAC','EDAD M','EDAD F','PESO (Kg.)','TALLA (cm.)','CONS. N','CONS. R','DESNUT. MOD','DESNUT. GRAVE','SOBREPESO','NORMAL','AREAS DEL MES','CON MES','REPETIDAS','CONTROL PRENATAL','48H POST PARTO','DIABETES','HIPERTENSIÃ“N','ITS-VIH-SIDA','EXAM. MAMA','PAP','TUBERCULOSIS','REFERENCIA','CONTRARREF.','CIE 10','DIAGNÃ“STICO'],
      ...filas.map((f,i) => [
        i+1, f.nHC, f.nAsegurado, f.apellidoNombre, f.tipoPaciente,
        f.edadM, f.edadF, f.peso, f.talla,
        f.consultaN?'âœ“':'', f.consultaR?'âœ“':'',
        f.desnutricionModerada?'âœ“':'', f.desnutricionGrave?'âœ“':'', f.sobrepeso?'âœ“':'', f.normal?'âœ“':'',
        f.areasDelMes?'âœ“':'', f.conMes?'âœ“':'', f.repetidas?'âœ“':'', f.controlPrenatal?'âœ“':'', f.h48PostParto?'âœ“':'',
        f.diabetesMellitus?'âœ“':'', f.hipertensionArterial?'âœ“':'', f.itsVihSida?'âœ“':'', f.examMama?'âœ“':'', f.pap?'âœ“':'', f.tuberculosis?'âœ“':'',
        f.referencia?'âœ“':'', f.contrarreferencia?'âœ“':'',
        f.cie10, f.diagnostico
      ])
    ];
    const csv = rows.map(r => r.join('\t')).join('\n');
    const blob = new Blob(['\ufeff'+csv], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SNIS_ConsultaExterna_${fecha.dia}-${fecha.mes}-${fecha.anio}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function imprimirPDF() {
    window.print();
  }

  const totalNuevas = filas.filter(f => f.consultaN).length;
  const totalRepetidas = filas.filter(f => f.consultaR).length;
  const totalDiabetes = filas.filter(f => f.diabetesMellitus).length;
  const totalHTA = filas.filter(f => f.hipertensionArterial).length;
  const totalEmbarazadas = filas.filter(f => f.controlPrenatal || f.areasDelMes).length;

  return (
    <div className="flex flex-col h-full overflow-hidden" ref={printRef}>
      {/* Header del formulario */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-3 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">Registro Diario de Consulta Externa</h2>
            <p className="text-xs font-semibold text-gray-600 uppercase">Medicina, Control Prenatal y Puerperio</p>
            <p className="text-xs text-gray-500 mt-0.5">Hospital Municipal Modelo Boliviano JaponÃ©s</p>
          </div>
          {/* Acciones */}
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={exportarExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition">
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button onClick={imprimirPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition">
              <Printer size={13} /> PDF
            </button>
          </div>
        </div>

        {/* Datos del encabezado */}
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Fecha</label>
            <div className="flex gap-1">
              <input type="number" value={fecha.dia} onChange={e => setFecha(f=>({...f,dia:e.target.value}))} placeholder="DD"
                className="w-12 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <select value={fecha.mes} onChange={e => setFecha(f=>({...f,mes:e.target.value}))}
                className="flex-1 border border-gray-200 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <input type="number" value={fecha.anio} onChange={e => setFecha(f=>({...f,anio:e.target.value}))} placeholder="AAAA"
                className="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Horario</label>
            <div className="flex items-center gap-1">
              <input type="time" value={horarioInicio} onChange={e => setHorarioInicio(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <span className="text-xs text-gray-400">a</span>
              <input type="time" value={horarioFin} onChange={e => setHorarioFin(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Nombre del MÃ©dico</label>
            <input value={medico} onChange={e => setMedico(e.target.value)} placeholder="Dr. Nombre Apellido"
              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">NÂ° MatrÃ­cula</label>
              <input value={nMatricula} onChange={e => setNMatricula(e.target.value)} placeholder="000000"
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Titular/Sup.</label>
              <div className="flex gap-1">
                <input value={titular} onChange={e => setTitular(e.target.value)} placeholder="T"
                  className="w-full border border-gray-200 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <input value={suplente} onChange={e => setSuplente(e.target.value)} placeholder="S"
                  className="w-full border border-gray-200 rounded px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs rÃ¡pidos */}
      <div className="grid grid-cols-5 gap-2 mb-3 flex-shrink-0">
        {[
          { label: 'Consultas Nuevas', val: totalNuevas, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Repetidas', val: totalRepetidas, color: '#8b5cf6', bg: '#f5f3ff' },
          { label: 'Embarazadas', val: totalEmbarazadas, color: '#ec4899', bg: '#fdf2f8' },
          { label: 'Diabetes', val: totalDiabetes, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'HipertensiÃ³n', val: totalHTA, color: '#ef4444', bg: '#fef2f2' },
        ].map((k,i) => (
          <div key={i} className="rounded-xl p-3 text-center border" style={{ backgroundColor: k.bg, borderColor: k.color+'30' }}>
            <div className="text-2xl font-bold" style={{ color: k.color }}>{k.val}</div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabla principal */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-xl bg-white min-h-0">
        <div className="overflow-x-auto overflow-y-auto h-full">
          <table className="text-xs border-collapse" style={{ minWidth: '1800px' }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-blue-800 text-white">
                <th className="border border-blue-700 px-1 py-1.5 text-center w-6" rowSpan={2}>#</th>
                <th className="border border-blue-700 px-1 py-1.5 text-center w-16" rowSpan={2}>NÂ° HC</th>
                <th className="border border-blue-700 px-1 py-1.5 text-center w-20" rowSpan={2}>NÂ° Asegurado</th>
                <th className="border border-blue-700 px-1 py-1.5 text-center w-48" rowSpan={2}>Apellido Paterno, Materno y Nombres</th>
                <th className="border border-blue-700 px-1 py-1.5 text-center w-12" rowSpan={2}>Tipo Pac.</th>
                <th className="border border-blue-700 px-1 py-1.5 text-center" colSpan={2}>Edad</th>
                <th className="border border-blue-700 px-1 py-1.5 text-center w-14" rowSpan={2}>Peso (Kg.)</th>
                <th className="border border-blue-700 px-1 py-1.5 text-center w-14" rowSpan={2}>Talla (cm.)</th>
                <th className="border border-blue-700 px-1 py-1.5 text-center" colSpan={2}>Consulta</th>
                <th className="border border-blue-700 px-1 py-1.5 text-center" colSpan={4}>Estado Nutricional (IMC)</th>
                <th className="border border-blue-700 px-1 py-1.5 text-center" colSpan={5}>Mujer Embarazada / Control Prenatal</th>
                <th className="border border-blue-700 px-1 py-1.5 text-center" colSpan={6}>DetecciÃ³n de Enfermedades</th>
                <th className="border border-blue-700 px-1 py-1.5 text-center" colSpan={2}>Referencia</th>
                <th className="border border-blue-700 px-1 py-1.5 text-center w-16" rowSpan={2}>CIE 10</th>
                <th className="border border-blue-700 px-1 py-1.5 text-center w-48" rowSpan={2}>DiagnÃ³stico</th>
                <th className="border border-blue-700 px-1 py-1.5 text-center w-10" rowSpan={2}>Acc.</th>
              </tr>
              <tr className="bg-blue-700 text-white">
                <th className="border border-blue-600 px-1 py-1 text-center w-8">M</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-8">F</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-6">N</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-6">R</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-12">Desnut. Mod.</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-12">Desnut. Grave</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-12">Sobrepeso</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-10">Normal</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-12">Ãreas del Mes</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-10">Con Mes</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-14">Repetidas</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-14">Control Prenatal</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-14">48h Post Parto</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-14">Diabetes Mellitus</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-14">Hipert. Arterial</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-14">ITS-VIH-SIDA</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-14">Exam. Mama</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-10">PAP</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-14">Tuberculosis</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-14">Referencia</th>
                <th className="border border-blue-600 px-1 py-1 text-center w-14">Contrarref.</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, idx) => (
                <tr key={f.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                  <td className="border border-gray-200 px-1 py-0.5 text-center text-gray-400 font-mono">{idx+1}</td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.nHC} onChange={e => actualizarFila(f.id,'nHC',e.target.value)}
                      className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-blue-50 rounded" placeholder="00000" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.nAsegurado} onChange={e => actualizarFila(f.id,'nAsegurado',e.target.value)}
                      className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-blue-50 rounded" placeholder="000000" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.apellidoNombre} onChange={e => actualizarFila(f.id,'apellidoNombre',e.target.value)}
                      className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-blue-50 rounded" placeholder="Apellido Paterno, Materno y Nombres" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <select value={f.tipoPaciente} onChange={e => actualizarFila(f.id,'tipoPaciente',e.target.value)}
                      className="w-full px-0.5 py-0.5 text-xs focus:outline-none bg-transparent">
                      {TIPOS_PACIENTE.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.edadM} onChange={e => actualizarFila(f.id,'edadM',e.target.value)}
                      className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-blue-50 rounded text-center" placeholder="M" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.edadF} onChange={e => actualizarFila(f.id,'edadF',e.target.value)}
                      className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-blue-50 rounded text-center" placeholder="F" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.peso} onChange={e => actualizarFila(f.id,'peso',e.target.value)}
                      className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-blue-50 rounded text-center" placeholder="00.0" />
                  </td>
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.talla} onChange={e => actualizarFila(f.id,'talla',e.target.value)}
                      className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-blue-50 rounded text-center" placeholder="0.00" />
                  </td>
                  {/* Consulta N/R */}
                  {(['consultaN','consultaR'] as const).map(campo => (
                    <td key={campo} className="border border-gray-200 px-0.5 py-0.5 text-center">
                      <input type="checkbox" checked={f[campo] as boolean} onChange={e => actualizarFila(f.id,campo,e.target.checked)}
                        className="w-3 h-3 accent-blue-600 cursor-pointer" />
                    </td>
                  ))}
                  {/* Estado Nutricional */}
                  {(['desnutricionModerada','desnutricionGrave','sobrepeso','normal'] as const).map(campo => (
                    <td key={campo} className="border border-gray-200 px-0.5 py-0.5 text-center">
                      <input type="checkbox" checked={f[campo] as boolean} onChange={e => actualizarFila(f.id,campo,e.target.checked)}
                        className="w-3 h-3 accent-orange-500 cursor-pointer" />
                    </td>
                  ))}
                  {/* Mujer Embarazada */}
                  {(['areasDelMes','conMes','repetidas','controlPrenatal','h48PostParto'] as const).map(campo => (
                    <td key={campo} className="border border-gray-200 px-0.5 py-0.5 text-center">
                      <input type="checkbox" checked={f[campo] as boolean} onChange={e => actualizarFila(f.id,campo,e.target.checked)}
                        className="w-3 h-3 accent-pink-500 cursor-pointer" />
                    </td>
                  ))}
                  {/* DetecciÃ³n Enfermedades */}
                  {(['diabetesMellitus','hipertensionArterial','itsVihSida','examMama','pap','tuberculosis'] as const).map(campo => (
                    <td key={campo} className="border border-gray-200 px-0.5 py-0.5 text-center">
                      <input type="checkbox" checked={f[campo] as boolean} onChange={e => actualizarFila(f.id,campo,e.target.checked)}
                        className="w-3 h-3 accent-red-500 cursor-pointer" />
                    </td>
                  ))}
                  {/* Referencia */}
                  {(['referencia','contrarreferencia'] as const).map(campo => (
                    <td key={campo} className="border border-gray-200 px-0.5 py-0.5 text-center">
                      <input type="checkbox" checked={f[campo] as boolean} onChange={e => actualizarFila(f.id,campo,e.target.checked)}
                        className="w-3 h-3 accent-purple-500 cursor-pointer" />
                    </td>
                  ))}
                  {/* CIE 10 */}
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.cie10} onChange={e => actualizarFila(f.id,'cie10',e.target.value)}
                      className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-blue-50 rounded text-center font-mono" placeholder="E11" />
                  </td>
                  {/* DiagnÃ³stico */}
                  <td className="border border-gray-200 px-0.5 py-0.5">
                    <input value={f.diagnostico} onChange={e => actualizarFila(f.id,'diagnostico',e.target.value)}
                      list={`diag-${f.id}`}
                      className="w-full px-1 py-0.5 text-xs focus:outline-none focus:bg-blue-50 rounded" placeholder="DiagnÃ³stico" />
                    <datalist id={`diag-${f.id}`}>
                      {DIAGNOSTICOS_COMUNES.map(d => <option key={d} value={d} />)}
                    </datalist>
                  </td>
                  {/* AcciÃ³n */}
                  <td className="border border-gray-200 px-0.5 py-0.5 text-center">
                    <button onClick={() => eliminarFila(f.id)} className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Totales */}
            <tfoot className="sticky bottom-0 bg-blue-800 text-white">
              <tr>
                <td colSpan={9} className="border border-blue-700 px-3 py-1.5 text-xs font-bold uppercase tracking-wide">TOTALES</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.consultaN).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.consultaR).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.desnutricionModerada).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.desnutricionGrave).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.sobrepeso).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.normal).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.areasDelMes).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.conMes).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.repetidas).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.controlPrenatal).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.h48PostParto).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.diabetesMellitus).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.hipertensionArterial).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.itsVihSida).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.examMama).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.pap).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.tuberculosis).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.referencia).length}</td>
                <td className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.filter(f=>f.contrarreferencia).length}</td>
                <td colSpan={3} className="border border-blue-700 px-1 py-1.5 text-center text-xs font-bold">{filas.length} pacientes</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* BotÃ³n agregar fila */}
      <div className="flex justify-between items-center mt-3 flex-shrink-0">
        <button onClick={agregarFila}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition">
          <Plus size={14} /> Agregar Paciente
        </button>
        <div className="flex gap-2">
          <button onClick={exportarExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition">
            <FileSpreadsheet size={13} /> Exportar Excel
          </button>
          <button onClick={imprimirPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition">
            <Printer size={13} /> Imprimir / PDF
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .snis-print, .snis-print * { visibility: visible; }
          .snis-print { position: absolute; left: 0; top: 0; width: 100%; }
          @page { size: A3 landscape; margin: 10mm; }
        }
      `}</style>
    </div>
  );
}

