import React, { createContext, useContext, useState, useEffect } from 'react';
import { OperationRecord, OperationType, SLAConfig, RankingConfig } from './types';
import { ConhecimentoApi } from './api/services';
interface AppContextType {
  data: OperationRecord[];
  slas: SLAConfig[];
  setSlas: (slas: SLAConfig[]) => void;
  rankingConfig: RankingConfig;
  setRankingConfig: (cfg: RankingConfig) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  filialFilter: string;
  setFilialFilter: (filial: string) => void;
  filiais: { codigo: string; nome: string }[];
  loading: boolean;
  error: string | null;
  setPlaca:(any)=>void;
  placa:string|null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SLAS: SLAConfig[] = [
  { id: '1', etapa: 'Ciclo Completo',          tipoOperacao: 'EXTERNA',       filial: 'TODAS', horas: 6  },
  { id: '2', etapa: 'Espera Doca',             tipoOperacao: 'EXTERNA',       filial: 'TODAS', horas: 1  },
  { id: '3', etapa: 'Tempo de Carregamento',   tipoOperacao: 'EXTERNA',       filial: 'TODAS', horas: 1  },
  { id: '4', etapa: 'Pátio Pós-Pesagem Final', tipoOperacao: 'EXTERNA',       filial: 'TODAS', horas: 2  },
  { id: '5', etapa: 'Tempo em Rota',           tipoOperacao: 'EXTERNA',       filial: 'TODAS', horas: 24 },
  { id: '6', etapa: 'Devolução',               tipoOperacao: 'EXTERNA',       filial: 'TODAS', horas: 3  },
  { id: '7', etapa: 'Acerto de Carga',         tipoOperacao: 'EXTERNA',       filial: 'TODAS', horas: 1  },
  { id: '8', etapa: 'Retorno + Acerto Total',  tipoOperacao: 'EXTERNA',       filial: 'TODAS', horas: 4  },
];

const DEFAULT_RANKING: RankingConfig = {
  metrica: 'lt_patio_pos_liberacao',
  ordem:   'piores',
  topN:    20,
};

function splitCodeName(raw: string): { codigo: string; nome: string } {
  if (!raw) return { codigo: '?', nome: '?' };
  const parts = raw.split(' - ');
  return {
    codigo: parts[0]?.trim() || '?',
    nome: parts.slice(1).join(' - ').trim() || parts[0] || '?',
  };
}

function parseDate(val: any): number | null {
  if (!val || typeof val !== 'string') return null;
  if (val === 'null' || val.includes('Não houve')) return null;
  const t = new Date(val).getTime();
  return isNaN(t) ? null : t;
}

function detectTipo(raw: any): OperationType {
  const s = String(raw || '').toUpperCase();
  if (s.startsWith('8') || s.includes('ABASTECIMENTO')) return 'ABASTECIMENTO';
  if (s.startsWith('23') || s.includes('ATACAREJO')) return 'ATACAREJO';
  return 'EXTERNA';
}

function diff(start: number | null, end: number | null): number | null {
  if (!start || !end) return null;
  const d = (end - start) / 60000;
  return d < 0 ? null : d;
}

// Busca um campo por nome, tentando variações de capitalização/underscores
function flexField(item: any, ...names: string[]): string | undefined {
  const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const keys = Object.keys(item);
  for (const name of names) {
    const n = norm(name);
    const found = keys.find(k => norm(k) === n);
    if (found !== undefined && item[found] !== null && item[found] !== '' && item[found] !== 'null') {
      return String(item[found]);
    }
  }
  return undefined;
}

function mapApiItem(item: any, idx: number): OperationRecord | null {
  // Diagnóstico: loga os campos do primeiro item para identificar o schema da API
  if (idx === 0) {
    console.log('[CargaFlow] Schema da API — campos do primeiro item:', Object.keys(item));
    console.log('[CargaFlow] Timestamps de carregamento:', {
      peso_INICIAL:        item.peso_INICIAL,
      inicio_CARREGAMENTO: item.inicio_CARREGAMENTO,
      final_CARREGAMENTO:  item.final_CARREGAMENTO,
      peso_FINAL:          item.peso_FINAL,
      saida:               item.saida,
      chegada_CD:          item.chegada_CD,
      inicio_DEVOLUCAO:    item.inicio_DEVOLUCAO,
      final_DEVOLUCAO:     item.final_DEVOLUCAO,
      inicio_ACERTO:       item.inicio_ACERTO,
      final_ACERTO:        item.final_ACERTO,
    });
  }

  const placa = String(item.cp04_PLACA_VEICULO || '').replace(/-/g, '').toUpperCase();
  if (!placa) return null;

  const filial    = splitCodeName(item.filial    || '');
  const motorista = splitCodeName(item.motorista || '');
  const tipo      = detectTipo(item.tipo_CONHECIMENTO);
  const isAbast   = tipo === 'ABASTECIMENTO' || tipo === 'ATACAREJO';

  const agenda = parseDate(item.agenda_CRIACAO);
  const criacao = parseDate(item.criacao_CONHECIMENTO);

  // Usa flexField para tentar múltiplos nomes de campo (API pode variar convenções)
  const peso_inicial        = parseDate(flexField(item, 'peso_INICIAL',        'pesoInicial',        'PESO_INICIAL'));
  const inicio_carregamento = parseDate(flexField(item, 'inicio_CARREGAMENTO', 'inicioCarregamento', 'INICIO_CARREGAMENTO'));
  const fim_carregamento    = parseDate(flexField(item, 'final_CARREGAMENTO',  'fim_CARREGAMENTO',   'fimCarregamento',
                                                        'finalCarregamento',   'FIM_CARREGAMENTO',   'FINAL_CARREGAMENTO'));
  const chegada_cd          = parseDate(flexField(item, 'chegada_CD',          'chegadaCD',          'CHEGADA_CD', 'chegadaCd', 'chegada', 'CHEGADA', 'dt_chegada', 'DT_CHEGADA'));

  const peso_final       = parseDate(flexField(item, 'peso_FINAL',       'pesoFinal',       'PESO_FINAL'));
  const saida            = parseDate(flexField(item, 'saida',            'SAIDA'));
  const inicio_acerto    = parseDate(flexField(item, 'inicio_ACERTO',    'inicioAcerto',    'INICIO_ACERTO',    'inicio_acerto',    'INICIOACERTO'));
  const final_acerto     = parseDate(flexField(item, 'final_ACERTO',     'finalAcerto',     'FINAL_ACERTO',     'fim_ACERTO',       'FIM_ACERTO'));
  const inicio_devolucao = parseDate(flexField(item, 'inicio_DEVOLUCAO', 'inicioDevolucao', 'INICIO_DEVOLUCAO', 'inicio_devolucao', 'INICIODEVOLUCAO'));
  const final_devolucao  = parseDate(flexField(item, 'final_DEVOLUCAO',  'finalDevolucao',  'FINAL_DEVOLUCAO',  'fim_DEVOLUCAO',    'FIM_DEVOLUCAO'));

  const inicio_externa = peso_inicial ?? inicio_carregamento ?? criacao;
  const lt_total = isAbast
    ? diff(inicio_carregamento, chegada_cd)
    : diff(inicio_externa, final_acerto);

  let data_operacao = 'N/A';
  const anchor = inicio_externa || agenda || criacao;
  if (anchor) data_operacao = new Date(anchor).toISOString().split('T')[0];

  return {
    id: String(item.conhecimento || `${placa}-${idx}`),
    filial_codigo: filial.codigo,
    filial_nome: filial.nome,
    motorista_id: motorista.codigo,
    motorista_nome: motorista.nome,
    tipo,
    placa,
    data_operacao,
    agenda,
    criacao,
    peso_inicial,
    inicio_carregamento,
    fim_carregamento,
    peso_final,
    inicio_acerto,
    final_acerto,
    saida,
    chegada_cd,
    inicio_devolucao,
    final_devolucao,
    lt_espera_doca: diff(peso_inicial, inicio_carregamento),
    lt_carregamento: diff(inicio_carregamento, fim_carregamento),
    lt_fora_cd: diff(fim_carregamento, saida),
    lt_rota: diff(saida, chegada_cd),
    lt_acerto: diff(inicio_acerto, final_acerto),
    lt_total,
    lt_loja: isAbast ? diff(saida, chegada_cd) : null,
    lt_total_cd_loja: isAbast ? diff(inicio_carregamento, chegada_cd) : null,
    lt_patio_pos_liberacao: diff(peso_final, saida),
    lt_retorno_fisico: diff(inicio_devolucao, final_devolucao),
    lt_retorno_total: diff(chegada_cd, final_acerto),
  };
}

const API_BASE = ConhecimentoApi

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OperationRecord[]>([]);
 
   const [filialFilter, setFilialFilter] = useState<string>('');
  const [filiais, setFiliais] = useState<{ codigo: string; nome: string }[]>([]);
    const [placa, setPlaca] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [slas, setSlas] = useState<SLAConfig[]>(() => {
    const saved = localStorage.getItem('cargo-flow-slas');
    return saved ? JSON.parse(saved) : DEFAULT_SLAS;
  });
  const [rankingConfig, setRankingConfig] = useState<RankingConfig>(() => {
    const saved = localStorage.getItem('cargo-flow-ranking');
    return saved ? JSON.parse(saved) : DEFAULT_RANKING;
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('cargo-flow-theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const fetchRecords = async (filial: string) => {
    setLoading(true);
    try {
      const res = await API_BASE.list(encodeURIComponent(filial),placa);
      // if (!res.) {
      //   const msg = `HTTP ${res.status} ${res.statusText}`;
      //   console.log(res)
      //   console.warn('[CargaFlow]', msg);
      //   setError(msg);
      //   return;
      // }
      const content: any[] = res?.page?.content || res?.content || (Array.isArray(res) ? res : []);
      console.log(`[CargaFlow] recebidos ${content.length} registros da API`);

      const records = content
        .map((item, i) => mapApiItem(item, i))
        .filter((r): r is OperationRecord => r !== null);

      console.log(`[CargaFlow] mapeados ${records.length} registros válidos`);

      setData(records);
      setError(null);

      if (!filial) {
        const seen = new Map<string, string>();
        records.forEach(r => {
          if (!seen.has(r.filial_codigo)) seen.set(r.filial_codigo, r.filial_nome);
        });
        const list = Array.from(seen.entries()).map(([codigo, nome]) => ({ codigo, nome }));
        list.sort((a, b) => a.codigo.localeCompare(b.codigo));
        setFiliais(list);
      }
    } catch (err: any) {
      console.error('[CargaFlow] falha no fetch:', err);
      setError(err?.message || 'Backend inacessível');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(filialFilter);
    const interval = setInterval(() => fetchRecords(filialFilter), 10000);
    return () => clearInterval(interval);
  }, [filialFilter]);

  useEffect(() => {
    localStorage.setItem('cargo-flow-slas', JSON.stringify(slas));
  }, [slas]);

  useEffect(() => {
    localStorage.setItem('cargo-flow-ranking', JSON.stringify(rankingConfig));
  }, [rankingConfig]);

  useEffect(() => {
    localStorage.setItem('cargo-flow-theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <AppContext.Provider value={{ data, slas, setSlas, rankingConfig, setRankingConfig, darkMode, setDarkMode, filialFilter, setFilialFilter, filiais, loading, error,placa,setPlaca }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
