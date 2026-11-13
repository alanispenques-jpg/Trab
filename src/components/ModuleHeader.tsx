import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ActiveRoute } from './HomeView';

interface ModuleHeaderProps {
  moduleNumber: string;
  subtitleTag: string;
  title: string;
  description: string;
  icon: ReactNode;
  activeModule: Exclude<ActiveRoute, 'home'>;
  decimals: number;
  onDecimalsChange: (d: number) => void;
  onBackHome: () => void;
  onSwitchModule?: (route: Exclude<ActiveRoute, 'home'>) => void;
}

const MODULE_LINKS: { id: Exclude<ActiveRoute, 'home'>; label: string }[] = [
  { id: 'ode', label: '01 · EDOs' },
  { id: 'least-squares', label: '02 · Mínimos Quadrados' },
  { id: 'integration', label: '03 · Integração Numérica' },
];

const HEADER_GRADIENTS: Record<Exclude<ActiveRoute, 'home'>, string> = {
  ode: 'from-[#14264b] via-[#2457e8] to-[#24b8d5]',
  'least-squares': 'from-[#14264b] via-[#5a3cc8] to-[#7955d9]',
  integration: 'from-[#14264b] via-[#1c64d2] to-[#24b8d5]',
};

export function ModuleHeader({
  moduleNumber,
  subtitleTag,
  title,
  description,
  icon,
  activeModule,
  decimals,
  onDecimalsChange,
  onBackHome,
  onSwitchModule,
}: ModuleHeaderProps) {
  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-r ${HEADER_GRADIENTS[activeModule]} text-white p-5 sm:p-6 shadow-md overflow-hidden`}
    >
      {/* Subtle geometric background curve */}
      <svg
        aria-hidden="true"
        viewBox="0 0 600 180"
        className="absolute right-0 top-0 h-full w-1/2 opacity-15 pointer-events-none"
        preserveAspectRatio="none"
      >
        <path
          d="M 40 150 C 160 120, 260 20, 420 75 C 500 102, 555 30, 610 45"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
        />
        <circle cx="420" cy="75" r="5" fill="#24b8d5" />
      </svg>

      <div className="relative z-10 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              {icon}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#e6f1ff]">
                <span className="font-mono tracking-wide">{moduleNumber}</span>
                <span aria-hidden="true" className="text-white/40">
                  ·
                </span>
                <span className="text-blue-100 font-medium">{subtitleTag}</span>
              </div>
              <h1 className="font-display text-xl sm:text-2xl lg:text-[1.7rem] font-bold text-white tracking-tight mt-0.5">
                {title}
              </h1>
              <p className="text-sm text-blue-100/90 mt-1 max-w-2xl">{description}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-white bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl px-3 py-2">
              <span className="whitespace-nowrap font-medium text-[#e6f1ff]">Casas decimais:</span>
              <select
                value={decimals}
                onChange={(e) => onDecimalsChange(Number(e.target.value))}
                className="font-mono font-semibold text-white bg-transparent focus:outline-none cursor-pointer [&>option]:text-[#14264b]"
              >
                {[2, 3, 4, 5, 6, 8].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#14264b] bg-white rounded-xl hover:bg-[#e6f1ff] active:scale-[0.98] transition-all duration-150 shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#2457e8]" />
              <span>Voltar ao menu inicial</span>
            </button>
          </div>
        </div>

        {onSwitchModule && (
          <div className="pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-medium text-blue-100/85">Alternar módulo:</span>
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#14264b]/35 backdrop-blur-xs border border-white/15 rounded-xl">
              {MODULE_LINKS.map((item) => {
                const isActive = item.id === activeModule;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSwitchModule(item.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#14264b] shadow-xs'
                        : 'text-blue-100 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
