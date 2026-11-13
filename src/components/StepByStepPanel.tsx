import { BookOpenCheck, Check, Copy } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { ActiveRoute } from './HomeView';

export interface StepSectionData {
  dados: ReactNode;
  metodo: ReactNode;
  formula: ReactNode;
  substituicao: ReactNode;
  desenvolvimento: ReactNode;
  resultadoFinal: ReactNode;
  plainTextSummary: string;
}

interface StepByStepPanelProps {
  data: StepSectionData;
  theme?: Exclude<ActiveRoute, 'home'>;
}

const THEME_ACCENTS: Record<
  Exclude<ActiveRoute, 'home'>,
  {
    headerBg: string;
    iconBg: string;
    badgeGradient: string;
    borderAccent: string;
  }
> = {
  ode: {
    headerBg: 'bg-gradient-to-r from-[#e6f1ff]/80 via-[#f4f8ff] to-[#dff8fc]/60',
    iconBg: 'bg-gradient-to-br from-[#2457e8] to-[#24b8d5] text-white',
    badgeGradient: 'bg-gradient-to-br from-[#2457e8] to-[#24b8d5]',
    borderAccent: 'border-[#2457e8]/20',
  },
  'least-squares': {
    headerBg: 'bg-gradient-to-r from-[#eee9ff]/85 via-[#f7f5ff] to-[#e6f1ff]/60',
    iconBg: 'bg-gradient-to-br from-[#7955d9] to-[#2457e8] text-white',
    badgeGradient: 'bg-gradient-to-br from-[#7955d9] to-[#2457e8]',
    borderAccent: 'border-[#7955d9]/20',
  },
  integration: {
    headerBg: 'bg-gradient-to-r from-[#e6f1ff]/80 via-[#eef9fc] to-[#d9f5fa]/70',
    iconBg: 'bg-gradient-to-br from-[#14264b] via-[#2457e8] to-[#24b8d5] text-white',
    badgeGradient: 'bg-gradient-to-br from-[#14264b] to-[#24b8d5]',
    borderAccent: 'border-[#24b8d5]/30',
  },
};

export function StepByStepPanel({ data, theme = 'ode' }: StepByStepPanelProps) {
  const [copied, setCopied] = useState(false);
  const accent = THEME_ACCENTS[theme];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.plainTextSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const area = document.createElement('textarea');
      area.value = data.plainTextSummary;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const steps: { num: string; title: string; content: ReactNode }[] = [
    { num: '01', title: 'Identificação dos dados fornecidos', content: data.dados },
    { num: '02', title: 'Identificação do método escolhido', content: data.metodo },
    { num: '03', title: 'Fórmula utilizada', content: data.formula },
    { num: '04', title: 'Substituição dos valores na fórmula', content: data.substituicao },
    { num: '05', title: 'Desenvolvimento dos cálculos intermediários', content: data.desenvolvimento },
    { num: '06', title: 'Resultado final', content: data.resultadoFinal },
  ];

  return (
    <section
      aria-label="Resolução passo a passo"
      className={`bg-white border ${accent.borderAccent} rounded-2xl overflow-hidden shadow-sm`}
    >
      <div className={`${accent.headerBg} px-6 sm:px-8 py-5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-xl ${accent.iconBg} flex items-center justify-center shrink-0 shadow-xs mt-0.5`}>
            <BookOpenCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#14264b]">
              Resolução passo a passo
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Memorial descritivo completo com equações, substituições e etapas intermediárias.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-300 bg-white text-[#14264b] hover:bg-[#e6f1ff] hover:border-[#2457e8]/40 active:scale-[0.98] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-[#2457e8]" />
              <span>Copiar resultados</span>
            </>
          )}
        </button>
      </div>

      <ol className="divide-y divide-slate-200/75 px-6 sm:px-8 py-2">
        {steps.map((step, idx) => (
          <li
            key={step.num}
            className={
              idx === 0
                ? 'pt-5 pb-6'
                : idx === steps.length - 1
                ? 'pt-6 pb-6'
                : 'py-6'
            }
          >
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`w-8 h-8 rounded-xl ${accent.badgeGradient} text-white font-mono text-xs font-bold tabular-nums inline-flex items-center justify-center shrink-0 shadow-xs`}
              >
                {step.num}
              </span>
              <h4 className="font-display text-base font-bold text-[#14264b]">{step.title}</h4>
            </div>
            <div className="pl-11 text-sm sm:text-[15px] leading-relaxed text-slate-700">
              {step.content}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
