import {
  Activity,
  AlertCircle,
  Calculator,
  Eraser,
  GitCompare,
  Info,
  RotateCcw,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  expressionToLatex,
  formatNum,
  parseStrictNumber,
} from '../utils/mathEngine';
import {
  compareOdeMethods,
  ODE_METHODS,
  solveOde,
  type OdeComparisonResult,
  type OdeMethodId,
  type OdeSolution,
  type OdeStopMode,
} from '../utils/odeSolver';
import type { ActiveRoute } from './HomeView';
import { OdeChart, type OdeChartSeries } from './MathCharts';
import { MathFormula } from './MathFormula';
import { ModuleHeader } from './ModuleHeader';
import { StepByStepPanel, type StepSectionData } from './StepByStepPanel';

interface OdeModuleProps {
  decimals: number;
  onDecimalsChange: (d: number) => void;
  onBackHome: () => void;
  onSwitchModule?: (route: Exclude<ActiveRoute, 'home'>) => void;
}

interface OdePreset {
  id: string;
  title: string;
  expression: string;
  x0: string;
  y0: string;
  h: string;
  stopMode: OdeStopMode;
  xf: string;
  iterations: string;
  exactExpression: string;
}

const ODE_PRESETS: OdePreset[] = [
  {
    id: 'slide_euler_cos',
    title: "Exemplo 1 (Euler): y' = 2·cos(2x)·y, y(0) = 1, h = 0,5",
    expression: '2*cos(2*x)*y',
    x0: '0',
    y0: '1',
    h: '0.5',
    stopMode: 'xf',
    xf: '1.5',
    iterations: '3',
    exactExpression: 'exp(sin(2*x))',
  },
  {
    id: 'slide_rk4_2xy',
    title: "Exemplo 2 (RK4): y' = 2xy, y(1) = 1, h = 0,1",
    expression: '2*x*y',
    x0: '1',
    y0: '1',
    h: '0.1',
    stopMode: 'xf',
    xf: '1.5',
    iterations: '5',
    exactExpression: 'exp(x^2 - 1)',
  },
  {
    id: 'slide_rk4_poly',
    title: "Exemplo 3 (RK4 Polinomial): y' = -2x³ + 12x² - 20x + 8,5, y(0) = 1",
    expression: '-2*x^3 + 12*x^2 - 20*x + 8.5',
    x0: '0',
    y0: '1',
    h: '0.5',
    stopMode: 'xf',
    xf: '0.5',
    iterations: '1',
    exactExpression: '-0.5*x^4 + 4*x^3 - 10*x^2 + 8.5*x + 1',
  },
  {
    id: 'linear_exp',
    title: "Exemplo 4 (PVI Clássico): y' = x + y, y(0) = 1, h = 0,2",
    expression: 'x + y',
    x0: '0',
    y0: '1',
    h: '0.2',
    stopMode: 'xf',
    xf: '1',
    iterations: '5',
    exactExpression: '2*exp(x) - x - 1',
  },
];

const METHOD_COLORS: Record<string, string> = {
  euler: '#24b8d5',
  rk2_slide37: '#0d9488',
  rk2_heun: '#0d9488',
  rk2_ralston: '#0d9488',
  rk3_slide40: '#7955d9',
  rk3_kutta: '#7955d9',
  rk4: '#2457e8',
  exact: '#14264b',
};

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-xl text-[#14264b] placeholder:text-slate-400 focus:outline-none focus:border-[#2457e8] focus:ring-4 focus:ring-[#2457e8]/12 transition-all duration-150';

export function OdeModule({
  decimals,
  onDecimalsChange,
  onBackHome,
  onSwitchModule,
}: OdeModuleProps) {
  const [method, setMethod] = useState<OdeMethodId>('rk4');
  const [expression, setExpression] = useState('2*x*y');
  const [x0, setX0] = useState('1');
  const [y0, setY0] = useState('1');
  const [h, setH] = useState('0.1');
  const [stopMode, setStopMode] = useState<OdeStopMode>('xf');
  const [xf, setXf] = useState('1.5');
  const [iterations, setIterations] = useState('5');
  const [exactExpression, setExactExpression] = useState('exp(x^2 - 1)');
  const [compareAll, setCompareAll] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OdeComparisonResult | null>(null);

  const activeMeta = ODE_METHODS[method];

  const handleApplyPreset = (presetId: string) => {
    const preset = ODE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setExpression(preset.expression);
    setX0(preset.x0);
    setY0(preset.y0);
    setH(preset.h);
    setStopMode(preset.stopMode);
    setXf(preset.xf);
    setIterations(preset.iterations);
    setExactExpression(preset.exactExpression);
    setError(null);
    setResult(null);
  };

  const handleClear = () => {
    setExpression('');
    setX0('');
    setY0('');
    setH('');
    setXf('');
    setIterations('');
    setExactExpression('');
    setError(null);
    setResult(null);
  };

  const handleNewCalc = () => {
    setResult(null);
    setError(null);
  };

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    try {
      const parsedX0 = parseStrictNumber(x0, 'Condição inicial x₀');
      const parsedY0 = parseStrictNumber(y0, 'Condição inicial y₀');
      const parsedH = parseStrictNumber(h, 'Passo de integração h');

      const parsedXf =
        stopMode === 'xf' ? parseStrictNumber(xf, 'Valor final xf') : undefined;
      const parsedIter =
        stopMode === 'iterations'
          ? parseStrictNumber(iterations, 'Número de iterações n')
          : undefined;

      const input = {
        expression,
        x0: parsedX0,
        y0: parsedY0,
        h: parsedH,
        stopMode,
        xf: parsedXf,
        iterations: parsedIter,
        method,
        exactExpression: exactExpression.trim() || undefined,
      };

      if (compareAll) {
        setResult(compareOdeMethods(input));
      } else {
        const primary = solveOde(input);
        setResult({
          primary,
          series: [{ id: method, label: primary.method.shortName, solution: primary }],
        });
      }
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Erro ao calcular EDO.');
    }
  };

  const primarySolution: OdeSolution | null = result?.primary ?? null;

  const chartSeries: OdeChartSeries[] = useMemo(() => {
    if (!result) return [];
    const list: OdeChartSeries[] = result.series.map((s) => ({
      id: s.id,
      label: s.label,
      color: METHOD_COLORS[s.id] || '#2457e8',
      points: s.solution.rows.map((r) => ({ x: r.x, y: r.y })),
    }));

    if (result.primary.rows.some((r) => r.yExact !== undefined)) {
      list.push({
        id: 'exact',
        label: 'Solução Exata',
        color: METHOD_COLORS.exact,
        dashed: true,
        points: result.primary.rows
          .filter((r) => r.yExact !== undefined)
          .map((r) => ({ x: r.x, y: r.yExact! })),
      });
    }
    return list;
  }, [result]);

  const stepData: StepSectionData | null = useMemo(() => {
    if (!primarySolution) return null;
    const sol = primarySolution;
    const firstRow = sol.rows[0];
    const latexExpr = expressionToLatex(sol.expression);

    const kFormulaTex = sol.method.formulaLatex;

    let substBlock: string[] = [];
    if (firstRow) {
      const x0Str = formatNum(firstRow.x, decimals);
      const y0Str = formatNum(firstRow.y, decimals);
      const hStr = formatNum(sol.h, decimals);
      if (sol.method.id === 'euler') {
        substBlock = [
          `y_1 = ${y0Str} + ${hStr} \\cdot f(${x0Str},\\; ${y0Str})`,
          `y_1 = ${y0Str} + ${hStr} \\cdot (${formatNum(firstRow.k1!, decimals)}) = ${formatNum(firstRow.yNext!, decimals)}`,
        ];
      } else if (sol.method.id === 'rk2_slide37') {
        substBlock = [
          `k_1 = ${hStr} \\cdot f(${x0Str}, ${y0Str}) = ${formatNum(firstRow.k1!, decimals)}`,
          `k_2 = ${hStr} \\cdot f\\!\\left(${formatNum(firstRow.x + 0.5 * sol.h, decimals)},\\; ${formatNum(firstRow.y + 0.5 * firstRow.k1!, decimals)}\\right) = ${formatNum(firstRow.k2!, decimals)}`,
          `y_1 = ${y0Str} + ${formatNum(firstRow.k2!, decimals)} = ${formatNum(firstRow.yNext!, decimals)}`,
        ];
      } else if (sol.method.id === 'rk2_heun') {
        substBlock = [
          `k_1 = f(${x0Str}, ${y0Str}) = ${formatNum(firstRow.k1!, decimals)}`,
          `k_2 = f(${formatNum(firstRow.x + sol.h, decimals)},\\; ${formatNum(firstRow.y + sol.h * firstRow.k1!, decimals)}) = ${formatNum(firstRow.k2!, decimals)}`,
          `y_1 = ${y0Str} + \\frac{${hStr}}{2}(${formatNum(firstRow.k1!, decimals)} + ${formatNum(firstRow.k2!, decimals)}) = ${formatNum(firstRow.yNext!, decimals)}`,
        ];
      } else if (sol.method.id === 'rk2_ralston') {
        substBlock = [
          `k_1 = f(${x0Str}, ${y0Str}) = ${formatNum(firstRow.k1!, decimals)}`,
          `k_2 = f(${formatNum(firstRow.x + (3 * sol.h) / 4, decimals)},\\; ${formatNum(firstRow.y + ((3 * sol.h) / 4) * firstRow.k1!, decimals)}) = ${formatNum(firstRow.k2!, decimals)}`,
          `y_1 = ${y0Str} + \\frac{${hStr}}{3}(${formatNum(firstRow.k1!, decimals)} + 2 \\cdot ${formatNum(firstRow.k2!, decimals)}) = ${formatNum(firstRow.yNext!, decimals)}`,
        ];
      } else if (sol.method.id === 'rk3_slide40') {
        substBlock = [
          `k_1 = ${hStr} \\cdot f(${x0Str}, ${y0Str}) = ${formatNum(firstRow.k1!, decimals)}`,
          `k_2 = ${hStr} \\cdot f\\!\\left(${formatNum(firstRow.x + sol.h / 2, decimals)},\\; ${formatNum(firstRow.y + firstRow.k1! / 2, decimals)}\\right) = ${formatNum(firstRow.k2!, decimals)}`,
          `k_3 = ${hStr} \\cdot f\\!\\left(${formatNum(firstRow.x + (3 * sol.h) / 4, decimals)},\\; ${formatNum(firstRow.y + (3 * firstRow.k2!) / 4, decimals)}\\right) = ${formatNum(firstRow.k3!, decimals)}`,
          `y_1 = ${y0Str} + \\frac{2}{9}(${formatNum(firstRow.k1!, decimals)}) + \\frac{1}{3}(${formatNum(firstRow.k2!, decimals)}) + \\frac{4}{9}(${formatNum(firstRow.k3!, decimals)}) = ${formatNum(firstRow.yNext!, decimals)}`,
        ];
      } else if (sol.method.id === 'rk3_kutta') {
        substBlock = [
          `k_1 = ${formatNum(firstRow.k1!, decimals)},\\quad k_2 = ${formatNum(firstRow.k2!, decimals)},\\quad k_3 = ${formatNum(firstRow.k3!, decimals)}`,
          `y_1 = ${formatNum(firstRow.yNext!, decimals)}`,
        ];
      } else {
        substBlock = [
          `k_1 = f(${x0Str}, ${y0Str}) = ${formatNum(firstRow.k1!, decimals)}`,
          `k_2 = f(${formatNum(firstRow.x + sol.h / 2, decimals)},\\; ${formatNum(firstRow.y + (sol.h * firstRow.k1!) / 2, decimals)}) = ${formatNum(firstRow.k2!, decimals)}`,
          `k_3 = f(${formatNum(firstRow.x + sol.h / 2, decimals)},\\; ${formatNum(firstRow.y + (sol.h * firstRow.k2!) / 2, decimals)}) = ${formatNum(firstRow.k3!, decimals)}`,
          `k_4 = f(${formatNum(firstRow.x + sol.h, decimals)},\\; ${formatNum(firstRow.y + sol.h * firstRow.k3!, decimals)}) = ${formatNum(firstRow.k4!, decimals)}`,
          `y_1 = ${y0Str} + \\frac{${hStr}}{6}(${formatNum(firstRow.k1!, decimals)} + 2\\cdot${formatNum(firstRow.k2!, decimals)} + 2\\cdot${formatNum(firstRow.k3!, decimals)} + ${formatNum(firstRow.k4!, decimals)}) = ${formatNum(firstRow.yNext!, decimals)}`,
        ];
      }
    }

    const summaryLines = [
      `MÓDULO 1 — EQUAÇÕES DIFERENCIAIS ORDINÁRIAS (EDOs)`,
      `Método: ${sol.method.name}`,
      `EDO: y' = ${sol.expression}`,
      `Condição inicial: x0 = ${sol.x0}, y0 = ${sol.y0}`,
      `Passo h = ${sol.h}, Iterações = ${sol.iterations}, xf = ${formatNum(sol.finalX, decimals)}`,
      `Resultado final: y(${formatNum(sol.finalX, decimals)}) ≈ ${formatNum(sol.finalY, decimals)}`,
      ``,
      `Tabela de Iterações:`,
      ...sol.rows.map((r) => {
        const ks = [
          r.k1 !== undefined ? `k1=${formatNum(r.k1, decimals)}` : '',
          r.k2 !== undefined ? `k2=${formatNum(r.k2, decimals)}` : '',
          r.k3 !== undefined ? `k3=${formatNum(r.k3, decimals)}` : '',
          r.k4 !== undefined ? `k4=${formatNum(r.k4, decimals)}` : '',
        ]
          .filter(Boolean)
          .join(', ');
        return `i=${r.i}: x=${formatNum(r.x, decimals)}, y=${formatNum(r.y, decimals)}${ks ? ` (${ks})` : ''}`;
      }),
    ].join('\n');

    return {
      dados: (
        <div className="space-y-1.5">
          <p>
            Problema de Valor Inicial (PVI) definido pela equação diferencial{' '}
            <MathFormula tex={`y' = f(x, y) = ${latexExpr}`} />:
          </p>
          <ul className="list-disc pl-5 space-y-1 font-mono text-sm tabular-nums">
            <li>Condição inicial: x₀ = {formatNum(sol.x0, decimals)}, y₀ = {formatNum(sol.y0, decimals)}</li>
            <li>Passo de integração: h = {formatNum(sol.h, decimals)}</li>
            <li>
              Intervalo de integração: [{formatNum(sol.x0, decimals)}, {formatNum(sol.finalX, decimals)}] com n ={' '}
              {sol.iterations} {sol.iterations === 1 ? 'iteração' : 'iterações'}
            </li>
          </ul>
        </div>
      ),
      metodo: (
        <div className="space-y-1.5">
          <p>
            Foi selecionado o <strong>{sol.method.name}</strong> (método numérico explícito de passo
            único e ordem {sol.method.order}).
          </p>
          {sol.method.kIncludesH && (
            <p className="text-xs text-slate-600">
              Nota de notação: os coeficientes intermediários{' '}
              <span className="font-mono">k₁, k₂{sol.method.order >= 3 ? ', k₃' : ''}</span> já
              incorporam a multiplicação pelo passo <span className="font-mono">h</span>.
            </p>
          )}
        </div>
      ),
      formula: (
        <div className="space-y-1 bg-[#eee9ff]/55 border border-[#7955d9]/20 rounded-xl px-4 py-2.5">
          {kFormulaTex.map((tex, idx) => (
            <MathFormula key={idx} tex={tex} displayMode />
          ))}
        </div>
      ),
      substituicao: (
        <div className="space-y-2">
          <p>
            Aplicando a primeira iteração (<span className="font-mono">i = 0</span>, partindo de{' '}
            <span className="font-mono">x₀ = {formatNum(sol.x0, decimals)}</span> e{' '}
            <span className="font-mono">y₀ = {formatNum(sol.y0, decimals)}</span>):
          </p>
          <div className="bg-[#e6f1ff]/55 border border-[#2457e8]/20 rounded-xl px-4 py-2.5 space-y-1">
            {substBlock.map((tex, idx) => (
              <MathFormula key={idx} tex={tex} displayMode />
            ))}
          </div>
        </div>
      ),
      desenvolvimento: (
        <div className="space-y-2.5">
          <p>
            Repetindo o processo iterativo de <span className="font-mono">i = 0</span> até{' '}
            <span className="font-mono">i = {sol.iterations - 1}</span>, obtemos os seguintes valores
            intermediários:
          </p>
          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
            {sol.rows.slice(0, -1).map((r) => (
              <div
                key={r.i}
                className="px-4 py-2.5 text-xs sm:text-sm font-mono tabular-nums flex flex-wrap items-center justify-between gap-2 bg-white hover:bg-slate-50/80 transition-colors"
              >
                <span className="font-semibold text-[#14264b]">
                  Iteração {r.i} (x = {formatNum(r.x, decimals)} → {formatNum(r.x + sol.h, decimals)}):
                </span>
                <span className="text-slate-600">
                  {r.k1 !== undefined && `k₁ = ${formatNum(r.k1, decimals)}`}
                  {r.k2 !== undefined && ` · k₂ = ${formatNum(r.k2, decimals)}`}
                  {r.k3 !== undefined && ` · k₃ = ${formatNum(r.k3, decimals)}`}
                  {r.k4 !== undefined && ` · k₄ = ${formatNum(r.k4, decimals)}`}
                </span>
                <span className="font-semibold text-[#2457e8]">
                  y_{r.i + 1} = {formatNum(r.yNext!, decimals)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
      resultadoFinal: (
        <div className="space-y-2">
          <p>
            A aproximação numérica da solução no ponto final{' '}
            <MathFormula tex={`x_${sol.iterations} = ${formatNum(sol.finalX, decimals)}`} /> é:
          </p>
          <div className="bg-gradient-to-r from-[#14264b] via-[#2457e8] to-[#24b8d5] text-white rounded-xl px-5 py-3.5 font-mono text-base font-semibold tabular-nums shadow-sm">
            y({formatNum(sol.finalX, decimals)}) ≈ {formatNum(sol.finalY, decimals)}
          </div>
          {sol.rows[sol.rows.length - 1]?.yExact !== undefined && (
            <p className="text-sm text-slate-600 font-mono tabular-nums">
              Valor exato: {formatNum(sol.rows[sol.rows.length - 1].yExact!, decimals)} · Erro absoluto
              final: {formatNum(sol.rows[sol.rows.length - 1].absError!, decimals)}
            </p>
          )}
        </div>
      ),
      plainTextSummary: summaryLines,
    };
  }, [primarySolution, decimals]);

  const showK1 = primarySolution !== null && primarySolution.method.order >= 1;
  const showK2 = primarySolution !== null && primarySolution.method.order >= 2;
  const showK3 = primarySolution !== null && primarySolution.method.order >= 3;
  const showK4 = primarySolution !== null && primarySolution.method.order >= 4;
  const hasExact = primarySolution?.rows.some((r) => r.yExact !== undefined) ?? false;

  return (
    <div className="space-y-6">
      <ModuleHeader
        moduleNumber="Módulo 01"
        subtitleTag="Problemas de Valor Inicial"
        title="Equações Diferenciais Ordinárias (EDOs)"
        description="Integração numérica passo a passo por Euler e Runge-Kutta de 2ª, 3ª e 4ª ordens com comparação de precisão."
        icon={<Activity className="w-5 h-5" />}
        activeModule="ode"
        decimals={decimals}
        onDecimalsChange={onDecimalsChange}
        onBackHome={onBackHome}
        onSwitchModule={onSwitchModule}
      />

      {/* Main Two-Column Workspace: Input Deck (Left) & Results Stage (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          id="module-calc-form"
          onSubmit={handleCalculate}
          className="lg:col-span-5 bg-white border border-[#2457e8]/20 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="bg-gradient-to-r from-[#e6f1ff] via-[#eef6ff] to-[#dff8fc] px-6 py-4 border-b border-slate-200/75">
            <h2 className="font-display text-base font-bold text-[#14264b]">
              Dados de Entrada
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Defina o método, a equação diferencial e as condições iniciais
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Presets */}
            <div className="bg-[#f7faff] border border-[#2457e8]/15 rounded-xl p-3.5">
              <label htmlFor="ode-preset" className="block text-xs font-semibold text-[#2457e8] mb-1.5">
                Exercícios modelo para testar
              </label>
              <select
                id="ode-preset"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) handleApplyPreset(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-[#14264b] focus:outline-none focus:border-[#2457e8] focus:ring-4 focus:ring-[#2457e8]/12 transition-all duration-150 cursor-pointer"
              >
                <option value="" disabled>
                  Selecione um exemplo pronto...
                </option>
                {ODE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Method Selection */}
            <div>
              <label htmlFor="ode-method" className="block text-sm font-semibold text-[#14264b] mb-1.5">
                Método numérico
              </label>
              <select
                id="ode-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as OdeMethodId)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-[#14264b] focus:outline-none focus:border-[#2457e8] focus:ring-4 focus:ring-[#2457e8]/12 transition-all duration-150 cursor-pointer"
              >
                <option value="euler">A) Método de Euler (1ª ordem)</option>
                <optgroup label="B) Runge-Kutta de 2ª Ordem (RK2)">
                  <option value="rk2_slide37">RK2 — Euler Aperfeiçoado (k₁, k₂ com h)</option>
                  <option value="rk2_heun">RK2 — Método de Heun</option>
                  <option value="rk2_ralston">RK2 — Método de Ralston</option>
                </optgroup>
                <optgroup label="C) Runge-Kutta de 3ª Ordem (RK3)">
                  <option value="rk3_slide40">RK3 — Ralston (3ª ordem)</option>
                  <option value="rk3_kutta">RK3 — Clássico de Kutta</option>
                </optgroup>
                <option value="rk4">D) Runge-Kutta de 4ª Ordem (RK4 Clássico)</option>
              </select>

              {activeMeta.slideNote && (
                <div className="mt-2.5 flex items-start gap-2.5 text-xs text-[#14264b] bg-[#e6f1ff]/70 border border-[#24b8d5]/35 rounded-xl p-3">
                  <Info className="w-4 h-4 text-[#0e88a6] shrink-0 mt-0.5" />
                  <span>{activeMeta.slideNote}</span>
                </div>
              )}
            </div>

          {/* Differential Equation */}
          <div>
            <label htmlFor="ode-expr" className="block text-sm font-semibold text-[#14264b] mb-1.5">
              Equação diferencial <span className="font-mono text-slate-600 font-normal">y' = f(x, y)</span>
            </label>
            <input
              id="ode-expr"
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="Ex: 2*x*y, 2*cos(2*x)*y, x + y"
              className={INPUT_CLASS}
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Suporta: +, -, *, /, ^, sin/sen, cos, tan/tg, exp, ln, log10, sqrt, pi, e.
            </p>
          </div>

          {/* Initial conditions & h */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="ode-x0" className="block text-sm font-semibold text-[#14264b] mb-1">
                x₀
              </label>
              <input
                id="ode-x0"
                type="text"
                inputMode="decimal"
                value={x0}
                onChange={(e) => setX0(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="ode-y0" className="block text-sm font-semibold text-[#14264b] mb-1">
                y₀
              </label>
              <input
                id="ode-y0"
                type="text"
                inputMode="decimal"
                value={y0}
                onChange={(e) => setY0(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="ode-h" className="block text-sm font-semibold text-[#14264b] mb-1">
                Passo h
              </label>
              <input
                id="ode-h"
                type="text"
                inputMode="decimal"
                value={h}
                onChange={(e) => setH(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* Stop criterion */}
          <div>
            <span className="block text-sm font-semibold text-[#14264b] mb-1.5">
              Critério de parada
            </span>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-3">
              <button
                type="button"
                onClick={() => setStopMode('xf')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  stopMode === 'xf'
                    ? 'bg-white text-[#2457e8] shadow-xs'
                    : 'text-slate-600 hover:text-[#14264b]'
                }`}
              >
                Valor final (xf)
              </button>
              <button
                type="button"
                onClick={() => setStopMode('iterations')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  stopMode === 'iterations'
                    ? 'bg-white text-[#2457e8] shadow-xs'
                    : 'text-slate-600 hover:text-[#14264b]'
                }`}
              >
                Nº de iterações (n)
              </button>
            </div>

            {stopMode === 'xf' ? (
              <div>
                <label htmlFor="ode-xf" className="block text-xs font-medium text-slate-600 mb-1">
                  Valor final de x (xf)
                </label>
                <input
                  id="ode-xf"
                  type="text"
                  inputMode="decimal"
                  value={xf}
                  onChange={(e) => setXf(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="ode-iter" className="block text-xs font-medium text-slate-600 mb-1">
                  Quantidade de iterações (n)
                </label>
                <input
                  id="ode-iter"
                  type="text"
                  inputMode="numeric"
                  value={iterations}
                  onChange={(e) => setIterations(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            )}
          </div>

          {/* Optional exact solution */}
          <div>
            <label htmlFor="ode-exact" className="block text-sm font-semibold text-[#14264b] mb-1">
              Solução analítica exata y(x){' '}
              <span className="text-slate-400 font-normal text-xs">(opcional)</span>
            </label>
            <input
              id="ode-exact"
              type="text"
              value={exactExpression}
              onChange={(e) => setExactExpression(e.target.value)}
              placeholder="Ex: exp(x^2 - 1)"
              className={INPUT_CLASS}
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none pt-0.5">
            <input
              type="checkbox"
              checked={compareAll}
              onChange={(e) => setCompareAll(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#2457e8] focus:ring-blue-600 cursor-pointer"
            />
            <span className="inline-flex items-center gap-1.5 font-medium text-[#14264b]">
              <GitCompare className="w-4 h-4 text-[#2457e8]" />
              Comparar Euler, RK2, RK3 e RK4
            </span>
          </label>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div className="space-y-0.5">
                <p className="font-semibold text-red-950">Verifique os dados informados</p>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#2457e8] to-[#1795c9] rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-150 shadow-sm whitespace-nowrap cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Calcular Solução</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all duration-150 whitespace-nowrap cursor-pointer"
            >
              <Eraser className="w-4 h-4" />
              <span>Limpar</span>
            </button>
            {result && (
              <button
                type="button"
                onClick={handleNewCalc}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 text-sm font-medium text-[#2457e8] bg-[#e6f1ff] border border-[#2457e8]/25 rounded-xl hover:bg-blue-100 active:scale-[0.98] transition-all duration-150 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Novo cálculo</span>
              </button>
            )}
          </div>
          </div>
        </form>

        {/* Right Output Stage */}
        <div className="lg:col-span-7 space-y-6">
          {!primarySolution ? (
            <div className="bg-white border border-[#2457e8]/20 rounded-2xl p-8 sm:p-10 shadow-sm space-y-6">
              <div className="space-y-2 text-center max-w-lg mx-auto">
                <h2 className="font-display text-xl font-bold text-[#14264b]">
                  Área de Resultados e Visualização
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Configure a equação diferencial <span className="font-mono">y' = f(x, y)</span>, as
                  condições iniciais e o método desejado no painel ao lado, depois clique em{' '}
                  <strong>Calcular Solução</strong>.
                </p>
              </div>

              <div className="bg-[#eee9ff]/55 border border-[#7955d9]/20 rounded-2xl p-5 space-y-2">
                <div className="text-xs font-bold text-[#7955d9]">
                  Formulação matemática do método selecionado
                </div>
                <div className="text-sm font-semibold text-[#14264b]">{activeMeta.name}</div>
                <div className="pt-1 overflow-x-auto text-[#14264b]">
                  {activeMeta.formulaLatex.map((tex, idx) => (
                    <MathFormula key={idx} tex={tex} displayMode />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {primarySolution.warning && (
                <div className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>{primarySolution.warning}</span>
                </div>
              )}

              {/* Highlighted Final Result + Tinted Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-[#14264b] via-[#2457e8] to-[#24b8d5] text-white rounded-2xl p-4 shadow-md">
                  <div className="text-xs text-[#e6f1ff] font-medium">Solução aproximada</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-white mt-1.5">
                    {formatNum(primarySolution.finalY, decimals)}
                  </div>
                  <div className="text-xs font-mono text-blue-100 mt-1">
                    em x = {formatNum(primarySolution.finalX, decimals)}
                  </div>
                </div>

                <div className="bg-[#e6f1ff]/65 border border-[#2457e8]/20 rounded-2xl p-4 shadow-xs">
                  <div className="text-xs text-[#2457e8] font-semibold">Passo utilizado</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#14264b] mt-1.5">
                    {formatNum(primarySolution.h, decimals)}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">h constante</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                  <div className="text-xs text-slate-500 font-semibold">Iterações</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#14264b] mt-1.5">
                    {primarySolution.iterations}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">passos executados</div>
                </div>

                <div className="bg-[#eee9ff]/65 border border-[#7955d9]/20 rounded-2xl p-4 shadow-xs">
                  <div className="text-xs text-[#7955d9] font-semibold">
                    {hasExact ? 'Erro absoluto final' : 'Método ativo'}
                  </div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#14264b] mt-1.5 truncate">
                    {hasExact
                      ? formatNum(
                          primarySolution.rows[primarySolution.rows.length - 1]?.absError ?? 0,
                          decimals
                        )
                      : primarySolution.method.shortName}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Ordem {primarySolution.method.order}
                  </div>
                </div>
              </div>

              <OdeChart series={chartSeries} decimals={decimals} />

              {result && result.series.length > 1 && (
                <div className="bg-white border border-[#2457e8]/20 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 sm:px-6 py-4 bg-[#e6f1ff]/55 border-b border-slate-200/75">
                    <h3 className="font-display text-base font-bold text-[#14264b]">
                      Comparação entre os Métodos em x = {formatNum(primarySolution.finalX, decimals)}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200 text-xs text-slate-600">
                          <th className="py-3 px-4 font-semibold">Método</th>
                          <th className="py-3 px-4 font-semibold text-right">y(xf) aproximado</th>
                          {hasExact && (
                            <th className="py-3 px-4 font-semibold text-right">Erro absoluto</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                        {result.series.map((s) => {
                          const last = s.solution.rows[s.solution.rows.length - 1];
                          return (
                            <tr key={s.id} className="hover:bg-[#e6f1ff]/35 transition-colors">
                              <td className="py-2.5 px-4 font-sans font-medium text-[#14264b]">
                                {s.solution.method.name}
                              </td>
                              <td className="py-2.5 px-4 text-right font-semibold text-[#2457e8]">
                                {formatNum(s.solution.finalY, decimals)}
                              </td>
                              {hasExact && (
                                <td className="py-2.5 px-4 text-right text-slate-600">
                                  {last?.absError !== undefined
                                    ? formatNum(last.absError, decimals)
                                    : '—'}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#2457e8]/20 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 sm:px-6 py-4 bg-[#e6f1ff]/55 border-b border-slate-200/75">
                  <h3 className="font-display text-base font-bold text-[#14264b]">
                    Tabela de Iterações — {primarySolution.method.shortName}
                  </h3>
                  {primarySolution.method.kIncludesH && (
                    <span className="text-xs font-medium text-[#2457e8]">
                      Valores de k incluem multiplicação por h
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm text-right border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                      <tr>
                        <th className="py-3 px-2.5 text-center font-semibold">i</th>
                        <th className="py-3 px-3 font-semibold">xᵢ</th>
                        <th className="py-3 px-3 font-semibold">yᵢ</th>
                        {showK1 && <th className="py-3 px-3 font-semibold">k₁</th>}
                        {showK2 && <th className="py-3 px-3 font-semibold">k₂</th>}
                        {showK3 && <th className="py-3 px-3 font-semibold">k₃</th>}
                        {showK4 && <th className="py-3 px-3 font-semibold">k₄</th>}
                        {hasExact && <th className="py-3 px-3 font-semibold">y exato</th>}
                        {hasExact && <th className="py-3 px-3 font-semibold">|Erro|</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-[#14264b]">
                      {primarySolution.rows.map((r) => (
                        <tr key={r.i} className="hover:bg-[#e6f1ff]/35 transition-colors">
                          <td className="py-2.5 px-2.5 text-center text-slate-500">{r.i}</td>
                          <td className="py-2.5 px-3">{formatNum(r.x, decimals)}</td>
                          <td className="py-2.5 px-3 font-semibold text-[#2457e8]">
                            {formatNum(r.y, decimals)}
                          </td>
                          {showK1 && (
                            <td className="py-2.5 px-3 text-slate-600">
                              {r.k1 !== undefined ? formatNum(r.k1, decimals) : '—'}
                            </td>
                          )}
                          {showK2 && (
                            <td className="py-2.5 px-3 text-slate-600">
                              {r.k2 !== undefined ? formatNum(r.k2, decimals) : '—'}
                            </td>
                          )}
                          {showK3 && (
                            <td className="py-2.5 px-3 text-slate-600">
                              {r.k3 !== undefined ? formatNum(r.k3, decimals) : '—'}
                            </td>
                          )}
                          {showK4 && (
                            <td className="py-2.5 px-3 text-slate-600">
                              {r.k4 !== undefined ? formatNum(r.k4, decimals) : '—'}
                            </td>
                          )}
                          {hasExact && (
                            <td className="py-2.5 px-3 text-slate-600">
                              {r.yExact !== undefined ? formatNum(r.yExact, decimals) : '—'}
                            </td>
                          )}
                          {hasExact && (
                            <td className="py-2.5 px-3 text-slate-600">
                              {r.absError !== undefined ? formatNum(r.absError, decimals) : '—'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {stepData && <StepByStepPanel data={stepData} theme="ode" />}
    </div>
  );
}
