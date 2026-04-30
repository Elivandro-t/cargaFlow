import { useState, useMemo } from 'react';
import {
  Search as SearchIcon, Car, History, Clock, Activity,
  AlertTriangle, TrendingUp, Filter, Loader2,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { formatMinutes } from '../lib/processors';
import { OperationRecord } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const recordTimestamp = (r: OperationRecord): number =>
  r.criacao ?? r.peso_inicial ?? r.saida ?? r.agenda ?? r.final_acerto ?? 0;

export function PlateSearch() {
  const { data, filialFilter, setFilialFilter, filiais } = useApp();
  const [query,        setQuery]        = useState('');
  const [startDate,    setStartDate]    = useState('');
  const [endDate,      setEndDate]      = useState('');
  const [selectedTipo, setSelectedTipo] = useState('Todos');

  const searchResults = useMemo(() => {
    if (!query || query.length < 3) return null;
    const normalizedQuery = query.replace(/-/g, '').toUpperCase();

    let pool = data;
    if (startDate) pool = pool.filter(r => r.data_operacao >= startDate);
    if (endDate)   pool = pool.filter(r => r.data_operacao <= endDate);
    if (selectedTipo !== 'Todos') {
      pool = pool.filter(r => selectedTipo === 'ABASTECIMENTO'
        ? (r.tipo === 'ABASTECIMENTO' || r.tipo === 'ATACAREJO')
        : r.tipo === selectedTipo);
    }

    const matchRecords = pool.filter(r => r.placa.includes(normalizedQuery));
    if (matchRecords.length === 0) return [];

    const grouped = new Map<string, OperationRecord[]>();
    matchRecords.forEach(r => {
      if (!grouped.has(r.placa)) grouped.set(r.placa, []);
      grouped.get(r.placa)!.push(r);
    });

    return Array.from(grouped.entries()).map(([plate, records]) => {
      const calculateAvg = (key: keyof OperationRecord) => {
        const vals = records.map(r => r[key]).filter((v): v is number => typeof v === 'number' && v >= 0);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      };

      const sorted = [...records].sort((a, b) => recordTimestamp(b) - recordTimestamp(a));
      const lastTrip = sorted[0];

      // Veículo fisicamente em rota: saiu mas ainda não retornou ao CD
      const lastTripOnRoute = !!(lastTrip?.saida) && !lastTrip?.chegada_cd;
      // Veículo retornou mas acerto administrativo ainda não foi fechado
      const lastTripAcertoPendente = !!(lastTrip?.chegada_cd) && !lastTrip?.final_acerto;

      return {
        placa:              plate,
        avgTotal:           calculateAvg('lt_total'),
        avgEspera:          calculateAvg('lt_espera_doca'),
        avgCarregamento:    calculateAvg('lt_carregamento'),
        avgForaCD:          calculateAvg('lt_fora_cd'),
        avgPatio:           calculateAvg('lt_patio_pos_liberacao'),
        avgRota:            calculateAvg('lt_rota'),
        avgRetorno:         calculateAvg('lt_retorno_fisico'),
        avgAcerto:          calculateAvg('lt_acerto'),
        tripCount:          records.length,
        lastTrip,
        lastTripOnRoute,
        lastTripAcertoPendente,
        history:            sorted.slice(0, 10),
      };
    }).sort((a, b) => b.tripCount - a.tripCount).slice(0, 5);
  }, [data, query, startDate, endDate, selectedTipo, filialFilter]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">

      {/* Título */}
      <div className="text-center space-y-1 pt-2">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-slate-100">
          Busca e Analytics de Placa
        </h2>
        <p className="text-gray-400 dark:text-slate-500 text-base">
          Histórico detalhado e médias de performance filtráveis por veículo.
        </p>
      </div>

      {/* Caixa de busca + filtros */}
      <div className="bento-grid-card space-y-5">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Digite a placa (mín. 3 caracteres)..."
            value={query}
            onChange={e => setQuery(e.target.value.toUpperCase())}
            className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xl font-black font-mono tracking-widest text-gray-900 dark:text-slate-100 placeholder:font-sans placeholder:text-lg placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400"
          />
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-slate-700/50">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-3">
            <Filter className="w-3.5 h-3.5" /> Refinar Resultados
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Data Inicial', child: (
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 focus:border-blue-500 outline-none pb-1.5 text-base font-mono text-gray-700 dark:text-slate-200 transition-colors" />
              )},
              { label: 'Data Final', child: (
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 focus:border-blue-500 outline-none pb-1.5 text-base font-mono text-gray-700 dark:text-slate-200 transition-colors" />
              )},
              { label: 'Tipo de Operação', child: (
                <select value={selectedTipo} onChange={e => setSelectedTipo(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 focus:border-blue-500 outline-none pb-1.5 text-base text-gray-700 dark:text-slate-200 dark:bg-slate-800 transition-colors">
                  <option value="Todos">Todas as Operações</option>
                  <option value="EXTERNA">Externa (Saída/Acerto)</option>
                  <option value="ABASTECIMENTO">Abastecimento (Lojas)</option>
                </select>
              )},
              { label: 'Filial', child: (
                <select value={filialFilter} onChange={e => setFilialFilter(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-200 dark:border-slate-700 focus:border-blue-500 outline-none pb-1.5 text-base text-gray-700 dark:text-slate-200 dark:bg-slate-800 transition-colors">
                  <option value="">Todas as Filiais</option>
                  {filiais.map(f => <option key={f.codigo} value={f.codigo}>{f.codigo} — {f.nome}</option>)}
                </select>
              )},
            ].map(({ label, child }) => (
              <div key={label}>
                <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">
                  {label}
                </label>
                {child}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="space-y-8">
        <AnimatePresence>
          {searchResults && searchResults.map(result => {
            const isExterna = result.lastTrip?.tipo === 'EXTERNA';
            const isStruggle = result.avgTotal !== null && result.avgTotal > (1440 * 3);
            const foraCDGargalo = isExterna && result.avgForaCD && result.avgTotal
              && (result.avgForaCD > result.avgTotal * 0.4);

            return (
              <motion.div
                key={result.placa}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5 pb-8 border-b border-gray-100 dark:border-slate-800 last:border-0"
              >
                {/* KPI cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard
                    label="Total de Viagens"
                    value={result.tripCount.toString()}
                    icon={History}
                    variant="neutral"
                  />
                  <StatCard
                    label="Média Lead Time"
                    value={formatMinutes(result.avgTotal)}
                    icon={Clock}
                    variant="blue"
                  />
                  <StatCard
                    label="Lead Time (Última)"
                    value={result.lastTripOnRoute ? 'Em rota' : result.lastTripAcertoPendente ? 'Acerto pendente' : formatMinutes(result.lastTrip?.lt_total ?? null)}
                    sub={result.lastTripOnRoute ? 'Veículo ainda em campo' : result.lastTripAcertoPendente ? 'Veículo retornou ao CD' : undefined}
                    icon={result.lastTripOnRoute || result.lastTripAcertoPendente ? Loader2 : Activity}
                    variant={result.lastTripOnRoute ? 'amber' : result.lastTripAcertoPendente ? 'blue' : isStruggle ? 'red' : 'green'}
                    iconSpin={result.lastTripOnRoute}
                  />
                  <StatCard
                    label="Placa"
                    value={result.placa}
                    icon={Car}
                    variant="neutral"
                    mono
                  />
                </div>


                {/* Diagnóstico de gargalo */}
                {isStruggle && (
                  <div className="rounded-xl px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-1.5">
                    <h4 className="font-bold text-amber-600 dark:text-amber-400 text-sm uppercase tracking-widest flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Diagnóstico Técnico (Automático)
                    </h4>
                    <p className="text-base text-gray-600 dark:text-slate-400">
                      Placa com lead time alto (acima de 3 dias). Padrão esperado é de 1 a 3 dias.
                    </p>
                    <p className={cn('text-base font-bold flex items-center gap-1.5', foraCDGargalo
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400')}>
                      <TrendingUp className="w-4 h-4" />
                      {foraCDGargalo
                        ? `Gargalo na Logística Externa (média ${formatMinutes(result.avgForaCD)} fora do CD).`
                        : 'Gargalo majoritariamente no processo de carregamento/faturamento no CD.'}
                    </p>
                  </div>
                )}

                {/* Grid de detalhes */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                  {/* Médias por Etapa */}
                  <div className="bento-grid-card space-y-5">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" /> Médias por Etapa
                    </h3>
                    <div className="space-y-3.5">
                      <AvgRow label="Espera Doca"        value={result.avgEspera} />
                      <AvgRow label="Carregamento"        value={result.avgCarregamento} />
                      <AvgRow label="Pátio Pós-Pesagem"  value={result.avgPatio} />
                      <AvgRow label={isExterna ? 'Fora do CD' : 'Em trânsito'} value={result.avgForaCD} />
                      <AvgRow label="Tempo em Rota"       value={result.avgRota} />
                      <AvgRow label="Devolução"           value={result.avgRetorno} />
                      <AvgRow label="Acerto de carga"     value={result.avgAcerto} />
                      <div className="pt-3 border-t border-gray-100 dark:border-slate-700/50">
                        <AvgRow label="Tempo Médio Total" value={result.avgTotal} highlight />
                      </div>
                    </div>
                  </div>

                  {/* Histórico de carregamentos */}
                  <div className="lg:col-span-2 bento-grid-card overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
                        Últimos Carregamentos
                      </h3>
                      <span className="text-xs text-gray-400 dark:text-slate-600 font-mono">
                        Top 10 — {result.placa}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-base">
                        <thead>
                          <tr className="text-left border-b border-gray-100 dark:border-slate-700/50">
                            {['Data', 'Filial', 'Tipo', 'Lead Time'].map((h, i) => (
                              <th key={h} className={cn('pb-3 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500', i === 3 && 'text-right')}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                          {result.history.map((h, i) => {
                            // Em rota: saiu mas não voltou ao CD
                            const onRoute        = i === 0 && !!h.saida && !h.chegada_cd;
                            // Acerto pendente: voltou mas acerto não foi fechado
                            const acertoPendente = i === 0 && !!h.chegada_cd && !h.final_acerto;
                            // Data de saída (mais significativa que data de carregamento)
                            const displayDate = h.saida
                              ? new Date(h.saida).toISOString().split('T')[0]
                              : h.data_operacao || '';
                            const [y, m, d] = displayDate.split('-');
                            return (
                              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="py-3 font-mono text-sm text-gray-600 dark:text-slate-300">
                                  {d}/{m}/{y}
                                </td>
                                <td className="py-3 text-sm text-gray-500 dark:text-slate-400 truncate max-w-[140px]">
                                  {h.filial_nome}
                                </td>
                                <td className="py-3">
                                  <span className={cn(
                                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                                    h.tipo === 'EXTERNA'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                                  )}>
                                    {h.tipo}
                                  </span>
                                </td>
                                <td className="py-3 text-right font-mono font-bold text-base whitespace-nowrap">
                                  {onRoute ? (
                                    <span className="text-amber-500 dark:text-amber-400 flex items-center justify-end gap-1 text-xs">
                                      <Loader2 className="w-3 h-3 animate-spin" /> Em rota
                                    </span>
                                  ) : acertoPendente ? (
                                    <span className="text-blue-500 dark:text-blue-400 flex items-center justify-end gap-1 text-xs">
                                      <Loader2 className="w-3 h-3 animate-spin" /> Acerto pendente
                                    </span>
                                  ) : (
                                    <span className={cn(
                                      h.lt_total && h.lt_total > 1440 * 3 ? 'text-red-500 dark:text-red-400' : 'text-gray-800 dark:text-slate-200'
                                    )}>
                                      {formatMinutes(h.lt_total)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </motion.div>
            );
          })}

          {searchResults?.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bento-grid-card border-dashed"
            >
              <Car className="mx-auto w-12 h-12 text-gray-200 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-bold text-gray-400 dark:text-slate-500">Placa não encontrada</h3>
              <p className="text-base text-gray-400 dark:text-slate-600 mt-1 max-w-sm mx-auto">
                Nenhum conhecimento bate com os filtros atuais{filialFilter && ` (filial ${filialFilter})`}.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Sub-componentes ──────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  variant: 'neutral' | 'blue' | 'red' | 'green' | 'amber';
  mono?: boolean;
  iconSpin?: boolean;
}

function StatCard({ label, value, sub, icon: Icon, variant, mono, iconSpin }: StatCardProps) {
  const styles = {
    neutral: { wrap: 'bento-grid-card',                                             val: 'text-gray-800 dark:text-slate-200', icon: 'text-gray-400 dark:text-slate-500' },
    blue:    { wrap: 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-4',   val: 'text-blue-700 dark:text-blue-300',   icon: 'text-blue-500' },
    red:     { wrap: 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-2xl p-4',       val: 'text-red-600 dark:text-red-400',     icon: 'text-red-500' },
    green:   { wrap: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4', val: 'text-emerald-700 dark:text-emerald-400', icon: 'text-emerald-500' },
    amber:   { wrap: 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4',         val: 'text-amber-700 dark:text-amber-300',    icon: 'text-amber-500' },
  }[variant];

  return (
    <div className={cn('flex flex-col justify-between h-28', styles.wrap)}>
      <div className="flex items-center gap-2">
        <Icon className={cn('w-4 h-4 shrink-0', styles.icon, iconSpin && 'animate-spin')} />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">{label}</span>
      </div>
      <div>
        <div className={cn('text-2xl font-black', mono ? 'font-mono tracking-widest' : 'font-sans', styles.val)}>
          {value}
        </div>
        {sub && <p className="text-xs text-gray-400 dark:text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function AvgRow({ label, value, highlight }: {
  label: string;
  value: number | null;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className={cn(
        'text-base transition-colors',
        highlight
          ? 'font-bold text-gray-800 dark:text-slate-200'
          : 'text-gray-500 dark:text-slate-400',
      )}>
        {label}
      </span>
      <span className={cn(
        'font-mono whitespace-nowrap',
        highlight
          ? 'text-blue-600 dark:text-blue-400 font-black text-xl'
          : value === null
            ? 'text-base text-gray-300 dark:text-slate-600'
            : 'text-base font-semibold text-gray-700 dark:text-slate-300',
      )}>
        {formatMinutes(value)}
      </span>
    </div>
  );
}
