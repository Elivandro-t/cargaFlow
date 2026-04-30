import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import {
  Clock, AlertTriangle, TrendingDown,
  Activity, MapPin, Package, ArrowRight, Truck, Timer,
  Filter, X, ChevronDown,
} from 'lucide-react';
import { useApp } from '../AppContext';
import { formatMinutes } from '../lib/processors';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { DataGrid } from './DataGrid';

const GM_RED = '#E31A1C';
const GM_BLUE = '#2563EB';
const GM_AMBER = '#F59E0B';

// ── Tooltip adaptativo ao tema ───────────────────────
function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-3 shadow-2xl text-sm">
      {label && <p className="font-bold text-gray-900 dark:text-slate-200 mb-2">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || '#64748b' }}>
          {p.name}: <span className="font-semibold">{formatter ? formatter(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────
interface KPICardProps {
  title: string;
  value: string;
  formula?: string;
  sub?: string;
  icon: React.ElementType;
  variant: 'red' | 'blue' | 'neutral' | 'amber';
  badge?: string;
}
// 🔴 KPICard (SOMENTE AJUSTE VISUAL + BORDA)
function KPICard({ title, value, formula, sub, icon: Icon, variant, badge }: KPICardProps) {
  const styles = {
    red: {
      wrap: `
        bg-white dark:bg-slate-900/50
        border border-slate-200 dark:border-slate-800/60
        border-l-4 border-l-rose-500
      `,
      icon: `bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400`,
      val: `text-[#57799C] dark:text-[#7FA3B8]`,
      badge: `bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40`,
      formula: `text-slate-500 dark:text-slate-400`,
      title: `text-slate-600 dark:text-slate-400`,
      sub: `text-rose-600 dark:text-rose-400 font-medium`,
    },

    blue: {
      wrap: `
    bg-white dark:bg-slate-900/50
    border border-slate-200 dark:border-slate-800/60
    border-l-4 border-l-blue-500
  `,
      icon: `bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400`,
      val: `text-[#57799C] dark:text-[#7FA3B8]`,
      badge: `bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40`,
      formula: `text-slate-500 dark:text-slate-400`,
      title: `text-slate-600 dark:text-slate-400`,
      sub: `text-[#57799C] dark:text-[#7FA3B8]`,
    },

    amber: {
      wrap: `
        bg-white dark:bg-slate-900/50
        border border-slate-200 dark:border-slate-800/60
        border-l-4 border-l-amber-500
      `,
      icon: `bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400`,
      val: `text-[#57799C] dark:text-[#7FA3B8]`,
      badge: `bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40`,
      formula: `text-slate-500 dark:text-slate-400`,
      title: `text-slate-600 dark:text-slate-400`,
      sub: `text-amber-600 dark:text-amber-400`,
    },

    neutral: {
      wrap: `
        bg-white dark:bg-slate-900/50
        border border-slate-200 dark:border-slate-800/60
        border-l-4 border-l-emerald-500
      `,
      icon: `bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`,
      val: `text-[#57799C] dark:text-[#7FA3B8]`,
      badge: `bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600/40`,
      formula: `text-slate-500 dark:text-slate-400`,
      title: `text-slate-600 dark:text-slate-400`,
      sub: `text-slate-600 dark:text-slate-400`,
    },
  }[variant];

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'rounded-xl px-3 py-2 flex flex-col justify-between',
        'shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] dark:shadow-sm',
        styles.wrap
      )}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('p-2 rounded-lg', styles.icon)}>
            <Icon className="w-4 h-4" />
          </div>

          <p className={cn(
            'text-xs font-semibold uppercase tracking-widest leading-none',
            styles.title
          )}>
            {title}
          </p>
        </div>

        {badge && (
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md',
            styles.badge
          )}>
            {badge}
          </span>
        )}
      </div>

      {/* VALOR */}
      <div className="py-1">
        <p className={cn(
          'text-2xl font-bold tracking-tight leading-none mt-1 mb-1',
          styles.val
        )}>
          {value}
        </p>

        {formula && (
          <p className={cn(
            'text-[11px] leading-tight mt-1 opacity-80',
            styles.formula
          )}>
            {formula}
          </p>
        )}

        {sub && (
          <p className={cn(
            'text-xs mt-2 leading-snug font-medium',
            styles.sub
          )}>
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}
// ── Main Dashboard ───────────────────────────────────
export function Dashboard() {
  const { data, filialFilter, setFilialFilter, filiais, loading, error, darkMode, rankingConfig, placa, setPlaca } = useApp();
  const logoSrc = darkMode ? '/logo-gm-white.png' : '/logo-gm.png';

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [transportadorSearch, setTransportadorSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(true);

  const externaData = useMemo(
    () => data.filter(r => r.tipo === 'EXTERNA'),
    [data],
  );

  // FIX: aplica filtro de filial client-side também (backend pode não suportar o param)
  const filteredData = useMemo(() => {
    return externaData.filter(r => {
      if (filialFilter && r.filial_codigo !== filialFilter) return false;
      if (dateFrom && r.data_operacao < dateFrom) return false;
      if (dateTo && r.data_operacao > dateTo) return false;
      return true;
    });
  }, [externaData, filialFilter, dateFrom, dateTo]);

  // KPI 1 — Pátio Pós-Pesagem Final (Saída − Peso Final)
  const patioStats = useMemo(() => {
    const com = filteredData.filter(r => r.lt_patio_pos_liberacao !== null && r.lt_patio_pos_liberacao >= 0);
    const avg = com.length > 0
      ? com.reduce((s, r) => s + r.lt_patio_pos_liberacao!, 0) / com.length
      : null;
    return { avg, count: com.length };
  }, [filteredData]);

  // KPI 3 — Tempo de Carregamento (Fim − Início do Carregamento)
  const carregamentoStats = useMemo(() => {
    const com = filteredData.filter(r => r.lt_carregamento !== null && r.lt_carregamento >= 0);
    const avg = com.length > 0
      ? com.reduce((s, r) => s + r.lt_carregamento!, 0) / com.length
      : null;
    return { avg, count: com.length };
  }, [filteredData]);

  // KPI — Espera Doca (Peso Inicial -> Início Carregamento)
  const esperaDocaStats = useMemo(() => {
    const com = filteredData.filter(r => r.lt_espera_doca !== null && r.lt_espera_doca >= 0);
    const avg = com.length > 0 ? com.reduce((s, r) => s + r.lt_espera_doca!, 0) / com.length : null;
    return { avg, count: com.length };
  }, [filteredData]);

  // KPI — Tempo de Rota (Saída CD -> Chegada CD)
  const rotaStats = useMemo(() => {
    const com = filteredData.filter(r => r.lt_rota !== null && r.lt_rota >= 0);
    const avg = com.length > 0 ? com.reduce((s, r) => s + r.lt_rota!, 0) / com.length : null;
    return { avg, count: com.length };
  }, [filteredData]);

  // KPI — Ciclo Completo (Lead Time Total)
  const cicloCompletoStats = useMemo(() => {
    const com = filteredData.filter(r => r.lt_total !== null && r.lt_total >= 0);
    const avg = com.length > 0 ? com.reduce((s, r) => s + r.lt_total!, 0) / com.length : null;
    return { avg, count: com.length };
  }, [filteredData]);

  // KPI 2+4 — Retorno e Acerto
  const retornoStats = useMemo(() => {
    const comRetorno = filteredData.filter(r => r.lt_retorno_total !== null && r.lt_retorno_total >= 0);
    const comFisico = filteredData.filter(r => r.lt_retorno_fisico !== null && r.lt_retorno_fisico >= 0);
    const comAcerto = filteredData.filter(r => r.lt_acerto !== null && r.lt_acerto >= 0);

    return {
      avgTotal: comRetorno.length > 0 ? comRetorno.reduce((s, r) => s + r.lt_retorno_total!, 0) / comRetorno.length : null,
      avgFisico: comFisico.length > 0 ? comFisico.reduce((s, r) => s + r.lt_retorno_fisico!, 0) / comFisico.length : null,
      avgAcerto: comAcerto.length > 0 ? comAcerto.reduce((s, r) => s + r.lt_acerto!, 0) / comAcerto.length : null,
    };
  }, [filteredData]);

  // Breakdown chart (retorno por etapa)
  const breakdownChartData = useMemo(() => [
    {
      etapa: 'Devolução',
      minutos: retornoStats.avgFisico !== null ? Math.round(retornoStats.avgFisico) : 0,
      cor: GM_BLUE,
    },
    {
      etapa: 'Acerto de carga',
      minutos: retornoStats.avgAcerto !== null ? Math.round(retornoStats.avgAcerto) : 0,
      cor: GM_AMBER,
    },
  ], [retornoStats]);

  // Top N placas — configurable metric, order (piores/melhores) and count
  const top20Placas = useMemo(() => {
    const { metrica, ordem, topN } = rankingConfig;
    const map = new Map<string, { total: number; count: number; motorista: string }>();
    filteredData.forEach(r => {
      const val = r[metrica] as number | null;
      if (val === null || val < 0) return;
      const cur = map.get(r.placa) || { total: 0, count: 0, motorista: r.motorista_nome };
      map.set(r.placa, { total: cur.total + val, count: cur.count + 1, motorista: r.motorista_nome });
    });
    return Array.from(map.entries())
      .map(([placa, v]) => ({
        placa,
        motorista: v.motorista,
        mediaMinutos: Math.round(v.total / v.count),
        ocorrencias: v.count,
      }))
      .sort((a, b) => ordem === 'piores'
        ? b.mediaMinutos - a.mediaMinutos
        : a.mediaMinutos - b.mediaMinutos)
      .slice(0, topN);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, rankingConfig.metrica, rankingConfig.ordem, rankingConfig.topN]);

  const maxPatioMinutos = Math.max(...top20Placas.map(p => p.mediaMinutos), 1);

  // Tendência diária
  const trendData = useMemo(() => {
    const map = new Map<string, { total: number; count: number; label: string }>();
    filteredData.forEach(r => {
      if (!r.data_operacao || r.data_operacao === 'N/A') return;
      const d = new Date(`${r.data_operacao}T12:00:00Z`);
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      const cur = map.get(r.data_operacao) || { total: 0, count: 0, label };
      if (r.lt_patio_pos_liberacao !== null && r.lt_patio_pos_liberacao >= 0) {
        cur.total += r.lt_patio_pos_liberacao;
        cur.count += 1;
      }
      map.set(r.data_operacao, cur);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, v]) => ({ data: v.label, avgPatio: v.count > 0 ? Math.round(v.total / v.count) : 0 }));
  }, [filteredData]);

  // ── Tela vazia ──────────────────────────────────────
  if (data.length === 0) {
    return (
  <div className="flex items-center justify-center py-24">
    <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] p-8 text-center space-y-4">

      {/* ÍCONE */}
      <div className="flex items-center justify-center">
        <Activity
          className={cn(
            "w-12 h-12 text-slate-300 dark:text-slate-600",
            loading && "animate-pulse"
          )}
        />
      </div>

      {/* TÍTULO */}
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
        {loading
          ? "Carregando dados..."
          : error
          ? "Não foi possível carregar os dados"
          : "Nenhum registro encontrado"}
      </h3>

      {/* SUBTEXTO */}
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {loading
          ? "Estamos processando as informações da operação."
          : error
          ? "Verifique a conexão com o servidor ou tente novamente em instantes."
          : "Não há registros para os filtros selecionados no momento."}
      </p>

      {/* ERRO DETALHADO */}
      {error && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800/30">
          <span className="text-xs font-mono text-red-600 dark:text-red-300 break-all">
            {error}
          </span>
        </div>
      )}
    </div>
  </div>
);
  }

  const filialNome = filiais.find(f => f.codigo === filialFilter)?.nome;
  const hasFilters = !!(dateFrom || dateTo || filialFilter || transportadorSearch);
  const activeFilterCount = [dateFrom, dateTo, filialFilter, transportadorSearch].filter(Boolean).length;

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">

      {/* ── Banner ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-gray-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] dark:shadow-sm"
      >
      <div className="flex items-center gap-4 px-6 py-5">

  {/* Logo */}
  <div className="flex items-center justify-center h-10">
    <img
      src={logoSrc}
      alt="Grupo Mateus"
      className="h-8 w-auto object-contain"
    />
  </div>

  {/* Textos */}
  <div className="min-w-0 flex flex-col justify-center">
    
    <h1 className="text-lg font-medium tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
      Ciclos Operação Externa
    </h1>

    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tracking-wide">
      Operação externa · Auditoria de transportadores
    </p>

  </div>
</div>

        {/* Barra de status */}
        <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 dark:border-slate-800 px-5 py-2 text-sm text-gray-400 dark:text-slate-500">
          <span className="font-medium text-gray-600 dark:text-slate-400">
            {filteredData.length.toLocaleString('pt-BR')} registros
            · {new Set(filteredData.map(r => r.placa)).size} placas únicas
          </span>
          {filialNome && (
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              Filial: {filialNome}
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Card de Filtros ──────────────────────────── */}
      <div className="rounded-xl border border-gray-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 backdrop-blur-sm shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] dark:shadow-sm overflow-hidden">
        <button
          onClick={() => setFiltersOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-500" />
            <span className="text-base font-bold text-[#0A1F44] dark:text-slate-200">Filtros</span>
            {hasFilters && (
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                ({activeFilterCount} {activeFilterCount === 1 ? 'ativo' : 'ativos'})
              </span>
            )}
          </div>
          <ChevronDown className={cn('w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform duration-200', filtersOpen && 'rotate-180')} />
        </button>

        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              key="filter-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div className="border-t border-gray-100 dark:border-slate-800 px-5 py-4">
                <div className="flex flex-wrap gap-3 items-end">

                  {/* FILIAL */}
                  <div className="flex flex-col gap-1 min-w-[200px] flex-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest">Filial</label>
                    <select
                      value={filialFilter}
                      onChange={e => setFilialFilter(e.target.value)}
                      className="bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-base text-gray-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option value="">Todas as Filiais</option>
                      {filiais.map(f => (
                        <option key={f.codigo} value={f.codigo}>{f.codigo} – {f.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* PLACA */}
                  <div className="flex flex-col gap-1 w-40">
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest">Placa</label>
                    <div className="relative">
                      <input
                        value={placa}
                        onChange={e => setPlaca(e.target.value)}
                        placeholder="Ex: ABC-1234"
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 pr-7 py-2 text-base text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                      {/* {placaSearch && (
                        <button onClick={() => setPlacaSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-slate-300">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )} */}
                    </div>
                  </div>

                  {/* TRANSPORTADOR */}
                  <div className="flex flex-col gap-1 w-52">
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest">Transportador</label>
                    <div className="relative">
                      <input
                        value={transportadorSearch}
                        onChange={e => setTransportadorSearch(e.target.value)}
                        placeholder="Nome do motorista..."
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 pr-7 py-2 text-base text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                      {transportadorSearch && (
                        <button onClick={() => setTransportadorSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-slate-300">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* DATA INÍCIO */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest">Data Início</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-base text-gray-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  {/* DATA FIM */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest">Data Fim</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-base text-gray-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  {hasFilters && (
                    <button
                      onClick={() => { setFilialFilter(''); setTransportadorSearch(''); setDateFrom(''); setDateTo(''); }}
                      className="self-end px-3 py-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg transition-all whitespace-nowrap"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── KPI Cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Ciclo Completo"
          value={formatMinutes(cicloCompletoStats.avg)}
          formula="Início Operação → Fim"
          sub={`Lead Time Geral · ${cicloCompletoStats.count} viagens`}
          icon={Activity}
          variant="blue"
        />
        <KPICard
          title="Espera Doca"
          value={formatMinutes(esperaDocaStats.avg)}
          formula="Peso Inicial → Início Carreg."
          sub={`${esperaDocaStats.count} `}
          icon={Timer}
          variant="neutral"
        />
        <KPICard
          title="Tempo de Carregamento"
          value={formatMinutes(carregamentoStats.avg)}
          formula="Início → Fim do Carregamento"
          sub={`${carregamentoStats.count} `}
          icon={Package}
          variant="neutral"
        />
        <KPICard
          title="Pátio Pós-Pesagem Final"
          value={formatMinutes(patioStats.avg)}
          formula="Saída − Pesagem Final"
          sub={`Responsabilidade do transportador · ${patioStats.count} `}
          icon={AlertTriangle}
          variant="red"
          badge="Crítico"
        />
        <KPICard
          title="Tempo em Rota"
          value={formatMinutes(rotaStats.avg)}
          formula="Saída CD → Chegada CD"
          sub={`${rotaStats.count} viagens`}
          icon={Truck}
          variant="neutral"
        />
        <KPICard
          title="Devolução"
          value={formatMinutes(retornoStats.avgFisico)}
          formula="Início → Fim Devolução"
          sub="Devolução física de mercadorias"
          icon={ArrowRight}
          variant="neutral"
        />
        <KPICard
          title="Acerto de carga"
          value={formatMinutes(retornoStats.avgAcerto)}
          formula="Início → Final do Acerto"
          sub="Etapa documental"
          icon={Clock}
          variant="neutral"
        />
        <KPICard
          title="Retorno + Acerto (Total)"
          value={formatMinutes(retornoStats.avgTotal)}
          formula="Chegada CD → Final do Acerto"
          sub="Ciclo completo pós-entrega"
          icon={TrendingDown}
          variant="amber"
        />
      </div>

      {/* ── Seção central ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:items-stretch">

        {/* Coluna 1/3: gráficos — altura total 614px (gap 20px + 307px each) */}
        <div className="lg:col-span-1 flex flex-col gap-5 lg:h-[614px]">

          {/* Breakdown — Retorno por etapa */}
          <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] dark:shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden p-5">
            <div className="flex items-start justify-between gap-4 mb-5">

              <div className="min-w-0">

                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-500 shrink-0" />
                  Retorno — Distribuição por etapa
                </h3>

                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                  Tempo médio por etapa após retorno
                </p>

              </div>

              {retornoStats.avgTotal !== null && (
                <div className="text-right shrink-0">

                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    Total médio
                  </p>

                  <p className="text-xl font-semibold font-mono text-sky-600 dark:text-sky-400 tracking-tight">
                    {formatMinutes(retornoStats.avgTotal)}
                  </p>

                </div>
              )}

            </div>

            {/* Barras visuais proporcionais */}
            <div className="space-y-4 mb-6">
              {breakdownChartData.map((item, i) => {
                const maxVal = Math.max(...breakdownChartData.map(d => d.minutos), 1);
                const pct = Math.round((item.minutos / maxVal) * 100);
                const showLbl = pct > 20;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-700 dark:text-slate-300">{item.etapa}</span>
                      <span className="text-lg font-black font-mono" style={{ color: item.cor }}>
                        {formatMinutes(item.minutos)}
                      </span>
                    </div>
                    <div className="h-[18px] bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, 1)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' }}
                        className="h-full rounded-xl flex items-center px-3"
                        style={{
                          background: `${item.cor}22`,
                          borderLeft: `4px solid ${item.cor}`,
                        }}
                      >
                        {showLbl && (
                          <span className="text-sm font-bold whitespace-nowrap" style={{ color: item.cor }}>
                            {pct}% do ciclo
                          </span>
                        )}
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recharts — barras horizontais */}
            {/* Recharts — barras horizontais */}
            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={breakdownChartData}
                  layout="vertical"
                  margin={{ left: 10, right: 90, top: 0, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--color-border)" />

                  <XAxis
                    type="number"
                    domain={[0, Math.max(...breakdownChartData.map(d => d.minutos), 1) * 1.2]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                    tickFormatter={formatMinutes}
                  />

                  <YAxis
                    type="category"
                    dataKey="etapa"
                    width={120}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--color-foreground)', fontWeight: 600 }}
                  />

                  <Tooltip
                    content={<ChartTooltip formatter={formatMinutes} />}
                    cursor={{ fill: 'var(--color-border)', fillOpacity: 0.3 }}
                  />

                  <Bar dataKey="minutos" radius={[0, 8, 8, 0]} barSize={16}>
                    {breakdownChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.cor} fillOpacity={0.85} />
                    ))}

                    <LabelList
                      dataKey="minutos"
                      position="right"
                      formatter={(v: unknown) =>
                        formatMinutes(typeof v === 'number' ? v : null)
                      }
                      style={{
                        fill: '#64748b',
                        fontSize: 11,
                        fontWeight: 700,
                        whiteSpace: 'nowrap'
                      }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tendência diária — Pátio Pós-Pesagem Final */}
          <div className="bg-white dark:bg-slate-900/60 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] dark:shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden p-5">
            <h3 className="text-base font-bold text-[#5f646e] dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#E31A1C] shrink-0" />
              Evolução Diária — Pátio Pós-Pesagem Final
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="rgba(148,163,184,0.15)"
                  />

                  <XAxis
                    dataKey="data"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: '#94A3B8',
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={70}
                    tick={{
                      fontSize: 11,
                      fill: '#94A3B8',
                    }}
                    tickFormatter={formatMinutes}
                  />

                  <Tooltip
                    content={<ChartTooltip formatter={formatMinutes} />}
                    cursor={{ fill: 'rgba(227,26,28,0.06)' }}
                  />

                  <Bar
                    dataKey="avgPatio"
                    radius={[4, 4, 0, 0]}
                    barSize={14}
                    fill="#E31A1C"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        {/* Coluna 1/3: Top 20 — altura fixa 614px para alinhar com os dois gráficos */}
        <div className="b bg-white dark:bg-slate-900/60 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]dark:shadow-sm flex flex-col w-full lg:h-[614px] overflow-hidden p-5">

          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#5f646e] dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                Top {top20Placas.length} Piores Placas
              </h3>
              <p className="text-sm text-gray-400 dark:text-slate-600 mt-0.5">
                Maior tempo médio no pátio pós-pesagem
              </p>
            </div>

            <span className="text-sm bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 font-bold uppercase px-2 py-1 rounded-lg tracking-widest shrink-0">
              Reincidência
            </span>
          </div>

          {top20Placas.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-slate-600 text-base py-12">
              Sem dados de pátio disponíveis
            </div>
          ) : (
            <div className="flex-1 min-h-0 space-y-2 overflow-y-auto custom-scrollbar pr-0.5">

              {top20Placas.map((item, i) => {
                const barPct = (item.mediaMinutos / maxPatioMinutos) * 100;
                const isHighlight = i < 3;

                return (
                  <motion.div
                    key={item.placa}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl p-3 border border-gray-100 dark:border-slate-700/40 bg-white dark:bg-slate-900/40 transition-all"
                  >

                    <div className="flex items-center justify-between mb-2 gap-2">

                      <div className="flex items-center gap-2 min-w-0">

                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-sm font-black shrink-0 bg-gray-200 dark:bg-slate-700/60 text-gray-600 dark:text-slate-400">
                          {i + 1}
                        </span>

                        <div className="min-w-0">
                          <p className={cn(
                            'text-base font-black font-mono tracking-wider leading-none',
                            isHighlight
                              ? 'text-rose-700 dark:text-rose-300'
                              : 'text-[#0A1F44] dark:text-slate-200',
                          )}>
                            {item.placa}
                          </p>

                          <p className="text-sm text-gray-400 dark:text-slate-500 truncate">
                            {item.ocorrencias}× ocorrência{item.ocorrencias !== 1 ? 's' : ''}
                          </p>
                        </div>

                      </div>

                      <span className={cn(
                        'text-base font-black font-mono shrink-0',
                        isHighlight
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-[#0A1F44] dark:text-slate-300',
                      )}>
                        {formatMinutes(item.mediaMinutos)}
                      </span>

                    </div>

                    <div className="h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barPct}%` }}
                        transition={{ duration: 0.6, delay: 0.1 + i * 0.04 }}
                        className="h-full rounded-full"
                        style={{
                          background: isHighlight ? '#E11D48' : GM_BLUE,
                          opacity: 0.75
                        }}
                      />
                    </div>

                  </motion.div>
                );
              })}

            </div>
          )}
        </div>

        {/* Coluna 1/3: Espaço reservado para próximo dashboard */}
        <div className="lg:col-span-1 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700/50 flex items-center justify-center min-h-[200px]">
          <p className="text-xs text-gray-300 dark:text-slate-700 font-medium select-none">
            — espaço reservado —
          </p>
        </div>
      </div>

      {/* ── DataGrid ─────────────────────────────────── */}
      <DataGrid data={filteredData} placaSearch={placa} transportadorSearch={transportadorSearch} />
    </div>
  );
}
