import { Activity, ArrowRight, Sigma, TrendingUp } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { MathFormula } from './MathFormula';

export type ActiveRoute = 'home' | 'ode' | 'least-squares' | 'integration';

interface HomeViewProps {
  onSelectModule: (route: Exclude<ActiveRoute, 'home'>) => void;
}

type PreviewId = 'ode' | 'least-squares' | 'integration';

interface ModuleCardConfig {
  id: Exclude<ActiveRoute, 'home'>;
  numberLabel: string;
  title: string;
  description: string;
  methodsLabel: string;
  formulaTex: string;
  icon: ReactNode;
  topBarGradient: string;
  headerBg: string;
  iconBg: string;
  numberColor: string;
  cardBorderHover: string;
  formulaBoxClass: string;
  buttonGradient: string;
  accentGraphic: ReactNode;
}

const MODULES: ModuleCardConfig[] = [
  {
    id: 'ode',
    numberLabel: '01',
    title: 'Equações Diferenciais Ordinárias',
    description:
      'Resolva problemas de valor inicial com tabelas de iteração completas, coeficientes intermediários, gráficos comparativos e resolução passo a passo.',
    methodsLabel: 'Euler e Runge-Kutta de 2ª, 3ª e 4ª ordens',
    formulaTex: 'y_{i+1} = y_i + \\frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)',
    icon: <Activity className="w-6 h-6 text-white" />,
    topBarGradient: 'from-[#2457e8] to-[#24b8d5]',
    headerBg: 'bg-gradient-to-br from-[#e6f1ff] via-[#eef6ff] to-[#dff8fc]',
    iconBg: 'bg-gradient-to-br from-[#2457e8] to-[#24b8d5] shadow-blue-500/25',
    numberColor: 'text-[#2457e8]',
    cardBorderHover: 'hover:border-[#24b8d5] hover:shadow-blue-900/10',
    formulaBoxClass: 'bg-[#e6f1ff]/65 border-[#2457e8]/20',
    buttonGradient: 'from-[#2457e8] to-[#1696c9]',
    accentGraphic: (
      <svg viewBox="0 0 280 68" className="w-full h-16" aria-hidden="true">
        <defs>
          <linearGradient id="odeCardArea" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2457e8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#24b8d5" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        {/* Subtle coordinate lines */}
        <line x1="8" y1="58" x2="272" y2="58" stroke="#93c5fd" strokeOpacity="0.5" strokeWidth="1" />
        <line x1="12" y1="8" x2="12" y2="62" stroke="#93c5fd" strokeOpacity="0.5" strokeWidth="1" />
        <path
          d="M 12 54 Q 82 48, 138 30 T 270 12 L 270 58 L 12 58 Z"
          fill="url(#odeCardArea)"
        />
        {/* Euler approximation segments */}
        <path
          d="M 12 54 L 76 47 L 140 35 L 204 22 L 270 16"
          fill="none"
          stroke="#14264b"
          strokeOpacity="0.45"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        {/* Smooth RK4 evolution curve */}
        <path
          d="M 12 54 Q 82 48, 138 30 T 270 12"
          fill="none"
          stroke="#2457e8"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {[
          [12, 54],
          [76, 44],
          [140, 30],
          [204, 18],
          [270, 12],
        ].map(([cx, cy], idx) => (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r="3.5"
            fill="#ffffff"
            stroke="#24b8d5"
            strokeWidth="2"
          />
        ))}
      </svg>
    ),
  },
  {
    id: 'least-squares',
    numberLabel: '02',
    title: 'Mínimos Quadrados',
    description:
      'Ajuste dados experimentais ou funções contínuas pelo sistema de equações normais, com análise de resíduos, SQR, R² e gráfico de dispersão.',
    methodsLabel: 'Ajuste linear, parabólico, modelos não lineares e caso contínuo',
    formulaTex: '\\min \\sum_{k=1}^{m} \\left[y_k - \\varphi(x_k)\\right]^2',
    icon: <TrendingUp className="w-6 h-6 text-white" />,
    topBarGradient: 'from-[#7955d9] to-[#2457e8]',
    headerBg: 'bg-gradient-to-br from-[#eee9ff] via-[#f4f0ff] to-[#e6f1ff]',
    iconBg: 'bg-gradient-to-br from-[#7955d9] to-[#5638b8] shadow-purple-500/25',
    numberColor: 'text-[#7955d9]',
    cardBorderHover: 'hover:border-[#7955d9]/60 hover:shadow-purple-900/10',
    formulaBoxClass: 'bg-[#eee9ff]/70 border-[#7955d9]/20',
    buttonGradient: 'from-[#7955d9] to-[#2457e8]',
    accentGraphic: (
      <svg viewBox="0 0 280 68" className="w-full h-16" aria-hidden="true">
        <line x1="10" y1="58" x2="272" y2="58" stroke="#c4b5fd" strokeOpacity="0.6" strokeWidth="1" />
        <line x1="12" y1="8" x2="12" y2="62" stroke="#c4b5fd" strokeOpacity="0.6" strokeWidth="1" />
        {/* Regression curve */}
        <path
          d="M 16 52 C 80 48, 162 35, 268 12"
          fill="none"
          stroke="#7955d9"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Linear baseline */}
        <line
          x1="16"
          y1="54"
          x2="268"
          y2="16"
          stroke="#14264b"
          strokeOpacity="0.25"
          strokeWidth="1.25"
          strokeDasharray="3 3"
        />
        {[
          [28, 46, 51],
          [68, 52, 46],
          [110, 34, 41],
          [154, 42, 34],
          [198, 22, 26],
          [238, 24, 18],
          [262, 11, 13],
        ].map(([x, y, yHat], idx) => (
          <g key={idx}>
            <line
              x1={x}
              y1={y}
              x2={x}
              y2={yHat}
              stroke="#7955d9"
              strokeOpacity="0.55"
              strokeWidth="1.25"
              strokeDasharray="2 2"
            />
            <circle cx={x} cy={y} r="3.6" fill="#14264b" stroke="#ffffff" strokeWidth="1.2" />
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: 'integration',
    numberLabel: '03',
    title: 'Integração Numérica',
    description:
      'Calcule integrais definidas com partição em subintervalos, visualização da área aproximada, limitantes teóricos de erro e tabela de nós.',
    methodsLabel: 'Trapézios e Simpson 1/3 (simples e repetidas)',
    formulaTex: 'I_{SR} = \\frac{h}{3}\\left[f(x_0) + 4\\sum f(x_{2j-1}) + 2\\sum f(x_{2j}) + f(x_n)\\right]',
    icon: <Sigma className="w-6 h-6 text-white" />,
    topBarGradient: 'from-[#14264b] via-[#2457e8] to-[#24b8d5]',
    headerBg: 'bg-gradient-to-br from-[#e6f1ff] via-[#e4f7fc] to-[#d4f3f9]',
    iconBg: 'bg-gradient-to-br from-[#14264b] via-[#2457e8] to-[#24b8d5] shadow-cyan-500/25',
    numberColor: 'text-[#0e88a6]',
    cardBorderHover: 'hover:border-[#24b8d5] hover:shadow-cyan-900/10',
    formulaBoxClass: 'bg-[#e6f1ff]/65 border-[#24b8d5]/30',
    buttonGradient: 'from-[#14264b] via-[#2457e8] to-[#24b8d5]',
    accentGraphic: (
      <svg viewBox="0 0 280 68" className="w-full h-16" aria-hidden="true">
        <defs>
          <linearGradient id="intCardFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#24b8d5" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#2457e8" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {[
          [20, 44, 78, 34],
          [78, 34, 136, 25],
          [136, 25, 194, 18],
          [194, 18, 252, 13],
        ].map(([x1, y1, x2, y2], idx) => (
          <path
            key={idx}
            d={`M ${x1} 58 L ${x1} ${y1} L ${x2} ${y2} L ${x2} 58 Z`}
            fill="url(#intCardFill)"
            stroke="#24b8d5"
            strokeOpacity="0.85"
            strokeWidth="1.1"
          />
        ))}
        <path
          d="M 14 46 C 78 36, 158 22, 266 12"
          fill="none"
          stroke="#14264b"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <line x1="10" y1="58" x2="270" y2="58" stroke="#64748b" strokeOpacity="0.5" strokeWidth="1" />
        {[
          [20, 44],
          [78, 34],
          [136, 25],
          [194, 18],
          [252, 13],
        ].map(([cx, cy], idx) => (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r="3"
            fill="#ffffff"
            stroke="#2457e8"
            strokeWidth="1.8"
          />
        ))}
      </svg>
    ),
  },
];

const HERO_PREVIEWS: Record<
  PreviewId,
  {
    tabLabel: string;
    caption: string;
    formulaTex: string;
  }
> = {
  ode: {
    tabLabel: 'EDOs',
    caption: 'Evolução da trajetória numérica (PVI)',
    formulaTex: "y' = f(x, y), \\quad y_{i+1} = y_i + \\frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)",
  },
  'least-squares': {
    tabLabel: 'Mínimos Quadrados',
    caption: 'Dispersão experimental e curva ajustada',
    formulaTex: '\\sum [y_i - \\varphi(x_i)]^2 \\longrightarrow \\min',
  },
  integration: {
    tabLabel: 'Integração',
    caption: 'Área sob f(x) por quadratura numérica',
    formulaTex: '\\int_a^b f(x)\\,dx \\approx \\sum_{i=0}^{n} w_i\\,f(x_i)',
  },
};

export function HomeView({ onSelectModule }: HomeViewProps) {
  const [preview, setPreview] = useState<PreviewId>('ode');

  return (
    <div className="space-y-11">
      {/* Vibrant Blue-to-Purple Gradient Hero Section */}
      <section className="relative rounded-3xl bg-gradient-to-br from-[#14264b] via-[#2457e8] to-[#7955d9] text-white shadow-xl shadow-blue-950/15 overflow-hidden">
        {/* Background Mathematical Graphics & Subtle Geometric Depth */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(230, 241, 255, 0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(230, 241, 255, 0.35) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />
          <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-[#24b8d5]/25 blur-3xl" />
          <div className="absolute -bottom-28 right-1/4 w-96 h-96 rounded-full bg-[#eee9ff]/20 blur-3xl" />

          {/* Sweeping decorative mathematical sine/integral curves in background */}
          <svg
            viewBox="0 0 1200 440"
            className="absolute inset-0 w-full h-full opacity-20"
            preserveAspectRatio="none"
          >
            <path
              d="M -20 340 C 180 280, 320 120, 560 190 C 780 255, 940 70, 1220 110"
              fill="none"
              stroke="#24b8d5"
              strokeWidth="2.5"
            />
            <path
              d="M -20 380 C 220 330, 400 180, 620 240 C 830 295, 980 120, 1220 165"
              fill="none"
              stroke="#eee9ff"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />
            <circle cx="560" cy="190" r="6" fill="#24b8d5" />
            <circle cx="940" cy="132" r="5" fill="#eee9ff" />
          </svg>

          {/* Subtle floating glass mathematical notations */}
          <div className="hidden lg:flex animate-float-slow absolute top-7 right-[44%] px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-mono text-[#e6f1ff]">
            ∫ f(x) dx
          </div>
          <div
            className="hidden lg:flex animate-float-slow absolute bottom-8 right-[45%] px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-mono text-[#eee9ff]"
            style={{ animationDelay: '1.8s' }}
          >
            dy/dx = f(x, y)
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Hero Left Column */}
          <div className="lg:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-between gap-7">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-[#24b8d5]">
                <span>Plataforma de Engenharia</span>
                <span aria-hidden="true" className="text-white/40">
                  ·
                </span>
                <span className="text-[#e6f1ff]">Métodos Numéricos Interativos</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.85rem] font-bold text-white tracking-tight leading-[1.1] text-balance">
                Calculadora de Métodos Numéricos
              </h1>

              <p className="text-base sm:text-lg font-medium text-[#e6f1ff] leading-snug max-w-2xl">
                Resolva problemas matemáticos com precisão e acompanhe cada etapa do cálculo.
              </p>

              <p className="text-sm sm:text-[15px] text-blue-100/90 leading-relaxed max-w-xl">
                Explore Equações Diferenciais Ordinárias, Ajuste de Curvas pelos Mínimos Quadrados
                e Integração Numérica com gráficos interativos, tabelas completas e memorial de
                cálculo passo a passo.
              </p>
            </div>

            {/* Highlighted Module Access Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onSelectModule('ode')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-[#14264b] bg-white rounded-xl hover:bg-[#e6f1ff] active:scale-[0.98] transition-all duration-150 shadow-md shadow-blue-950/20 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span>Equações Diferenciais (EDOs)</span>
                <ArrowRight className="w-4 h-4 text-[#2457e8]" />
              </button>
              <button
                type="button"
                onClick={() => onSelectModule('least-squares')}
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#7955d9]/45 backdrop-blur-sm border border-[#eee9ff]/35 rounded-xl hover:bg-[#7955d9]/70 active:scale-[0.98] transition-all duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span>Mínimos Quadrados</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectModule('integration')}
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#24b8d5]/25 backdrop-blur-sm border border-[#24b8d5]/55 rounded-xl hover:bg-[#24b8d5]/40 active:scale-[0.98] transition-all duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span>Integração Numérica</span>
              </button>
            </div>
          </div>

          {/* Hero Right Column: Layered Glass Mathematical Canvas */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex items-center">
            <div className="w-full h-full bg-[#14264b]/75 backdrop-blur-md border border-white/20 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#e6f1ff]">
                  {HERO_PREVIEWS[preview].caption}
                </span>

                <div
                  role="tablist"
                  aria-label="Visualização matemática"
                  className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/10 border border-white/15"
                >
                  {(['ode', 'least-squares', 'integration'] as const).map((tab) => (
                    <button
                      key={tab}
                      role="tab"
                      aria-selected={preview === tab}
                      type="button"
                      onClick={() => setPreview(tab)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer ${
                        preview === tab
                          ? 'bg-gradient-to-r from-[#24b8d5] to-[#2457e8] text-white shadow-xs'
                          : 'text-blue-100/80 hover:text-white'
                      }`}
                    >
                      {HERO_PREVIEWS[tab].tabLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive SVG Plot */}
              <div className="my-1">
                <svg
                  viewBox="0 0 420 215"
                  className="w-full h-auto"
                  role="img"
                  aria-label={`Ilustração matemática: ${HERO_PREVIEWS[preview].caption}`}
                >
                  <defs>
                    <linearGradient id="heroCyanPurpleArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#24b8d5" stopOpacity="0.52" />
                      <stop offset="100%" stopColor="#7955d9" stopOpacity="0.1" />
                    </linearGradient>
                    <linearGradient id="heroCurveStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#24b8d5" />
                      <stop offset="55%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#eee9ff" />
                    </linearGradient>
                  </defs>

                  {/* Soft grid lines */}
                  {[48, 84, 120, 156].map((y) => (
                    <line
                      key={`hg-${y}`}
                      x1="36"
                      y1={y}
                      x2="394"
                      y2={y}
                      stroke="#93c5fd"
                      strokeOpacity="0.12"
                      strokeWidth="1"
                    />
                  ))}
                  {[96, 156, 216, 276, 336].map((x) => (
                    <line
                      key={`vg-${x}`}
                      x1={x}
                      y1="20"
                      x2={x}
                      y2="184"
                      stroke="#93c5fd"
                      strokeOpacity="0.12"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Axes */}
                  <line x1="36" y1="184" x2="396" y2="184" stroke="#94a3b8" strokeWidth="1.25" />
                  <line x1="36" y1="20" x2="36" y2="184" stroke="#94a3b8" strokeWidth="1.25" />
                  <text x="394" y="201" textAnchor="end" className="fill-blue-200/80 text-[11px] font-mono">
                    x
                  </text>
                  <text x="24" y="28" textAnchor="end" className="fill-blue-200/80 text-[11px] font-mono">
                    y
                  </text>

                  {preview === 'ode' && (
                    <g>
                      {[66, 116, 166, 216, 266, 316, 366].map((x) =>
                        [52, 92, 132, 162].map((y) => {
                          const angle = (x - 180) * 0.0022 - (y - 110) * 0.003;
                          const dx = 9 * Math.cos(angle);
                          const dy = -9 * Math.sin(angle);
                          return (
                            <line
                              key={`${x}-${y}`}
                              x1={x - dx}
                              y1={y - dy}
                              x2={x + dx}
                              y2={y + dy}
                              stroke="#24b8d5"
                              strokeOpacity="0.28"
                              strokeWidth="1.3"
                              strokeLinecap="round"
                            />
                          );
                        })
                      )}
                      <path
                        d="M 52 160 C 125 148, 185 106, 245 74 C 295 48, 342 38, 382 32"
                        fill="none"
                        stroke="url(#heroCurveStroke)"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                      />
                      {[
                        [52, 160, 'x₀'],
                        [118, 144, 'x₁'],
                        [184, 108, 'x₂'],
                        [250, 71, 'x₃'],
                        [316, 45, 'x₄'],
                        [382, 32, 'x₅'],
                      ].map(([cx, cy, label], idx) => (
                        <g key={idx}>
                          <line
                            x1={Number(cx)}
                            y1={Number(cy)}
                            x2={Number(cx)}
                            y2="184"
                            stroke="#24b8d5"
                            strokeOpacity="0.3"
                            strokeDasharray="2 3"
                          />
                          <circle
                            cx={Number(cx)}
                            cy={Number(cy)}
                            r="4.5"
                            fill="#14264b"
                            stroke="#24b8d5"
                            strokeWidth="2.3"
                          />
                          <text
                            x={Number(cx)}
                            y="200"
                            textAnchor="middle"
                            className="fill-[#e6f1ff] text-[10px] font-mono"
                          >
                            {label}
                          </text>
                        </g>
                      ))}
                    </g>
                  )}

                  {preview === 'least-squares' && (
                    <g>
                      <path
                        d="M 54 156 Q 190 144, 380 40"
                        fill="none"
                        stroke="url(#heroCurveStroke)"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                      />
                      {[
                        [68, 142, 152],
                        [112, 152, 142],
                        [158, 118, 129],
                        [206, 124, 113],
                        [252, 84, 94],
                        [302, 82, 72],
                        [348, 46, 53],
                      ].map(([x, y, yHat], idx) => (
                        <g key={idx}>
                          <line
                            x1={x}
                            y1={y}
                            x2={x}
                            y2={yHat}
                            stroke="#eee9ff"
                            strokeOpacity="0.65"
                            strokeWidth="1.5"
                            strokeDasharray="3 2"
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r="4.8"
                            fill="#7955d9"
                            stroke="#ffffff"
                            strokeWidth="2"
                          />
                        </g>
                      ))}
                    </g>
                  )}

                  {preview === 'integration' && (
                    <g>
                      {[
                        [60, 146, 124, 122],
                        [124, 122, 188, 90],
                        [188, 90, 252, 64],
                        [252, 64, 316, 46],
                        [316, 46, 376, 38],
                      ].map(([x1, y1, x2, y2], idx) => (
                        <path
                          key={idx}
                          d={`M ${x1} 184 L ${x1} ${y1} L ${x2} ${y2} L ${x2} 184 Z`}
                          fill="url(#heroCyanPurpleArea)"
                          stroke="#24b8d5"
                          strokeOpacity="0.65"
                          strokeWidth="1.25"
                        />
                      ))}
                      <path
                        d="M 48 150 C 130 130, 230 66, 384 36"
                        fill="none"
                        stroke="url(#heroCurveStroke)"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                      />
                      {[
                        [60, 146, 'a'],
                        [124, 122, 'x₁'],
                        [188, 90, 'x₂'],
                        [252, 64, 'x₃'],
                        [316, 46, 'x₄'],
                        [376, 38, 'b'],
                      ].map(([x, y, lbl], idx) => (
                        <g key={idx}>
                          <circle
                            cx={Number(x)}
                            cy={Number(y)}
                            r="4.2"
                            fill="#14264b"
                            stroke="#24b8d5"
                            strokeWidth="2.2"
                          />
                          <text
                            x={Number(x)}
                            y="200"
                            textAnchor="middle"
                            className="fill-[#e6f1ff] text-[10px] font-mono"
                          >
                            {lbl}
                          </text>
                        </g>
                      ))}
                    </g>
                  )}
                </svg>
              </div>

              <div className="border-t border-white/15 pt-3.5 flex items-center justify-between gap-3">
                <div className="text-[#e6f1ff] text-xs sm:text-sm overflow-x-auto">
                  <MathFormula tex={HERO_PREVIEWS[preview].formulaTex} />
                </div>
                <button
                  type="button"
                  onClick={() => onSelectModule(preview)}
                  className="text-xs font-semibold text-[#24b8d5] hover:text-white inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  <span>Abrir módulo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Distinctly Styled Module Cards */}
      <section aria-label="Módulos disponíveis">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#14264b] tracking-tight">
              Explore os Módulos de Cálculo
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Cada ferramenta possui interface dedicada, gráficos interativos e resolução completa.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {MODULES.map((mod) => (
            <article
              key={mod.id}
              className={`group bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:-translate-y-1.5 hover:shadow-xl transition-all duration-200 ${mod.cardBorderHover}`}
            >
              <div>
                {/* Top Color Strip */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${mod.topBarGradient}`} />

                {/* Tinted Card Header with Large Icon & Highlighted Module Number */}
                <div className={`px-6 pt-5 pb-4 ${mod.headerBg} border-b border-slate-200/60`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span
                        className={`block font-mono text-xs font-bold tracking-wider ${mod.numberColor}`}
                      >
                        MÓDULO {mod.numberLabel}
                      </span>
                      <h3 className="font-display text-lg font-bold text-[#14264b] mt-1 leading-snug text-balance">
                        {mod.title}
                      </h3>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-2xl ${mod.iconBg} shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}
                    >
                      {mod.icon}
                    </div>
                  </div>

                  {/* Distinct Mathematical Curve Illustration */}
                  <div className="bg-white/85 backdrop-blur-xs border border-white rounded-xl px-2.5 py-2 shadow-2xs">
                    {mod.accentGraphic}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 pb-4 space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">{mod.description}</p>

                  <div className={`border rounded-xl px-3 py-2 text-[#14264b] overflow-x-auto ${mod.formulaBoxClass}`}>
                    <MathFormula tex={mod.formulaTex} displayMode />
                  </div>

                  <div>
                    <span className={`block text-xs font-bold ${mod.numberColor}`}>
                      Métodos disponíveis
                    </span>
                    <p className="text-sm font-medium text-[#14264b] mt-0.5">{mod.methodsLabel}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 pt-3">
                <button
                  type="button"
                  onClick={() => onSelectModule(mod.id)}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r ${mod.buttonGradient} rounded-xl hover:brightness-110 active:scale-[0.99] transition-all duration-150 shadow-sm whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2457e8]`}
                >
                  <span>Acessar módulo</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
