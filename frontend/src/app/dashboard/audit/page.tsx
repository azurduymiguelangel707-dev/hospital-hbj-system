'use client';

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, TrendingUp, Search, Download, RefreshCw, Link as LinkIcon, Clock, User, FileText } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AuditBlock {
  id: string;
  blockIndex: number;
  timestamp: string;
  eventType: 'CREATE' | 'ACCESS' | 'UPDATE' | 'DELETE';
  resourceType: string;
  resourceId: string;
  userId: string;
  currentHash: string;
  previousHash: string;
  nonce: number;
  isValid: boolean;
  actionDetails?: any;
}

interface Statistics {
  totalBlocks: number;
  byEventType: Array<{ eventType: string; count: string }>;
  byResourceType: Array<{ resourceType: string; count: string }>;
}

interface VerificationResult {
  message: string;
  isValid: boolean;
  invalidBlocks: number[];
}

export default function AuditDashboard() {
  const [blocks, setBlocks] = useState<AuditBlock[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<AuditBlock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [newBlockNotification, setNewBlockNotification] = useState(false);
  const [previousBlockCount, setPreviousBlockCount] = useState(0);
  const [trailResourceType, setTrailResourceType] = useState('MEDICAL_RECORD');
  const [trailResourceId, setTrailResourceId] = useState('');
  const [trailResults, setTrailResults] = useState<AuditBlock[]>([]);
  const [showTrailResults, setShowTrailResults] = useState(false);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const blocksRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/audit');
      const blocksData = await blocksRes.json();
      setBlocks(blocksData.data || []);

      // Detectar nuevos bloques
      if (blocksData.data && blocksData.data.length > previousBlockCount && previousBlockCount > 0) {
        setNewBlockNotification(true);
        setTimeout(() => setNewBlockNotification(false), 5000);
      }
      setPreviousBlockCount(blocksData.data?.length || 0);

      const statsRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/audit/statistics');
      const statsData = await statsRes.json();
      setStatistics(statsData);

      const verifyRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/audit/verify');
      const verifyData = await verifyRes.json();
      setVerification(verifyData);

      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching audit data:', error);
      setLoading(false);
    }
  };

  const formatHash = (hash: string) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEventColor = (eventType: string) => {
    const colors: { [key: string]: string } = {
      'CREATE': 'bg-green-100 text-green-800',
      'ACCESS': 'bg-blue-100 text-blue-800',
      'UPDATE': 'bg-yellow-100 text-yellow-800',
      'DELETE': 'bg-red-100 text-red-800'
    };
    return colors[eventType] || 'bg-gray-100 text-gray-800';
  };

  const getEventIcon = (eventType: string) => {
    const icons: { [key: string]: string } = {
      'CREATE': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢',
      'ACCESS': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â',
      'UPDATE': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â',
      'DELETE': 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â'
    };
    return icons[eventType] || 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â';
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify({
      exportDate: new Date().toISOString(),
      statistics,
      verification,
      blocks: blocks.map(b => ({
        blockIndex: b.blockIndex,
        timestamp: b.timestamp,
        eventType: b.eventType,
        resourceType: b.resourceType,
        currentHash: b.currentHash,
        previousHash: b.previousHash,
        nonce: b.nonce,
        isValid: b.isValid
      }))
    }, null, 2);
    
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `auditoria-blockchain-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportToCSV = () => {
    const headers = ['Bloque', 'Marca de Tiempo', 'Evento', 'Recurso', 'Usuario', 'Hash', 'Hash Anterior', 'Nonce', 'VÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡lido'];
    const rows = blocks.map(b => [
      b.blockIndex,
      formatTimestamp(b.timestamp),
      b.eventType,
      b.resourceType,
      b.userId,
      b.currentHash,
      b.previousHash,
      b.nonce,
      b.isValid ? 'SÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â' : 'NO'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `auditoria-blockchain-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const searchAuditTrail = async () => {
    if (!trailResourceId.trim()) {
      alert('Por favor ingresa un ID de recurso');
      return;
    }
    
    try {
      const response = await fetch(`process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'/api/audit/trail/${trailResourceType}/${trailResourceId}`);
      const data = await response.json();
      setTrailResults(data);
      setShowTrailResults(true);
    } catch (error) {
      console.error('Error searching audit trail:', error);
      alert('Error al buscar rastro de auditorÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a');
    }
  };

  const filteredBlocks = blocks.filter(block => {
    const matchesSearch = 
      block.resourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.currentHash.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'ALL' || block.eventType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-xl text-gray-600">Cargando datos de la cadena de bloques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-blue-600" size={36} />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Seguridad y AuditorÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a Blockchain</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Clock size={16} />
              ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ltima actualizaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n: {lastUpdate.toLocaleTimeString('es-BO')}
            </div>
          </div>
        </div>
        <p className="text-gray-600">Sistema de auditorÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a inmutable con Prueba de Trabajo</p>
      </div>

      {/* New Block Notification */}
      {newBlockNotification && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
            <div>
              <p className="font-bold text-green-800">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â° ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Nuevo bloque generado!</p>
              <p className="text-sm text-green-600">Un nuevo evento ha sido registrado en la cadena de bloques</p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Status */}
      <div className={`mb-6 p-6 rounded-lg shadow-lg ${verification?.isValid ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {verification?.isValid ? (
              <CheckCircle className="text-green-600" size={32} />
            ) : (
              <AlertTriangle className="text-red-600" size={32} />
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-800">{verification?.message}</h2>
              {!verification?.isValid && verification?.invalidBlocks && verification.invalidBlocks.length > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  Bloques comprometidos: {verification.invalidBlocks.join(', ')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition"
          >
            <RefreshCw size={20} />
            Verificar Ahora
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">Total Bloques</h3>
            <LinkIcon className="text-blue-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-gray-800">{statistics?.totalBlocks || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Cadena completa</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">Creaciones</h3>
            <span className="text-2xl">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢</span>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {statistics?.byEventType.find(e => e.eventType === 'CREATE')?.count || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Nuevos registros</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">Accesos</h3>
            <span className="text-2xl">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {statistics?.byEventType.find(e => e.eventType === 'ACCESS')?.count || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Lecturas auditadas</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-medium">Integridad</h3>
            <CheckCircle className="text-green-600" size={24} />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {verification?.isValid ? '100%' : '0%'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Cadena vÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡lida</p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-6 mb-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm opacity-80 mb-1">Nonce Promedio</h3>
            <p className="text-3xl font-bold">
              {blocks.length > 0 
                ? Math.round(blocks.reduce((sum, b) => sum + b.nonce, 0) / blocks.length)
                : 0
              }
            </p>
            <p className="text-xs opacity-80 mt-1">Iteraciones de minado</p>
          </div>
          <div>
            <h3 className="text-sm opacity-80 mb-1">Dificultad de Prueba de Trabajo</h3>
            <p className="text-3xl font-bold">2</p>
            <p className="text-xs opacity-80 mt-1">Hash debe empezar con "00"</p>
          </div>
          <div>
            <h3 className="text-sm opacity-80 mb-1">ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ltimo Bloque</h3>
            <p className="text-3xl font-bold">
              {blocks.length > 0 
                ? `#${blocks[0].blockIndex}`
                : 'N/A'
              }
            </p>
            <p className="text-xs opacity-80 mt-1">
              {blocks.length > 0 
                ? new Date(blocks[0].timestamp).toLocaleTimeString('es-BO')
                : 'Sin bloques'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">DistribuciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n por Tipo de Evento</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statistics?.byEventType.map(e => ({
                  name: e.eventType,
                  value: parseInt(e.count)
                })) || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statistics?.byEventType.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][index % 4]} 
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Actividad por Hora</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={(() => {
                const hourCounts: { [key: string]: number } = {};
                blocks.forEach(block => {
                  const hour = new Date(block.timestamp).getHours();
                  const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
                  hourCounts[hourLabel] = (hourCounts[hourLabel] || 0) + 1;
                });
                return Object.entries(hourCounts)
                  .map(([hour, count]) => ({ hour, count }))
                  .sort((a, b) => a.hour.localeCompare(b.hour))
                  .slice(-12);
              })()}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Bloques" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Blockchain Growth Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Crecimiento de la Cadena de Bloques</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={(() => {
              const dailyCounts: { [key: string]: number } = {};
              blocks.forEach(block => {
                const date = new Date(block.timestamp).toLocaleDateString('es-BO');
                dailyCounts[date] = (dailyCounts[date] || 0) + 1;
              });
              return Object.entries(dailyCounts)
                .map(([date, count]) => ({ 
                  date, 
                  bloques: count,
                  acumulado: 0
                }))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((item, index, array) => ({
                  ...item,
                  acumulado: array.slice(0, index + 1).reduce((sum, curr) => sum + curr.bloques, 0)
                }));
            })()}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="bloques" stroke="#3b82f6" name="Bloques por dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a" />
            <Line type="monotone" dataKey="acumulado" stroke="#10b981" name="Total acumulado" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Audit Trail Search */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Buscar Rastro de AuditorÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a de Recurso</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select 
            value={trailResourceType}
            onChange={(e) => setTrailResourceType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="MEDICAL_RECORD">HISTORIAL_MEDICO</option>
            <option value="PATIENT">PACIENTE</option>
            <option value="APPOINTMENT">CITA</option>
          </select>
          <input
            type="text"
            placeholder="ID del recurso"
            value={trailResourceId}
            onChange={(e) => setTrailResourceId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <button 
            onClick={searchAuditTrail}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Buscar Rastro
          </button>
        </div>
        <div className="text-sm text-gray-600">
          ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ Ingresa el ID de un historial mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dico, paciente o cita para ver todos los eventos relacionados
        </div>
        
        {/* Trail Results */}
        {showTrailResults && (
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">
                Resultados: {trailResults.length} eventos encontrados
              </h3>
              <button
                onClick={() => setShowTrailResults(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ Cerrar
              </button>
            </div>
            {trailResults.length > 0 ? (
              <div className="space-y-3">
                {trailResults.map((block) => (
                  <div key={block.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded text-sm font-semibold ${getEventColor(block.eventType)}`}>
                        {getEventIcon(block.eventType)} {block.eventType}
                      </span>
                      <span className="text-sm text-gray-500">Bloque #{block.blockIndex}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Usuario:</span>
                        <span className="ml-2 font-medium">{block.userId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Marca de Tiempo:</span>
                        <span className="ml-2 font-mono">{formatTimestamp(block.timestamp)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Hash:</span>
                        <span className="ml-2 font-mono text-xs">
                          <span className="text-green-600 font-bold">{block.currentHash.substring(0, 2)}</span>
                          {block.currentHash.substring(2, 20)}...
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No se encontraron eventos para este recurso
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por hash, recurso o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos los eventos</option>
              <option value="CREATE">Creaciones</option>
              <option value="ACCESS">Accesos</option>
              <option value="UPDATE">Actualizaciones</option>
              <option value="DELETE">Eliminaciones</option>
            </select>
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Download size={20} />
                Exportar
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-10">
                <button
                  onClick={exportToJSON}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-lg"
                >
                  ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ Exportar JSON
                </button>
                <button
                  onClick={exportToCSV}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg"
                >
                  ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â  Exportar CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blockchain Visualization */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Cadena de Bloques</h2>
        <div className="overflow-x-auto">
          <div className="flex items-center gap-4 pb-4">
            {blocks.slice(0, 10).reverse().map((block, index) => (
              <div key={block.id} className="flex items-center">
                <div
                  onClick={() => setSelectedBlock(block)}
                  className={`cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-lg hover:shadow-xl transition min-w-[120px] ${
                    selectedBlock?.id === block.id ? 'ring-4 ring-yellow-400' : ''
                  }`}
                >
                  <div className="text-center">
                    <p className="text-sm opacity-80">Bloque</p>
                    <p className="text-2xl font-bold">#{block.blockIndex}</p>
                    <p className="text-xs mt-1 opacity-80">{getEventIcon(block.eventType)}</p>
                  </div>
                </div>
                {index < 9 && blocks.length > index + 1 && (
                  <div className="text-blue-600 text-2xl mx-2">ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢</div>
                )}
              </div>
            ))}
            {blocks.length > 10 && (
              <div className="text-gray-400 text-xl">...</div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Block Details */}
      {selectedBlock && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Detalles del Bloque #{selectedBlock.blockIndex}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">InformaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n General</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Ândice de Bloque:</span>
                  <span className="font-mono font-bold">#{selectedBlock.blockIndex}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Evento:</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getEventColor(selectedBlock.eventType)}`}>
                    {getEventIcon(selectedBlock.eventType)} {selectedBlock.eventType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Marca de Tiempo:</span>
                  <span className="font-mono">{formatTimestamp(selectedBlock.timestamp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Usuario:</span>
                  <span className="font-medium">{selectedBlock.userId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recurso:</span>
                  <span className="font-medium">{selectedBlock.resourceType}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Prueba de Trabajo</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Hash Actual:</span>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                    <span className="text-green-600 font-bold">{selectedBlock.currentHash.substring(0, 2)}</span>
                    <span>{selectedBlock.currentHash.substring(2)}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Hash Anterior:</span>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                    {selectedBlock.previousHash}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nonce:</span>
                  <span className="font-mono font-bold text-purple-600">{selectedBlock.nonce}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`flex items-center gap-1 ${selectedBlock.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedBlock.isValid ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    {selectedBlock.isValid ? 'VÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡lido' : 'InvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡lido'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {selectedBlock.actionDetails && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-semibold text-gray-700 mb-2">Detalles de la AcciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(selectedBlock.actionDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Blocks List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Registro Completo de AuditorÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Bloque</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Evento</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Recurso</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Usuario</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Hash</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nonce</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Marca de Tiempo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlocks.map((block) => (
                <tr
                  key={block.id}
                  onClick={() => setSelectedBlock(block)}
                  className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition"
                >
                  <td className="py-3 px-4 font-mono font-bold">#{block.blockIndex}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getEventColor(block.eventType)}`}>
                      {getEventIcon(block.eventType)} {block.eventType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{block.resourceType}</td>
                  <td className="py-3 px-4 text-sm">{block.userId}</td>
                  <td className="py-3 px-4 font-mono text-xs">
                    <span className="text-green-600 font-bold">{block.currentHash.substring(0, 2)}</span>
                    {formatHash(block.currentHash).substring(2)}
                  </td>
                  <td className="py-3 px-4 font-mono text-purple-600">{block.nonce}</td>
                  <td className="py-3 px-4 text-xs">{formatTimestamp(block.timestamp)}</td>
                  <td className="py-3 px-4">
                    {block.isValid ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : (
                      <AlertTriangle className="text-red-600" size={20} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBlocks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search size={48} className="mx-auto mb-3 opacity-50" />
              <p>No se encontraron bloques con los filtros aplicados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}