import { useState } from 'react';
import { Save, Plus, Trash2, Settings2, Trophy } from 'lucide-react';
import { useApp } from '../AppContext';
import { SLAConfig, OperationType, KPI_OPTIONS, RankingConfig, RankingMetrica } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function SLAConfigEditor() {
  const { slas, setSlas, rankingConfig, setRankingConfig } = useApp();
  const [localSlas, setLocalSlas] = useState<SLAConfig[]>(slas);
  const [localRanking, setLocalRanking] = useState<RankingConfig>(rankingConfig);

  const handleSave = () => {
    setSlas(localSlas);
    setRankingConfig(localRanking);
    alert('Configurações salvas com sucesso!');
  };

  const updateSla = (id: string, field: keyof SLAConfig, value: any) => {
    setLocalSlas(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSla = (id: string) => {
    setLocalSlas(prev => prev.filter(s => s.id !== id));
  };

  const addSla = () => {
    const newSla: SLAConfig = {
      id: Math.random().toString(36).substr(2, 9),
      etapa: KPI_OPTIONS[0].etapa,
      tipoOperacao: 'EXTERNA',
      filial: 'TODAS',
      horas: 1,
    };
    setLocalSlas([...localSlas, newSla]);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-gray-900 dark:text-bento-text-primary">
            <Settings2 className="w-6 h-6 text-bento-accent" />
            Configuração de SLAs
          </h2>
          <p className="text-gray-500 dark:text-bento-text-secondary">
            Defina o tempo limite para cada KPI do processo.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={addSla}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-bento-card border border-transparent dark:border-bento-border hover:bg-zinc-200 dark:hover:bg-bento-border/50 rounded-lg font-medium transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Novo SLA
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-bento-accent hover:opacity-90 text-bento-bg rounded-lg font-bold shadow-lg shadow-bento-accent/20 transition-all text-sm"
          >
            <Save className="w-4 h-4" /> Salvar Alterações
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {localSlas.map((sla, idx) => (
          <motion.div
            key={sla.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bento-grid-card flex items-center gap-4 bg-white dark:bg-bento-card"
          >
            <div className="flex-1 grid md:grid-cols-4 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-bento-text-secondary uppercase tracking-widest mb-1 block">KPI / Etapa</label>
                <select
                  value={sla.etapa}
                  onChange={(e) => updateSla(sla.id, 'etapa', e.target.value)}
                  className="w-full bg-transparent border-b border-gray-200 dark:border-bento-border focus:border-bento-accent outline-none pb-1 transition-colors text-sm dark:text-bento-text-primary dark:bg-bento-card"
                >
                  {KPI_OPTIONS.map(opt => (
                    <option key={opt.campo} value={opt.etapa} className="dark:bg-bento-bg">
                      {opt.etapa}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-bento-text-secondary uppercase tracking-widest mb-1 block">Tipo de Operação</label>
                <select
                  value={sla.tipoOperacao}
                  onChange={(e) => updateSla(sla.id, 'tipoOperacao', e.target.value as OperationType)}
                  className="w-full bg-transparent border-b border-gray-200 dark:border-bento-border focus:border-bento-accent outline-none pb-1 transition-colors text-sm dark:text-bento-text-primary dark:bg-bento-card"
                >
                  <option className="dark:bg-bento-bg" value="EXTERNA">EXTERNA</option>
                  <option className="dark:bg-bento-bg" value="ABASTECIMENTO">ABASTECIMENTO</option>
                  <option className="dark:bg-bento-bg" value="ATACAREJO">ATACAREJO</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-bento-text-secondary uppercase tracking-widest mb-1 block">Filial (ou TODAS)</label>
                <input
                  type="text"
                  value={sla.filial}
                  onChange={(e) => updateSla(sla.id, 'filial', e.target.value)}
                  className="w-full bg-transparent border-b border-gray-200 dark:border-bento-border focus:border-bento-accent outline-none pb-1 transition-colors text-sm dark:text-bento-text-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-bento-text-secondary uppercase tracking-widest mb-1 block">SLA (Horas)</label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={sla.horas}
                  onChange={(e) => updateSla(sla.id, 'horas', parseFloat(e.target.value))}
                  className="w-full bg-transparent border-b border-gray-200 dark:border-bento-border focus:border-bento-accent outline-none pb-1 transition-colors text-sm font-mono dark:text-bento-text-primary"
                />
              </div>
            </div>
            <button
              onClick={() => removeSla(sla.id)}
              className="p-2 text-bento-error hover:bg-bento-error/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </motion.div>
        ))}
      </div>

      <div className="bento-grid-card bg-white dark:bg-bento-card space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-bento-accent" />
          <h3 className="text-base font-bold text-gray-900 dark:text-bento-text-primary">Parâmetros de Ranking — Top Placas</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-bento-text-secondary">
          Define qual KPI e quantas placas são exibidas no card "Top Placas" do painel principal.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="text-[10px] font-bold text-gray-400 dark:text-bento-text-secondary uppercase tracking-widest mb-2 block">Métrica de Ordenação</label>
            <select
              value={localRanking.metrica}
              onChange={(e) => setLocalRanking(r => ({ ...r, metrica: e.target.value as RankingMetrica }))}
              className="w-full bg-transparent border-b border-gray-200 dark:border-bento-border focus:border-bento-accent outline-none pb-1 transition-colors text-sm dark:text-bento-text-primary dark:bg-bento-card"
            >
              {KPI_OPTIONS.map(opt => (
                <option key={opt.campo} value={opt.campo} className="dark:bg-bento-bg">
                  {opt.etapa}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 dark:text-bento-text-secondary uppercase tracking-widest mb-2 block">Exibir</label>
            <div className="flex gap-2">
              {(['piores', 'melhores'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setLocalRanking(r => ({ ...r, ordem: opt }))}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-colors',
                    localRanking.ordem === opt
                      ? 'bg-bento-accent text-bento-bg border-bento-accent'
                      : 'bg-transparent border-gray-200 dark:border-bento-border text-gray-500 dark:text-bento-text-secondary hover:border-bento-accent',
                  )}
                >
                  {opt === 'piores' ? 'Piores' : 'Melhores'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 dark:text-bento-text-secondary uppercase tracking-widest mb-2 block">Quantidade de Placas</label>
            <input
              type="number"
              min={1}
              max={100}
              value={localRanking.topN}
              onChange={(e) => setLocalRanking(r => ({ ...r, topN: Math.max(1, parseInt(e.target.value) || 1) }))}
              className="w-full bg-transparent border-b border-gray-200 dark:border-bento-border focus:border-bento-accent outline-none pb-1 transition-colors text-sm font-mono dark:text-bento-text-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
