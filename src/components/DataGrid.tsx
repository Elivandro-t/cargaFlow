import { useState, useMemo, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import {
  Download, ChevronUp, ChevronDown, ChevronsUpDown,
  CheckSquare, Square, AlertTriangle,
} from 'lucide-react';
import { OperationRecord, SLAConfig } from '../types';
import { formatMinutes } from '../lib/processors';
import { cn } from '../lib/utils';
import { useApp } from '../AppContext';
import { motion, AnimatePresence } from 'motion/react';

// Retorna o limite SLA em minutos para uma etapa, considerando tipo e filial
function getSlaMinutes(slas: SLAConfig[], etapa: string, tipo: string, filial: string): number | null {
  const match = slas.find(s =>
    s.etapa === etapa &&
    s.tipoOperacao === tipo &&
    (s.filial === 'TODAS' || s.filial === filial),
  );
  return match ? match.horas * 60 : null;
}

// ── CSV Export ───────────────────────────────────────
function exportCSV(records: OperationRecord[]) {
  const rows = records.map(r => ({
    'Conhecimento':               r.id,
    'Placa':                      r.placa,
    'Data Operação':              r.data_operacao,
    'Motorista':                  r.motorista_nome,
    'Filial':                     r.filial_nome,
    'Pátio Pós-Pesagem Final (min)':  r.lt_patio_pos_liberacao !== null ? Math.round(r.lt_patio_pos_liberacao) : '',
    'Pátio Pós-Pesagem Final (fmt)':  formatMinutes(r.lt_patio_pos_liberacao),
    'Espera Doca (min)':              r.lt_espera_doca         !== null ? Math.round(r.lt_espera_doca)         : '',
    'Espera Doca (fmt)':              formatMinutes(r.lt_espera_doca),
    'Tempo de Carregamento (min)':    r.lt_carregamento        !== null ? Math.round(r.lt_carregamento)        : '',
    'Tempo de Carregamento (fmt)':    formatMinutes(r.lt_carregamento),
    'Tempo em Rota (min)':            r.lt_rota                !== null ? Math.round(r.lt_rota)                : '',
    'Tempo em Rota (fmt)':            formatMinutes(r.lt_rota),
    'Devolução (min)':                r.lt_retorno_fisico      !== null ? Math.round(r.lt_retorno_fisico)      : '',
    'Devolução (fmt)':                formatMinutes(r.lt_retorno_fisico),
    'Acerto de carga (min)':          r.lt_acerto              !== null ? Math.round(r.lt_acerto)              : '',
    'Acerto de carga (fmt)':          formatMinutes(r.lt_acerto),
    'Retorno Total (min)':            r.lt_retorno_total       !== null ? Math.round(r.lt_retorno_total)       : '',
    'Retorno Total (fmt)':            formatMinutes(r.lt_retorno_total),
  }));

  const csv  = Papa.unparse(rows, { delimiter: ';' });
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `gestao-a-vista-auditoria-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Tipos internos ───────────────────────────────────

type SortKey = 'placa' | 'data_operacao' | 'motorista_nome' | 'filial_nome'
             | 'lt_patio_pos_liberacao' | 'lt_carregamento' | 'lt_espera_doca'
             | 'lt_rota' | 'lt_retorno_fisico' | 'lt_acerto' | 'lt_retorno_total';
type SortDir = 'asc' | 'desc';

interface ColDef {
  key: SortKey;
  label: string;
  title?: string;
  align?: 'left' | 'right';
  render: (r: OperationRecord) => React.ReactNode;
}

const PAGE_SIZE = 50;

// ── Indicador de tempo colorido ──────────────────────
function TimeCell({ minutes, thresholdWarn = 60, thresholdCrit = 120 }: {
  minutes: number | null;
  thresholdWarn?: number;
  thresholdCrit?: number;
}) {
  if (minutes === null) return <span className="text-gray-300 dark:text-slate-600">—</span>;
  const isCrit = minutes >= thresholdCrit;
  const isWarn = minutes >= thresholdWarn;
  return (
    <span className={cn(
      'font-mono font-bold text-base',
      isCrit ? 'text-red-500 dark:text-red-400' : isWarn ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400',
    )}>
      {formatMinutes(minutes)}
    </span>
  );
}

// ── Cabeçalho ordenável ──────────────────────────────
function SortableHeader({
  label, title, colKey, sortKey, sortDir, onSort, align = 'left',
}: {
  label: string; title?: string; colKey: SortKey; sortKey: SortKey; sortDir: SortDir;
  onSort: (k: SortKey) => void; align?: 'left' | 'right';
}) {
  const active = sortKey === colKey;
  return (
    <th
      onClick={() => onSort(colKey)}
      title={title}
      className={cn(
        'px-3 py-3 text-sm font-bold uppercase tracking-widest cursor-pointer select-none whitespace-nowrap',
        'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 transition-colors',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active
          ? (sortDir === 'asc'
              ? <ChevronUp   className="w-3 h-3 text-blue-500" />
              : <ChevronDown className="w-3 h-3 text-blue-500" />)
          : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
      </span>
    </th>
  );
}

// ── Componente principal ─────────────────────────────
interface DataGridProps {
  data: OperationRecord[];
  placaSearch: string;
  transportadorSearch: string;
}

export function DataGrid({ data, placaSearch, transportadorSearch }: DataGridProps) {
  const { slas } = useApp();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey,  setSortKey]  = useState<SortKey>('lt_patio_pos_liberacao');
  const [sortDir,  setSortDir]  = useState<SortDir>('desc');
  const [page,     setPage]     = useState(0);

  useEffect(() => { setPage(0); }, [placaSearch, transportadorSearch]);

  // ── Pesquisa ────────────────────────────────────────
  const searched = useMemo(() => {
    const qPlaca = placaSearch;
    const qTrans = transportadorSearch.trim().toUpperCase();
    return data.filter(r => {
      if (qPlaca && !r.placa.includes(qPlaca)) return false;
      if (qTrans && !r.motorista_nome.toUpperCase().includes(qTrans)) return false;
      return true;
    });
  }, [data, placaSearch, transportadorSearch]);

  // ── Ordenação ───────────────────────────────────────
  const sorted = useMemo(() => {
    return [...searched].sort((a, b) => {
      const va = a[sortKey] ?? -1;
      const vb = b[sortKey] ?? -1;
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });
  }, [searched, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged      = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // ── Handlers ────────────────────────────────────────
  const handleSort = useCallback((key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  }, [sortKey]);

  const toggleRow = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (paged.length > 0 && paged.every(r => selected.has(r.id))) {
      setSelected(prev => { const n = new Set(prev); paged.forEach(r => n.delete(r.id)); return n; });
    } else {
      setSelected(prev => { const n = new Set(prev); paged.forEach(r => n.add(r.id));    return n; });
    }
  };

  const allPageSelected = paged.length > 0 && paged.every(r => selected.has(r.id));

  const handleExport = () => {
    exportCSV(selected.size > 0 ? data.filter(r => selected.has(r.id)) : sorted);
  };

  // ── Colunas ──────────────────────────────────────────
  const cols: ColDef[] = [
    {
      key: 'placa',
      label: 'Placa',
      render: r => (
        <span className="font-mono font-black text-gray-900 dark:text-slate-100 tracking-wider text-base">
          {r.placa}
        </span>
      ),
    },
    {
      key: 'data_operacao',
      label: 'Data',
      render: r => {
        if (!r.data_operacao || r.data_operacao === 'N/A')
          return <span className="text-gray-300 dark:text-slate-600">—</span>;
        const [y, m, d] = r.data_operacao.split('-');
        return <span className="text-gray-600 dark:text-slate-300 font-mono text-base">{d}/{m}/{y}</span>;
      },
    },
    {
      key: 'motorista_nome',
      label: 'Motorista',
      render: r => (
        <span className="text-gray-700 dark:text-slate-300 text-base truncate max-w-[160px] block" title={r.motorista_nome}>
          {r.motorista_nome || '—'}
        </span>
      ),
    },
    {
      key: 'filial_nome',
      label: 'Filial',
      render: r => (
        <span className="text-gray-500 dark:text-slate-400 text-base truncate max-w-[120px] block" title={r.filial_nome}>
          {r.filial_nome || r.filial_codigo || '—'}
        </span>
      ),
    },
    {
      key: 'lt_patio_pos_liberacao',
      label: 'Pátio Pós-Pesagem',
      title: 'Saída − Pesagem Final (responsabilidade do transportador)',
      align: 'right',
      render: r => (
        <div className="flex items-center justify-end gap-1.5">
          {r.lt_patio_pos_liberacao !== null && r.lt_patio_pos_liberacao >= 120 && (
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          )}
          <TimeCell minutes={r.lt_patio_pos_liberacao} thresholdWarn={30} thresholdCrit={90} />
        </div>
      ),
    },
    {
      key: 'lt_espera_doca',
      label: 'Espera Doca',
      title: 'Peso Inicial → Início do Carregamento',
      align: 'right',
      render: r => {
        const crit = getSlaMinutes(slas, 'Espera Doca', r.tipo, r.filial_codigo) ?? 120;
        return <TimeCell minutes={r.lt_espera_doca} thresholdWarn={Math.round(crit * 0.75)} thresholdCrit={crit} />;
      },
    },
    {
      key: 'lt_carregamento',
      label: 'Carregamento',
      title: 'Fim do Carregamento − Início do Carregamento',
      align: 'right',
      render: r => {
        const crit = getSlaMinutes(slas, 'Carregamento CD', r.tipo, r.filial_codigo) ?? 120;
        return <TimeCell minutes={r.lt_carregamento} thresholdWarn={Math.round(crit * 0.75)} thresholdCrit={crit} />;
      },
    },
    {
      key: 'lt_rota',
      label: 'Tempo em Rota',
      title: 'Saída CD → Chegada CD',
      align: 'right',
      render: r => <TimeCell minutes={r.lt_rota} thresholdWarn={1440} thresholdCrit={2880} />,
    },
    {
      key: 'lt_retorno_fisico',
      label: 'Devolução',
      title: 'Chegada CD → Início do Acerto',
      align: 'right',
      render: r => <TimeCell minutes={r.lt_retorno_fisico} thresholdWarn={60} thresholdCrit={180} />,
    },
    {
      key: 'lt_acerto',
      label: 'Acerto de carga',
      title: 'Início → Final do Acerto',
      align: 'right',
      render: r => {
        const crit = getSlaMinutes(slas, 'Acerto', r.tipo, r.filial_codigo) ?? 120;
        return <TimeCell minutes={r.lt_acerto} thresholdWarn={Math.round(crit * 0.75)} thresholdCrit={crit} />;
      },
    },
    {
      key: 'lt_retorno_total',
      label: 'Retorno Total',
      title: 'Chegada CD → Final do Acerto (ciclo completo)',
      align: 'right',
      render: r => <TimeCell minutes={r.lt_retorno_total} thresholdWarn={120} thresholdCrit={300} />,
    },
  ];

  return (
    <div className="rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card overflow-hidden shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] dark:shadow-sm">

      {/* ── Header ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-100 dark:border-slate-700/50">
        <div>
          <h3 className="text-base font-bold text-[#60656e] dark:text-slate-300 flex items-center gap-2">
            Registros Detalhados — Operação Externa
            <span className="text-sm bg-gray-100 dark:bg-slate-700/60 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-md font-mono">
              {sorted.length.toLocaleString('pt-BR')} registros
            </span>
          </h3>
          {selected.size > 0 && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5 font-medium">
              {selected.size} {selected.size === 1 ? 'linha selecionada' : 'linhas selecionadas'} para exportação
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Exportar */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleExport}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-base font-bold transition-all shadow',
              selected.size > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200',
            )}
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">
              {selected.size > 0
                ? `Exportar Selecionados (${selected.size})`
                : `Exportar Todos (${sorted.length.toLocaleString('pt-BR')})`}
            </span>
          </motion.button>
        </div>
      </div>

      {/* ── Legenda ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 px-5 py-2 bg-gray-50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800/50 text-sm text-gray-400 dark:text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Dentro do limite
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Atenção
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Crítico
        </span>
        <span className="ml-auto hidden sm:inline">
          Passe o mouse sobre o cabeçalho para ver a fórmula · Clique para ordenar
        </span>
      </div>

      {/* ── Tabela ───────────────────────────────────── */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full data-table">
          <thead className="bg-gray-50 dark:bg-slate-900/50 sticky top-0 z-10 border-b border-gray-100 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 w-10">
                <button
                  onClick={toggleAll}
                  className="flex items-center justify-center text-gray-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {allPageSelected
                    ? <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    : <Square className="w-4 h-4" />}
                </button>
              </th>
              {cols.map(c => (
                <SortableHeader
                  key={c.key}
                  label={c.label}
                  title={c.title}
                  colKey={c.key}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                  align={c.align}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={cols.length + 1} className="text-center py-16 text-gray-400 dark:text-slate-600 text-base">
                    {(placaSearch || transportadorSearch) ? 'Nenhum resultado para os filtros aplicados' : 'Nenhum registro encontrado'}
                  </td>
                </tr>
              ) : (
                paged.map((r, i) => {
                  const isSelected = selected.has(r.id);
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12, delay: i * 0.006 }}
                      onClick={() => toggleRow(r.id)}
                      className={cn(
                        'cursor-pointer transition-colors border-b border-gray-50 dark:border-slate-800/40 last:border-0',
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800/40',
                      )}
                    >
                      <td className="px-4 py-3 w-10" onClick={e => { e.stopPropagation(); toggleRow(r.id); }}>
                        <div className="flex items-center justify-center text-gray-400 dark:text-slate-500">
                          {isSelected
                            ? <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            : <Square className="w-4 h-4" />}
                        </div>
                      </td>
                      {cols.map(c => (
                        <td
                          key={c.key}
                          className={cn('px-3 py-3', c.align === 'right' ? 'text-right' : 'text-left')}
                        >
                          {c.render(r)}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* ── Paginação ────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-slate-800/50 text-sm text-gray-400 dark:text-slate-500">
          <span>
            Exibindo {(page * PAGE_SIZE + 1).toLocaleString('pt-BR')}–{Math.min((page + 1) * PAGE_SIZE, sorted.length).toLocaleString('pt-BR')} de {sorted.length.toLocaleString('pt-BR')}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-600 dark:text-slate-300"
            >
              ←
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7
                ? i
                : page < 4
                  ? i
                  : page > totalPages - 4
                    ? totalPages - 7 + i
                    : page - 3 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border transition-all min-w-[32px]',
                    p === page
                      ? 'bg-blue-600 border-blue-500 text-white font-bold'
                      : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400',
                  )}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              disabled={page === totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-gray-600 dark:text-slate-300"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
