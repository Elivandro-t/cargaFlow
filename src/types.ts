/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OperationType = 'EXTERNA' | 'ABASTECIMENTO' | 'ATACAREJO';

export interface SLAConfig {
  id: string;
  etapa: string;
  tipoOperacao: OperationType;
  filial: string; // 'TODAS' or specific code
  horas: number;
}

export interface RawData {
  FILIAL?: string;
  MOTORISTA?: string;
  TIPO?: string | number;
  TIPO_CONHECIMENTO?: string | number;
  PLACA?: string;
  CP04_PLACA_VEICULO?: string;
  CP04_NOME_MOTORISTA?: string;
  AGENDA_CRIACAO?: string;
  CRIACAO_CONHECIMENTO?: string;
  PESO_INICIAL?: string;
  INICIO_CARREGAMENTO?: string;
  FIM_CARREGAMENTO?: string;
  PESO_FINAL?: string;
  INICIO_ACERTO?: string;
  FINAL_ACERTO?: string;
  SAIDA?: string;
  // Abastecimento specific
  CP29B_DT_CHECKIN?: string;
  CP29B_DT_CHECKOUT?: string;
}

export interface OperationRecord {
  id: string;
  filial_codigo: string;
  filial_nome: string;
  motorista_id: string;
  motorista_nome: string;
  tipo: OperationType;
  placa: string;
  data_operacao: string; // YYYY-MM-DD

  // Timestamps (ISO or null)
  agenda: number | null;
  criacao: number | null;
  peso_inicial: number | null;
  inicio_carregamento: number | null;
  fim_carregamento: number | null;
  peso_final: number | null;
  inicio_acerto: number | null;
  final_acerto: number | null;
  saida: number | null;
  chegada_cd: number | null;
  inicio_devolucao: number | null;
  final_devolucao: number | null;

  // Calculated Lead Times (in minutes)
  lt_espera_doca: number | null;
  lt_carregamento: number | null;
  lt_fora_cd: number | null;
  lt_rota: number | null;
  lt_acerto: number | null;
  lt_total: number | null;
  lt_loja: number | null;
  lt_total_cd_loja: number | null;

  // Gestão à Vista KPIs
  lt_patio_pos_liberacao: number | null; // SAIDA - PESO_FINAL (transportador)
  lt_retorno_fisico: number | null;      // INICIO_DEVOLUCAO → FINAL_DEVOLUCAO (devolução física)
  lt_retorno_total: number | null;       // CHEGADA_CD → FINAL_ACERTO (ciclo completo de retorno)
}

export interface ImportStats {
  total: number;
  valid: number;
  discarded: number;
  reasons: {
    criticalNull: number;
    temporalOrder: number;
    negativeTime: number;
  };
}

export interface MetricSummary {
  label: string;
  value: string;
  trend?: number;
  status?: 'success' | 'warning' | 'error';
}

export type RankingMetrica =
  | 'lt_patio_pos_liberacao'
  | 'lt_total'
  | 'lt_espera_doca'
  | 'lt_carregamento'
  | 'lt_rota'
  | 'lt_retorno_fisico'
  | 'lt_acerto'
  | 'lt_retorno_total';

export interface RankingConfig {
  metrica: RankingMetrica;
  ordem: 'piores' | 'melhores';
  topN: number;
}

// Mapeamento canônico KPI → campo do OperationRecord
export const KPI_OPTIONS: { etapa: string; campo: RankingMetrica; descricao: string }[] = [
  { etapa: 'Ciclo Completo',          campo: 'lt_total',               descricao: 'peso_INICIAL → final_ACERTO' },
  { etapa: 'Espera Doca',             campo: 'lt_espera_doca',         descricao: 'peso_INICIAL → inicio_CARREGAMENTO' },
  { etapa: 'Tempo de Carregamento',   campo: 'lt_carregamento',        descricao: 'inicio_CARREGAMENTO → final_CARREGAMENTO' },
  { etapa: 'Pátio Pós-Pesagem Final', campo: 'lt_patio_pos_liberacao', descricao: 'peso_FINAL → saida' },
  { etapa: 'Tempo em Rota',           campo: 'lt_rota',                descricao: 'saida → chegada_CD' },
  { etapa: 'Devolução',               campo: 'lt_retorno_fisico',      descricao: 'chegada_CD → inicio_ACERTO' },
  { etapa: 'Acerto de Carga',         campo: 'lt_acerto',              descricao: 'inicio_ACERTO → final_ACERTO' },
  { etapa: 'Retorno + Acerto Total',  campo: 'lt_retorno_total',       descricao: 'chegada_CD → final_ACERTO' },
];
