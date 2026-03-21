// src/app/dashboard/doctor/components/DocumentsPanel.tsx
'use client';

import { useState, useRef } from 'react';
import type { ClinicalDocument, DocType } from '@/lib/types/doctor.types';
import { uploadDocument, deleteDocument } from '@/lib/api/doctor';
import { Upload, FileText, X, Eye, Image, FlaskConical, FileCheck, ClipboardList, FolderOpen } from 'lucide-react';

const DOC_TYPES: { value: DocType; label: string; icono: string }[] = [
  { value: 'RADIOGRAFIA',  label: 'Radiografia',             icono: '🩻' },
  { value: 'ECOGRAFIA',    label: 'Ecografia',               icono: '🔊' },
  { value: 'TOMOGRAFIA',   label: 'Tomografia (TAC)',         icono: '🧠' },
  { value: 'RESONANCIA',   label: 'Resonancia magnetica',    icono: '🧲' },
  { value: 'ECG',          label: 'Electrocardiograma',      icono: '💓' },
  { value: 'LABORATORIO',  label: 'Resultado laboratorio',   icono: '🧪' },
  { value: 'RECETA',       label: 'Receta medica',           icono: '💊' },
  { value: 'ORDEN',        label: 'Orden medica',            icono: '📋' },
  { value: 'FOTO_CLINICA', label: 'Foto clinica',            icono: '📷' },
  { value: 'OTRO',         label: 'Otro documento',          icono: '📄' },
];

const DOC_CFG: Record<string, { color: string; bg: string; border: string; icono: string; categoria: string }> = {
  RADIOGRAFIA:  { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icono: '🩻', categoria: 'Imagen' },
  ECOGRAFIA:    { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icono: '🔊', categoria: 'Imagen' },
  TOMOGRAFIA:   { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icono: '🧠', categoria: 'Imagen' },
  RESONANCIA:   { color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', icono: '🧲', categoria: 'Imagen' },
  ECG:          { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icono: '💓', categoria: 'Imagen' },
  LABORATORIO:  { color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', icono: '🧪', categoria: 'Laboratorio' },
  RECETA:       { color: '#ec4899', bg: '#fdf2f8', border: '#fbcfe8', icono: '💊', categoria: 'Receta' },
  ORDEN:        { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icono: '📋', categoria: 'Orden' },
  FOTO_CLINICA: { color: '#a855f7', bg: '#faf5ff', border: '#e9d5ff', icono: '📷', categoria: 'Imagen' },
  OTRO:         { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icono: '📄', categoria: 'Otro' },
};

type FilterCat = 'all' | 'imagen' | 'lab' | 'receta' | 'orden';
const FILTER_MAP: Record<FilterCat, DocType[]> = {
  all:    [],
  imagen: ['RADIOGRAFIA','ECOGRAFIA','TOMOGRAFIA','RESONANCIA','ECG','FOTO_CLINICA'],
  lab:    ['LABORATORIO'],
  receta: ['RECETA'],
  orden:  ['ORDEN'],
};

function formatBytes(b: number) {
  if (!b) return '';
  return b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`;
}

function groupByConsulta(docs: ClinicalDocument[]) {
  const map = new Map<string, { label: string; fecha: string; diagnostico: string; docs: ClinicalDocument[] }>();
  for (const d of docs) {
    if (!map.has(d.appointmentId)) {
      const fecha = d.fechaConsulta
        ? new Date(d.fechaConsulta).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Sin fecha';
      map.set(d.appointmentId, {
        label: fecha + (d.diagnosticoConsulta ? ' — ' + d.diagnosticoConsulta : ''),
        fecha,
        diagnostico: d.diagnosticoConsulta ?? '',
        docs: [],
      });
    }
    map.get(d.appointmentId)!.docs.push(d);
  }
  return Array.from(map.values());
}

interface Props {
  patientId: string;
  patientName: string;
  historialNumero: string;
  appointments: { id: string; fecha: string; diagnostico: string }[];
  documents: ClinicalDocument[];
  currentAppointmentId?: string;
  onDocUploaded: (doc: ClinicalDocument) => void;
  onDocDeleted: (docId: string) => void;
}

export function DocumentsPanel({
  patientId, patientName, historialNumero,
  appointments, documents, currentAppointmentId,
  onDocUploaded, onDocDeleted,
}: Props) {
  const [showUpload, setShowUpload] = useState(false);
  const [filter, setFilter] = useState<FilterCat>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<ClinicalDocument | null>(null);
  const [form, setForm] = useState({
    tipo: 'RADIOGRAFIA' as DocType,
    appointmentId: currentAppointmentId ?? appointments[0]?.id ?? '',
    descripcion: '',
    file: null as File | null,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = documents.filter((d) => filter === 'all' ? true : FILTER_MAP[filter].includes(d.tipo));
  const grouped = groupByConsulta(filtered);

  const counts = {
    all:    documents.length,
    imagen: documents.filter(d => FILTER_MAP.imagen.includes(d.tipo)).length,
    lab:    documents.filter(d => d.tipo === 'LABORATORIO').length,
    receta: documents.filter(d => d.tipo === 'RECETA').length,
    orden:  documents.filter(d => d.tipo === 'ORDEN').length,
  };

  function handleFile(file: File) {
    if (file.size > 20 * 1024 * 1024) { setUploadError('Archivo supera 20 MB.'); return; }
    setUploadError('');
    setForm((f) => ({ ...f, file }));
  }

  async function handleUpload() {
    if (!form.file || !form.appointmentId) return;
    setUploading(true);
    try {
      const doc = await uploadDocument(patientId, form.appointmentId, form.tipo, form.descripcion, form.file);
      onDocUploaded(doc);
      setShowUpload(false);
      setForm((f) => ({ ...f, file: null, descripcion: '' }));
    } catch (e: any) {
      setUploadError(e.message ?? 'Error al subir');
    } finally {
      setUploading(false);
    }
  }

  const isImage = (doc: ClinicalDocument) =>
    doc.mimeType?.startsWith('image/') || doc.fileUrl?.match(/\.(jpg|jpeg|png|webp)$/i);

  const filters: { key: FilterCat; label: string; icono: string }[] = [
    { key: 'all',    label: 'Todos',       icono: '📁' },
    { key: 'imagen', label: 'Imagenes',    icono: '🩻' },
    { key: 'lab',    label: 'Laboratorio', icono: '🧪' },
    { key: 'receta', label: 'Recetas',     icono: '💊' },
    { key: 'orden',  label: 'Ordenes',     icono: '📋' },
  ];

  return (
    <div className="flex gap-5">
      {/* Columna principal */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Documentos clinicos</h3>
              <p className="text-xs text-gray-400 mt-0.5">{patientName} · {historialNumero} · {documents.length} documento(s)</p>
            </div>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className={"flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition " + (showUpload ? "bg-gray-100 text-gray-600" : "bg-blue-600 text-white hover:bg-blue-700")}
            >
              <Upload size={13} /> {showUpload ? "Cancelar" : "Subir documento"}
            </button>
          </div>

          {/* Stats rapidos */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { label: "Imagenes",    val: counts.imagen, color: "#3b82f6", bg: "#eff6ff", icono: "🩻" },
              { label: "Laboratorio", val: counts.lab,    color: "#10b981", bg: "#f0fdf4", icono: "🧪" },
              { label: "Recetas",     val: counts.receta, color: "#ec4899", bg: "#fdf2f8", icono: "💊" },
              { label: "Ordenes",     val: counts.orden,  color: "#6b7280", bg: "#f9fafb", icono: "📋" },
            ].map((s, i) => (
              <div key={i} className="rounded-lg p-2 text-center" style={{ backgroundColor: s.bg }}>
                <div className="text-base">{s.icono}</div>
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs" style={{ color: s.color }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario subida */}
        {showUpload && (
          <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Subir nuevo documento</p>

            {/* Selector tipo con iconos */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1.5">Tipo de documento</label>
              <div className="grid grid-cols-5 gap-1.5">
                {DOC_TYPES.map(t => (
                  <button key={t.value} onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
                    className={"flex flex-col items-center gap-1 px-2 py-2 rounded-lg border text-xs transition " +
                      (form.tipo === t.value ? "border-blue-400 bg-blue-50 text-blue-700 font-semibold" : "border-gray-200 text-gray-500 hover:border-gray-300")}
                  >
                    <span className="text-lg">{t.icono}</span>
                    <span className="text-center leading-tight">{t.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Vincular a consulta</label>
                <select value={form.appointmentId} onChange={e => setForm(f => ({ ...f, appointmentId: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {appointments.map(a => (
                    <option key={a.id} value={a.id}>{a.fecha} — {a.diagnostico || 'Sin diagnostico'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Descripcion</label>
                <input type="text" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ej: Rx torax AP - control"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={"border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition " +
                (dragOver ? "border-blue-400 bg-blue-50" : form.file ? "border-emerald-300 bg-emerald-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30")}
            >
              {form.file ? (
                <div>
                  <div className="text-2xl mb-1">✅</div>
                  <p className="text-sm font-semibold text-emerald-700">{form.file.name}</p>
                  <p className="text-xs text-emerald-500">{formatBytes(form.file.size)} · Listo para subir</p>
                </div>
              ) : (
                <div>
                  <Upload size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">Arrastra el archivo aqui o haz clic</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF, DICOM — Max. 20 MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf,.dcm" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

            {uploadError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{uploadError}</p>}

            <div className="flex gap-2">
              <button onClick={handleUpload} disabled={!form.file || uploading}
                className="flex-1 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                {uploading ? "Subiendo..." : "Subir y vincular al historial"}
              </button>
              <button onClick={() => setShowUpload(false)}
                className="px-4 py-2.5 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={"flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition border " +
                (filter === f.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300")}
            >
              <span>{f.icono}</span> {f.label}
              <span className={"px-1.5 py-0.5 rounded-full text-xs " + (filter === f.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500")}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Documentos agrupados */}
        {grouped.length === 0 ? (
          <div className="text-center py-16 text-gray-300 border-2 border-dashed border-gray-100 rounded-xl">
            <div className="text-4xl mb-2">📂</div>
            <p className="text-sm font-medium text-gray-400">No hay documentos en esta categoria</p>
            <p className="text-xs text-gray-300 mt-1">Sube el primer documento con el boton de arriba</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((group, gi) => (
              <div key={gi} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-gray-700">{group.fecha}</span>
                    {group.diagnostico && <span className="text-xs text-gray-400 ml-2">— {group.diagnostico}</span>}
                  </div>
                  <span className="text-xs text-gray-400">{group.docs.length} doc(s)</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {group.docs.map(doc => {
                    const cfg = DOC_CFG[doc.tipo] ?? DOC_CFG['OTRO'];
                    const esImagen = isImage(doc);
                    return (
                      <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                        {/* Icono tipo */}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: cfg.bg, border: '1px solid ' + cfg.border }}>
                          {cfg.icono}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-gray-800 truncate">{doc.descripcion || doc.fileName}</span>
                            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0" style={{ color: cfg.color, backgroundColor: cfg.bg, border: '1px solid ' + cfg.border }}>
                              {cfg.categoria}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{new Date(doc.creadoEn).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            {doc.fileSize > 0 && <><span>·</span><span>{formatBytes(doc.fileSize)}</span></>}
                          </div>
                        </div>
                        {/* Acciones */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {esImagen && (
                            <button onClick={() => setPreview(doc)}
                              className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition" title="Vista previa">
                              <Eye size={14} />
                            </button>
                          )}
                          <a href={doc.fileUrl?.startsWith('http') ? doc.fileUrl : (process.env.NEXT_PUBLIC_API_URL ?? '') + doc.fileUrl}
                            target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition" title="Abrir">
                            <FileText size={14} />
                          </a>
                          <button onClick={() => { if (confirm('Eliminar este documento?')) { deleteDocument(doc.id); onDocDeleted(doc.id); }}}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition" title="Eliminar">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panel lateral - vista previa */}
      <div className="w-64 flex-shrink-0 space-y-4">
        {preview ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">Vista previa</span>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
            <div className="p-3">
              {isImage(preview) ? (
                <img
                  src={preview.fileUrl?.startsWith('http') ? preview.fileUrl : (process.env.NEXT_PUBLIC_API_URL ?? '') + preview.fileUrl}
                  alt={preview.descripcion || preview.fileName}
                  className="w-full rounded-lg object-cover"
                />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileText size={32} className="mx-auto mb-2" />
                  <p className="text-xs">Vista previa no disponible</p>
                </div>
              )}
              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold text-gray-700">{preview.descripcion || preview.fileName}</p>
                <p className="text-xs text-gray-400">{new Date(preview.creadoEn).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <p className="text-xs text-gray-400">{formatBytes(preview.fileSize)}</p>
              </div>
              <a href={preview.fileUrl?.startsWith('http') ? preview.fileUrl : (process.env.NEXT_PUBLIC_API_URL ?? '') + preview.fileUrl}
                target="_blank" rel="noopener noreferrer"
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition">
                <Eye size={12} /> Abrir en pantalla completa
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Vista previa</p>
            <div className="text-center py-8 text-gray-300">
              <div className="text-3xl mb-2">👁️</div>
              <p className="text-xs">Haz clic en el icono de ojo de una imagen para previsualizarla aqui</p>
            </div>
          </div>
        )}

        {/* Resumen tipos */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Resumen por tipo</p>
          <div className="space-y-1.5">
            {DOC_TYPES.map(t => {
              const count = documents.filter(d => d.tipo === t.value).length;
              if (count === 0) return null;
              const cfg = DOC_CFG[t.value];
              return (
                <div key={t.value} className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ backgroundColor: cfg.bg }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cfg.icono}</span>
                    <span className="text-xs text-gray-600">{t.label}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: cfg.color }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
