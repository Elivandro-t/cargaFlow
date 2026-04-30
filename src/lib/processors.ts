import { parse } from 'date-fns';
import { OperationRecord, RawData, OperationType, ImportStats } from '../types';

export function normalizeFilial(raw: string): { codigo: string; nome: string } {
  const parts = raw.split(' - ');
  const codigo = parts[0]?.trim() || 'Desconhecido';
  const nome = parts[parts.length - 1]?.trim() || 'Desconhecido';
  return { codigo, nome };
}

export function normalizeMotorista(raw: string): { id: string; nome: string } {
  const parts = raw.split(' - ');
  const id = parts[0]?.trim() || 'Desconhecido';
  const nome = parts[1]?.trim() || 'Desconhecido';
  return { id, nome };
}

export function normalizePlaca(raw: string): string {
  return raw.replace(/-/g, '').toUpperCase();
}

function parseDate(val: string | undefined): number | null {
  if (!val || val === 'null' || val === '') return null;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.getTime();
  } catch {
    return null;
  }
}

// Ensure chronology: array of timestamps should be strictly increasing (if present)
function isChronological(dates: (number | null)[]): boolean {
  let lastVal: number | null = null;
  for (const d of dates) {
    if (d !== null) {
      if (lastVal !== null && lastVal > d) return false;
      lastVal = d;
    }
  }
  return true;
}

export function processRawData(data: RawData[]): { records: OperationRecord[], stats: ImportStats } {
  const stats: ImportStats = {
    total: data.length,
    valid: 0,
    discarded: 0,
    reasons: { criticalNull: 0, temporalOrder: 0, negativeTime: 0 }
  };

  const records = data.map((row, idx): OperationRecord | null => {
    const rawPlaca = row.CP04_PLACA_VEICULO || row.PLACA || '';
    const placa = normalizePlaca(rawPlaca);
    if (!placa || placa === 'NULL' || placa === 'Desconhecido') {
      stats.discarded++;
      // Not strictly one of requested reasons, but invalid entity
      return null; 
    }

    let rawFilial = row.FILIAL || '';
    if (!rawFilial) {
      const filialKey = Object.keys(row).find(k => 
        k.toUpperCase().includes('FILIAL') || 
        k.toUpperCase() === 'CD_ORIGEM' || 
        k.toUpperCase() === 'CD' ||
        k.toUpperCase() === 'UNIDADE' ||
        k.toUpperCase() === 'LOCAL'
      );
      if (filialKey) rawFilial = row[filialKey as keyof RawData] as string;
    }
    const { codigo: fCode, nome: fName } = normalizeFilial(rawFilial || '');
    
    let rawMotorista = row.MOTORISTA || '';
    if (!rawMotorista || !rawMotorista.includes('-')) {
      if (row.CP04_NOME_MOTORISTA && row.MOTORISTA) {
        rawMotorista = `${row.MOTORISTA} - ${row.CP04_NOME_MOTORISTA}`;
      } else {
        rawMotorista = row.CP04_NOME_MOTORISTA || row.MOTORISTA || '';
      }
    }
    const { id: mId, nome: mName } = normalizeMotorista(rawMotorista);
    
    let tipo: OperationType = 'EXTERNA';
    const rawTipo = String(row.TIPO_CONHECIMENTO || row.TIPO || '').toUpperCase();
    if (rawTipo.startsWith('8') || rawTipo.includes('ABASTECIMENTO')) {
      tipo = 'ABASTECIMENTO';
    } else if (rawTipo.startsWith('23') || rawTipo.includes('ATACAREJO')) {
      tipo = 'ATACAREJO';
    } else if (rawTipo.startsWith('7') || rawTipo.includes('EXTERNO')) {
      tipo = 'EXTERNA';
    }

    const isAbastOrAtac = tipo === 'ABASTECIMENTO' || tipo === 'ATACAREJO';

    // Parse Dates
    const agenda = parseDate(row.AGENDA_CRIACAO);
    const criacao = parseDate(row.CRIACAO_CONHECIMENTO);
    const peso_inicial = parseDate(row.PESO_INICIAL);
    const inicio_carregamento = parseDate(row.INICIO_CARREGAMENTO);
    const fim_carregamento = parseDate(row.FIM_CARREGAMENTO);
    const peso_final = parseDate(row.PESO_FINAL);
    const saida = parseDate(row.SAIDA);
    
    const getVal = (possibleKeys: string[]) => {
      const foundKey = Object.keys(row).find(k => 
        possibleKeys.some(pk => k.toUpperCase().replace(/[^A-Z0-9]/g, '') === pk.toUpperCase().replace(/[^A-Z0-9]/g, ''))
      );
      return foundKey ? row[foundKey as keyof RawData] as string : undefined;
    };

    const checkin = parseDate(getVal(['CP29B_DT_CHECKIN', 'CP29BDTCHECKIN', 'DTCHECKIN']));
    const checkout = parseDate(getVal(['CP29B_DT_CHECKOUT', 'CP29BDTCHECKOUT', 'DTCHECKOUT']));
    const inicio_acerto = parseDate(getVal(['INICIO_ACERTO', 'INICIOACERTO']));
    const final_acerto = parseDate(getVal(['FINAL_ACERTO', 'FINALACERTO']));

    // RULE 1: Chronological Check
    const isExternaChronological = !isAbastOrAtac ? isChronological([
      agenda, criacao, peso_inicial, inicio_carregamento, fim_carregamento, peso_final, saida, inicio_acerto, final_acerto
    ]) : true;

    const isLojaChronological = isAbastOrAtac ? isChronological([
      criacao, peso_inicial, inicio_carregamento, fim_carregamento, peso_final, checkin, checkout
    ]) : true;

    if (!isExternaChronological || !isLojaChronological) {
      stats.discarded++;
      stats.reasons.temporalOrder++;
      return null;
    }

    // RULE 2 & 4: Critical Fields and Main Starts/Ends
    let inicio_externa = peso_inicial ?? inicio_carregamento ?? criacao;
    if (!isAbastOrAtac) {
      if (!inicio_externa || !final_acerto) {
        stats.discarded++;
        stats.reasons.criticalNull++;
        return null; // Missing critical for Externa
      }
    } else {
      if (!checkin || !checkout) {
        stats.discarded++;
        stats.reasons.criticalNull++;
        return null; // Missing critical for Loja
      }
    }

    // Calculations (minutes) ignores negative output (null returned)
    const diff = (start: number | null, end: number | null) => {
      if (!start || !end) return null;
      const res = (end - start) / 60000;
      return res < 0 ? null : res;
    };

    // RULE 5: Micro-Times
    let lt_espera_doca = null;
    let lt_carregamento = null;
    let lt_fora_cd = null; // Tempo Fora CD
    let lt_acerto = null;
    let lt_loja = null;
    let lt_total_cd_loja = null;

    if (!isAbastOrAtac) {
      lt_espera_doca = diff(peso_inicial, inicio_carregamento);
      lt_carregamento = diff(inicio_carregamento, fim_carregamento);
      lt_fora_cd = diff(fim_carregamento, saida); // Tempo fora do CD: SAIDA - FINAL_CARREGAMENTO
      lt_acerto = diff(inicio_acerto, final_acerto);
    } else {
      lt_carregamento = diff(inicio_carregamento, fim_carregamento);
      lt_loja = diff(checkin, checkout);
      lt_total_cd_loja = diff(inicio_carregamento, checkout);
    }

    // RULE 4 & 6: Lead Time Total & Negative checks
    let lt_total: number | null = null;
    
    if (isAbastOrAtac) {
      lt_total = diff(checkin, checkout);
    } else {
      lt_total = diff(inicio_externa, final_acerto);
    }

    // If main Lead Time Total is negative or null (meaning calculation failed negative check)
    if (lt_total === null) {
      stats.discarded++;
      stats.reasons.negativeTime++;
      return null;
    }

    // Determine Data for graphs
    let data_operacao = 'N/A';
    if (inicio_externa && !isAbastOrAtac) {
      data_operacao = new Date(inicio_externa).toISOString().split('T')[0];
    } else if (checkin && isAbastOrAtac) {
      data_operacao = new Date(checkin).toISOString().split('T')[0];
    } else if (agenda) {
      data_operacao = new Date(agenda).toISOString().split('T')[0];
    }

    stats.valid++;

    return {
      id: `${placa}-${idx}-${tipo}`,
      filial_codigo: fCode,
      filial_nome: fName,
      motorista_id: mId,
      motorista_nome: mName,
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
      chegada_cd: null,
      inicio_devolucao: null,
      final_devolucao: null,
      lt_espera_doca,
      lt_carregamento,
      lt_fora_cd,
      lt_rota: null,
      lt_acerto,
      lt_loja,
      lt_total_cd_loja,
      lt_total,
      lt_patio_pos_liberacao: diff(peso_final, saida),
      lt_retorno_fisico: null,
      lt_retorno_total: null,
    };
  }).filter((r): r is OperationRecord => r !== null);

  console.log('--- LOG DE QUALIDADE DE DADOS ---');
  console.log(`Total de linhas processadas: ${stats.total}`);
  console.log(`Linhas válidas: ${stats.valid}`);
  console.log(`Linhas descartadas: ${stats.discarded}`);
  console.log(` - Motivo: Campos Críticos Nulos: ${stats.reasons.criticalNull}`);
  console.log(` - Motivo: Ordem Temporal Inválida: ${stats.reasons.temporalOrder}`);
  console.log(` - Motivo: Lead Time Negativo: ${stats.reasons.negativeTime}`);
  console.log('---------------------------------');

  return { records, stats };
}

export function formatMinutes(mins: number | null): string {
  if (mins === null || isNaN(mins)) return '--:--';
  const totalHours = Math.floor(mins / 60);
  const m = Math.floor(mins % 60);

  if (totalHours >= 24) {
    const d = Math.floor(totalHours / 24);
    const h = totalHours % 24;
    return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  }

  return `${String(totalHours).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}
