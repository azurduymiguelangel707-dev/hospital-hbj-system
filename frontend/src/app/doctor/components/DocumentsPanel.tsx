// src/app/dashboard/doctor/components/DocumentsPanel.tsx
'use client';

import { useState, useRef } from 'react';
import type { ClinicalDocument, DocType } from '@/lib/types/doctor.types';
import { uploadDocument, deleteDocument } from '@/lib/api/doctor';
import { Upload, FileText, X, Eye } from 'lucide-react';

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: 'RADIOGRAFIA',  label: 'Radiografia' },
  { value: 'ECOGRAFIA',    label: 'Ecografia' },
  { value: 'TOMOGRAFIA',   label: 'Tomografia' },
  { value: 'RESONANCIA',   label: 'Resonancia magnetica' },
  { value: 'ECG',          label: 'Electrocardiograma' },
  { value: 'LABORATORIO',  label: 'Resultado de laboratorio' },
  { value: 'RECETA',       label: 'Receta medica' },
  { value: 'ORDEN',        label: 'Orden medica' },
  { value: 'FOTO_CLINICA', label: 'Foto clinica' },
  { value: 'OTRO',         label: 'Otro' },
];

const DOC_CFG: Record<string, { bg: string; text: string; short: string }> = {
  RADIOGRAFIA:  { bg: 'bg-blue-100',   text: 'text-blue-800',   short: 'RX'  },
  ECOGRAFIA:    { bg: 'bg-amber-100',  text: 'text-amber-800',  short: 'ECO' },
  TOMOGRAFIA:   { bg: 'bg-amber-100',  text: 'text-amber-800',  short: 'TAC' },
  RESONANCIA:   { bg: 'bg-amber-100',  text: 'text-amber-800',  short: 'RMN' },
  ECG:          { bg: 'bg-blue-100',   text: 'text-blue-800',   short: 'ECG' },
  LABORATORIO:  { bg: 'bg-green-100',  text: 'text-green-800',  short: 'LAB' },
  RECETA:       { bg: 'bg-pink-100',   text: 'text-pink-800',   short: 'REC' },
  ORDEN:        { bg: 'bg-gray-100',   text: 'text-gray-700',   short: 'ORD' },
  FOTO_CLINICA: { bg: 'bg-purple-100', text: 'text-purple-800', short: 'FOT' },
  OTRO:         { bg: 'bg-gray-100',   text: 'text-gray-700',   short: 'DOC' },
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
  const map = new Map<string, { label: string; docs: ClinicalDocument[] }>();
  for (const d of docs) {
    if (!map.has(d.appointmentId)) {
      const fecha = d.fechaConsulta
        ? new Date(d.fechaConsulta).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Sin fecha';
      map.set(d.appointmentId, {
        label: `${fecha}${d.diagnosticoConsulta ? ' - ' + d.diagnosticoConsulta : ''}`,
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
  const [form, setForm] = useState({
    tipo: 'RADIOGRAFIA' as DocType,
    appointmentId: currentAppointmentId ?? appointments[0]?.id ?? '',
    descripcion: '',
    file: null as File | null,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = documents.filter((d) => filter === 'all' ? true : FILTER_MAP[filter].includes(d.tipo));
  const grouped = groupByConsulta(filtered);

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

  const filters: { key: FilterCat; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'imagen', label: 'Imagenes' },
    { key: 'lab', label: 'Laboratorio' },
    { key: 'receta', label: 'Recetas' },
    { key: 'orden', label: 'Ordenes' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Documentos clinicos</h3>
          <p className="text-xs text-gray-500">{patientName} - {historialNumero} - {documents.length} documento(s)</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <Upload size={14} /> Subir documento
        </button>
      </div>

      {showUpload && (
        <div className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as DocType }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Vincular a consulta</label>
              <select
                value={form.appointmentId}
                onChange={(e) => setForm((f) => ({ ...f, appointmentId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>{a.fecha} - {a.diagnostico || 'Sin diagnostico'}</option>
                ))}
              </select>
            </div>
          </div>
          <input
            type="text" value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            placeholder="Descripcion del documento..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
          />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'} ${form.file ? 'bg-green-50 border-green-400' : ''}`}
          >
            {form.file ? (
              <div>
                <p className="text-sm font-medium text-green-700">{form.file.name}</p>
                <p className="text-xs text-green-600">{formatBytes(form.file.size)}</p>
              </div>
            ) : (
              <div>
                <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">Arrastra el archivo aqui o haz clic</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, PDF, DICOM - Max. 20 MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf,.dcm" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          {uploadError && <p className="text-xs text-red-600 mt-2">{uploadError}</p>}
          <div className="flex gap-2 mt-3">
            <button onClick={handleUpload} disabled={!form.file || uploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
              {uploading ? 'Subiendo...' : 'Subir y vincular al historial'}
            </button>
            <button onClick={() => setShowUpload(false)}
              className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <FileText size={32} className="mx-auto mb-2" />
          <p className="text-sm">No hay documentos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group, gi) => (
            <div key={gi}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 border-b border-gray-100 mb-2">
                {group.label}
              </div>
              <div className="space-y-2">
                {group.docs.map((doc) => {
                  const cfg = DOC_CFG[doc.tipo] ?? DOC_CFG['OTRO'];
                  return (
                    <div key={doc.id} className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2.5 hover:bg-gray-50 transition">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                        {cfg.short}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{doc.descripcion || doc.fileName}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(doc.creadoEn).toLocaleDateString('es-ES')} - {formatBytes(doc.fileSize)}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <a href={`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}\${doc.fileUrl}`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition" title="Ver">
                          <Eye size={14} />
                        </a>
                        <button onClick={() => { if(confirm('Eliminar?')) { deleteDocument(doc.id); onDocDeleted(doc.id); } }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition" title="Eliminar">
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
  );
}
