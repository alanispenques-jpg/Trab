import {
  AlertCircle,
  AreaChart,
  Calculator,
  Eraser,
  GitCompare,
  RotateCcw,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  compareIntegrationMethods,
  INTEGRATION_METHODS,
  solveIntegration,
  type IntegrationComparisonRow,
  type IntegrationMethodId,
  type IntegrationSolution,
} from '../utils/integrationSolver';
import { expressionToLatex, formatNum, parseStrictNumber } from '../utils/mathEngine';
import type { ActiveRoute } from './HomeView';
import { IntegrationChart } from './MathCharts';
import { MathFormula } from './MathFormula';
import { ModuleHeader } from './ModuleHeader';
import { StepByStepPanel, type StepSectionData } from './StepByStepPanel';

interface IntegrationModuleProps {
  decimals: number;
  onDecimalsChange: (d: number) => void;
  onBackHome: () => void;
  onSwitchModule?: (route: Exclude<ActiveRoute, 'home'>) => void;
}

interface IntegrationPreset {
  id: string;
  title: string;
  expression: string;
  a: string;
  b: string;
  n: string;
  exactValue: string;
}

const INTEGRATION_PRESETS: IntegrationPreset[] = [
  {
    id: 'slide_exp_0_1',
    title: 'Exponencial: ∫₀¹ eˣ dx (exata: e - 1)',
    expression: 'exp(x)',
    a: '0',
    b: '1',
    n: '4',
    exactValue: '1.7182818285',
  },
  {
    id: 'ln_1_2',
    title: 'Racional: ∫₀¹ 1/(1 + x) dx (exata: ln 2)',
    expression: '1 / (1 + x)',
    a: '0',
    b: '1',
    n: '6',
    exactValue: '0.6931471806',
  },
  {
    id: 'sin_0_pi',
    title: 'Trigonométrica: ∫₀^π sen(x) dx (exata: 2)',
    expression: 'sin(x)',
    a: '0',
    b: '3.1415926536',
    n: '6',
    exactValue: '2',
  },
  {
    id: 'poly_0_2',
    title: 'Polinomial: ∫₀² (x³ - 2x + 1) dx (exata: 2)',
    expression: 'x^3 - 2*x + 1',
    a: '0',
    b: '2',
    n: '4',
    exactValue: '2',
  },
];

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-xl text-[#14264b] placeholder:text-slate-400 focus:outline-none focus:border-[#2457e8] focus:ring-4 focus:ring-[#24b8d5]/18 transition-all duration-150';

export function IntegrationModule({
  decimals,
  onDecimalsChange,
  onBackHome,
  onSwitchModule,
}: IntegrationModuleProps) {
  const [method, setMethod] = useState<IntegrationMethodId>('simpson_repeated');
  const [expression, setExpression] = useState('exp(x)');
  const [a, setA] = useState('0');
  const [b, setB] = useState('1');
  const [n, setN] = useState('4');
  const [userMaxDeriv, setUserMaxDeriv] = useState('');
  const [exactValue, setExactValue] = useState('1.7182818285');
  const [compareMethods, setCompareMethods] = useState(true);

  const [solution, setSolution] = useState<IntegrationSolution | null>(null);
  const [comparison, setComparison] = useState<IntegrationComparisonRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRepeated = method === 'trapezoid_repeated' || method === 'simpson_repeated';
  const activeMeta = INTEGRATION_METHODS[method];

  const handleApplyPreset = (presetId: string) => {
    const preset = INTEGRATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setExpression(preset.expression);
    setA(preset.a);
    setB(preset.b);
    setN(preset.n);
    setExactValue(preset.exactValue);
    setUserMaxDeriv('');
    setSolution(null);
    setComparison(null);
    setError(null);
  };

  const handleClear = () => {
    setExpression('');
    setA('');
    setB('');
    setN('');
    setUserMaxDeriv('');
    setExactValue('');
    setSolution(null);
    setComparison(null);
    setError(null);
  };

  const handleNewCalc = () => {
    setSolution(null);
    setComparison(null);
    setError(null);
  };

  const handleCalculate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setComparison(null);

    try {
      const aVal = parseStrictNumber(a, 'Limite inferior a');
      const bVal = parseStrictNumber(b, 'Limite superior b');
      const nVal = isRepeated ? parseStrictNumber(n, 'Número de subdivisões n') : 2;
      const derivVal =
        userMaxDeriv.trim().length > 0
          ? parseStrictNumber(userMaxDeriv, 'Limitante da derivada')
          : undefined;
      const exactVal =
        exactValue.trim().length > 0
          ? parseStrictNumber(exactValue, 'Valor exato (opcional)')
          : undefined;

      const sol = solveIntegration({
        expression,
        a: aVal,
        b: bVal,
        n: nVal,
        method,
        userMaxDerivative: derivVal,
        exactValue: exactVal,
        targetTolerance: 1e-3,
      });

      setSolution(sol);

      if (compareMethods) {
        const compN = isRepeated
          ? nVal
          : n.trim().length > 0 && Number.isInteger(Number(n)) && Number(n) >= 2
          ? Number(n)
          : 4;
        setComparison(compareIntegrationMethods(expression, aVal, bVal, compN, exactVal));
      }
    } catch (err) {
      setSolution(null);
      setError(err instanceof Error ? err.message : 'Erro ao calcular a integral.');
    }
  };

  const stepData: StepSectionData | null = useMemo(() => {
    if (!solution) return null;
    const s = solution;
    const latexExpr = expressionToLatex(s.expression);
    const hStr = formatNum(s.h, decimals);

    const termsList = s.nodes.map((node) => {
      const fStr = formatNum(node.fx, decimals);
      return node.weight === 1 ? `(${fStr})` : `${node.weight} \\cdot (${fStr})`;
    });
    const bracketStr =
      termsList.length <= 10
        ? termsList.join(' + ')
        : `${termsList.slice(0, 4).join(' + ')} + \\dots + ${termsList.slice(-2).join(' + ')}`;

    const factorLatex =
      s.method.id === 'trapezoid_simple' || s.method.id === 'trapezoid_repeated'
        ? `\\frac{${hStr}}{2}`
        : `\\frac{${hStr}}{3}`;

    const substLatex = `I \\approx ${factorLatex}\\left[${bracketStr}\\right]`;

    const plainLines = [
      `MÓDULO 3 — INTEGRAÇÃO NUMÉRICA`,
      `Método: ${s.method.name}`,
      `Integral: ∫ de ${s.a} até ${s.b} de (${s.expression}) dx`,
      `Subdivisões n = ${s.n}, Passo h = ${formatNum(s.h, decimals)}`,
      `Valor aproximado: I ≈ ${formatNum(s.result, decimals)}`,
      `Limitante teórico de erro: |E| ≤ ${formatNum(s.errorBound, decimals)}`,
    ].join('\n');

    return {
      dados: (
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Função integranda:{' '}
            <MathFormula tex={`f(x) = ${latexExpr}`} />
          </li>
          <li className="font-mono tabular-nums">
            Intervalo de integração: [a, b] = [{formatNum(s.a, decimals)}, {formatNum(s.b, decimals)}]
          </li>
          <li className="font-mono tabular-nums">
            Subdivisões: n = m = {s.n} · Passo: h = (b - a) / n = {formatNum(s.h, decimals)}
          </li>
        </ul>
      ),
      metodo: (
        <p>
          Foi aplicada a <strong>{s.method.name}</strong> (fórmula fechada de Newton-Cotes)
          utilizando {s.nodes.length} pontos de avaliação igualmente espaçados no intervalo.
        </p>
      ),
      formula: (
        <div className="space-y-2 bg-[#eee9ff]/55 border border-[#7955d9]/20 rounded-xl px-4 py-2.5">
          <MathFormula tex={s.method.formulaLatex} displayMode />
          <div className="text-xs text-slate-600 pt-1 border-t border-[#7955d9]/15">
            <span className="block mb-1 font-medium text-[#7955d9]">
              Estimativa de erro de truncamento:
            </span>
            <MathFormula tex={s.method.errorFormulaLatex} displayMode />
          </div>
        </div>
      ),
      substituicao: (
        <div className="space-y-2">
          <p>Substituindo os valores calculados de f(xᵢ) nos nós da partição:</p>
          <div className="bg-[#e6f1ff]/60 border border-[#24b8d5]/25 rounded-xl px-4 py-2.5">
            <MathFormula tex={substLatex} displayMode />
          </div>
        </div>
      ),
      desenvolvimento: (
        <div className="space-y-2 font-mono text-xs sm:text-sm tabular-nums">
          <p className="font-sans text-sm text-slate-700">
            Somando as parcelas ponderadas da tabela:
          </p>
          <div className="bg-[#e6f1ff]/50 border border-[#2457e8]/15 rounded-xl p-3.5 space-y-1">
            <div>Soma ponderada = Σ (pesoᵢ · f(xᵢ)) = {formatNum(s.weightedSum, decimals)}</div>
            <div>
              Fator multiplicador ={' '}
              {s.method.id === 'trapezoid_simple' || s.method.id === 'trapezoid_repeated'
                ? 'h / 2'
                : 'h / 3'}{' '}
              ={' '}
              {formatNum(
                s.method.id === 'trapezoid_simple' || s.method.id === 'trapezoid_repeated'
                  ? s.h / 2
                  : s.h / 3,
                decimals
              )}
            </div>
            <div>
              {s.derivativeSource === 'user'
                ? `Limitante informado para |f^(${s.method.derivativeOrder})(ξ)| = `
                : `Estimativa numérica de máx |f^(${s.method.derivativeOrder})(ξ)| ≈ `}
              {formatNum(s.estimatedMaxDerivative, decimals)}
            </div>
            <div>
              Limitante do erro de truncamento: |E| ≤ {formatNum(s.errorBound, decimals)}
            </div>
            {s.minSubintervalsForTol !== undefined && (
              <div>
                Para erro ≤ 10⁻³: m mínimo sugerido = {s.minSubintervalsForTol}{' '}
                {s.minSubintervalsForTol === 1 ? 'subintervalo' : 'subintervalos'}
              </div>
            )}
          </div>
        </div>
      ),
      resultadoFinal: (
        <div className="space-y-2">
          <div className="bg-gradient-to-r from-[#14264b] via-[#2457e8] to-[#24b8d5] text-white rounded-xl px-5 py-3.5 font-mono text-base font-semibold tabular-nums shadow-sm">
            ∫[{formatNum(s.a, decimals)}, {formatNum(s.b, decimals)}] f(x) dx ≈{' '}
            {formatNum(s.result, decimals)}
          </div>
          <p className="text-sm font-mono tabular-nums text-slate-600">
            Referência de alta precisão:{' '}
            {formatNum(s.exactValueProvided ?? s.referenceIntegral, decimals)} · Erro observado:{' '}
            {formatNum(s.trueError ?? 0, decimals)}
            {s.relativeErrorPct !== undefined &&
              ` (${formatNum(s.relativeErrorPct, Math.min(decimals, 4))}%)`}
          </p>
        </div>
      ),
      plainTextSummary: plainLines,
    };
  }, [solution, decimals]);

  return (
    <div className="space-y-6">
      <ModuleHeader
        moduleNumber="Módulo 03"
        subtitleTag="Integrais Definidas"
        title="Integração Numérica"
        description="Regras dos Trapézios e 1/3 de Simpson (simples e repetidas), estimativa do erro de truncamento e visualização da área."
        icon={<AreaChart className="w-5 h-5" />}
        activeModule="integration"
        decimals={decimals}
        onDecimalsChange={onDecimalsChange}
        onBackHome={onBackHome}
        onSwitchModule={onSwitchModule}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          id="module-calc-form"
          onSubmit={handleCalculate}
          className="lg:col-span-5 bg-white border border-[#24b8d5]/30 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="bg-gradient-to-r from-[#e6f1ff] via-[#e4f7fc] to-[#d5f4fa] px-6 py-4 border-b border-slate-200/75">
            <h2 className="font-display text-base font-bold text-[#14264b]">
              Dados de Entrada
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Informe a função integranda, os limites e a regra de quadratura
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div className="bg-[#f4fbfe] border border-[#24b8d5]/25 rounded-xl p-3.5">
              <label htmlFor="int-preset" className="block text-xs font-semibold text-[#0e88a6] mb-1.5">
                Exercícios modelo para testar
              </label>
              <select
                id="int-preset"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) handleApplyPreset(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-[#14264b] focus:outline-none focus:border-[#2457e8] focus:ring-4 focus:ring-[#24b8d5]/18 transition-all duration-150 cursor-pointer"
              >
                <option value="" disabled>
                  Selecione um exemplo pronto...
                </option>
                {INTEGRATION_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="int-method" className="block text-sm font-semibold text-[#14264b] mb-1.5">
                Regra de integração
              </label>
              <select
                id="int-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as IntegrationMethodId)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-[#14264b] focus:outline-none focus:border-[#2457e8] focus:ring-4 focus:ring-[#24b8d5]/18 transition-all duration-150 cursor-pointer"
              >
                <option value="trapezoid_simple">A) Regra dos Trapézios Simples</option>
                <option value="trapezoid_repeated">B) Regra dos Trapézios Repetida</option>
                <option value="simpson_simple">C) Regra 1/3 de Simpson Simples</option>
                <option value="simpson_repeated">
                  D) Regra 1/3 de Simpson Repetida (n par)
                </option>
              </select>
            </div>

          <div>
            <label htmlFor="int-expr" className="block text-sm font-semibold text-[#14264b] mb-1.5">
              Função integranda <span className="font-mono text-slate-600 font-normal">f(x)</span>
            </label>
            <input
              id="int-expr"
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="Ex: exp(x), 1/(1+x), sin(x)"
              className={INPUT_CLASS}
            />
          </div>

          <div className={`grid ${isRepeated ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
            <div>
              <label htmlFor="int-a" className="block text-sm font-semibold text-[#14264b] mb-1">
                Limite inferior a
              </label>
              <input
                id="int-a"
                type="text"
                inputMode="decimal"
                value={a}
                onChange={(e) => setA(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="int-b" className="block text-sm font-semibold text-[#14264b] mb-1">
                Limite superior b
              </label>
              <input
                id="int-b"
                type="text"
                inputMode="decimal"
                value={b}
                onChange={(e) => setB(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            {isRepeated && (
              <div>
                <label htmlFor="int-n" className="block text-sm font-semibold text-[#14264b] mb-1">
                  Subdivisões n
                </label>
                <input
                  id="int-n"
                  type="text"
                  inputMode="numeric"
                  value={n}
                  onChange={(e) => setN(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            )}
          </div>

          {method === 'simpson_repeated' && (
            <p className="text-xs text-[#14264b] bg-[#e6f1ff]/75 border border-[#24b8d5]/35 rounded-xl px-3.5 py-2.5">
              Condição obrigatória: na Regra 1/3 de Simpson Repetida, <strong>n deve ser par</strong>{' '}
              (ex.: 2, 4, 6, 8, ...).
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="int-deriv" className="block text-xs font-semibold text-slate-700 mb-1">
                máx |f{activeMeta.derivativeOrder === 2 ? "''" : '⁽ⁱᵛ⁾'}(x)|{' '}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                id="int-deriv"
                type="text"
                inputMode="decimal"
                value={userMaxDeriv}
                onChange={(e) => setUserMaxDeriv(e.target.value)}
                placeholder="Auto se vazio"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label htmlFor="int-exact" className="block text-xs font-semibold text-slate-700 mb-1">
                Valor exato <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                id="int-exact"
                type="text"
                inputMode="decimal"
                value={exactValue}
                onChange={(e) => setExactValue(e.target.value)}
                placeholder="Opcional"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none pt-0.5">
            <input
              type="checkbox"
              checked={compareMethods}
              onChange={(e) => setCompareMethods(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#2457e8] focus:ring-blue-600 cursor-pointer"
            />
            <span className="inline-flex items-center gap-1.5 font-medium text-[#14264b]">
              <GitCompare className="w-4 h-4 text-[#0e88a6]" />
              Comparar Trapézios × 1/3 de Simpson
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
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#14264b] via-[#2457e8] to-[#24b8d5] rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-150 shadow-sm whitespace-nowrap cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Calcular Integral</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all duration-150 whitespace-nowrap cursor-pointer"
            >
              <Eraser className="w-4 h-4" />
              <span>Limpar</span>
            </button>
            {solution && (
              <button
                type="button"
                onClick={handleNewCalc}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 text-sm font-medium text-[#0e88a6] bg-[#e6f1ff] border border-[#24b8d5]/30 rounded-xl hover:bg-cyan-100/70 active:scale-[0.98] transition-all duration-150 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Novo cálculo</span>
              </button>
            )}
          </div>
          </div>
        </form>

        <div className="lg:col-span-7 space-y-6">
          {!solution ? (
            <div className="bg-white border border-[#24b8d5]/30 rounded-2xl p-8 sm:p-10 shadow-sm space-y-6">
              <div className="space-y-2 text-center max-w-lg mx-auto">
                <h2 className="font-display text-xl font-bold text-[#14264b]">
                  Área de Resultados e Visualização
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Informe a função <span className="font-mono">f(x)</span>, os limites de integração{' '}
                  <span className="font-mono">[a, b]</span> e escolha a regra desejada ao lado.
                </p>
              </div>

              <div className="bg-[#eee9ff]/55 border border-[#7955d9]/20 rounded-2xl p-5 space-y-2">
                <div className="text-xs font-bold text-[#7955d9]">
                  Formulação matemática da regra selecionada
                </div>
                <div className="text-sm font-semibold text-[#14264b]">{activeMeta.name}</div>
                <div className="pt-1 overflow-x-auto text-[#14264b]">
                  <MathFormula tex={activeMeta.formulaLatex} displayMode />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-[#14264b] via-[#2457e8] to-[#24b8d5] text-white rounded-2xl p-4 shadow-md">
                  <div className="text-xs text-[#e6f1ff] font-medium">Integral aproximada</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-white mt-1.5">
                    {formatNum(solution.result, decimals)}
                  </div>
                  <div className="text-xs text-blue-100 mt-1">{solution.method.shortName}</div>
                </div>

                <div className="bg-[#e6f1ff]/65 border border-[#2457e8]/20 rounded-2xl p-4 shadow-xs">
                  <div className="text-xs text-[#2457e8] font-semibold">Passo h</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-[#14264b] mt-1.5">
                    {formatNum(solution.h, decimals)}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">n = m = {solution.n}</div>
                </div>

                <div className="bg-[#eee9ff]/65 border border-[#7955d9]/20 rounded-2xl p-4 shadow-xs">
                  <div className="text-xs text-[#7955d9] font-semibold">Limitante de erro</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-[#14264b] mt-1.5">
                    {formatNum(solution.errorBound, decimals)}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {solution.derivativeSource === 'user' ? 'Informado' : 'Est. numérica'}
                  </div>
                </div>

                <div className="bg-white border border-[#24b8d5]/30 rounded-2xl p-4 shadow-xs">
                  <div className="text-xs text-[#0e88a6] font-semibold">
                    {solution.exactValueProvided !== undefined
                      ? 'Erro verdadeiro'
                      : 'Diferença p/ ref.'}
                  </div>
                  <div className="text-lg font-bold font-mono tabular-nums text-[#14264b] mt-1.5">
                    {formatNum(solution.trueError ?? 0, decimals)}
                  </div>
                  <div className="text-xs font-mono text-slate-500 mt-1">
                    {solution.minSubintervalsForTol !== undefined
                      ? `m (E<10⁻³): ${solution.minSubintervalsForTol}`
                      : '—'}
                  </div>
                </div>
              </div>

              <IntegrationChart
                a={solution.a}
                b={solution.b}
                nodes={solution.nodes}
                evaluateFn={solution.evaluateFn}
                methodKind={
                  solution.method.id.startsWith('trapezoid') ? 'trapezoid' : 'simpson'
                }
                decimals={decimals}
              />

              {comparison && (
                <div className="bg-white border border-[#24b8d5]/30 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#e6f1ff]/75 to-[#dcf7fb]/65 border-b border-slate-200/75">
                    <h3 className="font-display text-base font-bold text-[#14264b]">
                      Comparação: Regra dos Trapézios × Regra 1/3 de Simpson
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200 text-xs text-slate-600">
                          <th className="py-3 px-4 font-semibold">Método</th>
                          <th className="py-3 px-3 font-semibold text-center">n</th>
                          <th className="py-3 px-3 font-semibold text-right">I aproximado</th>
                          <th className="py-3 px-3 font-semibold text-right">Limitante |E|</th>
                          <th className="py-3 px-4 font-semibold text-right">Erro observado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {comparison.map((row) => (
                          <tr key={row.methodId} className="hover:bg-[#e6f1ff]/35 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-[#14264b]">{row.label}</td>
                            {row.available ? (
                              <>
                                <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-600">
                                  {row.nUsed}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[#2457e8]">
                                  {formatNum(row.result!, decimals)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                                  {formatNum(row.errorBound!, decimals)}
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                                  {formatNum(row.diffFromRef ?? 0, decimals)}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                                  {row.nUsed}
                                </td>
                                <td colSpan={3} className="py-2.5 px-4 text-xs text-amber-700">
                                  {row.reason}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#24b8d5]/30 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#e6f1ff]/75 to-[#dcf7fb]/65 border-b border-slate-200/75">
                  <h3 className="font-display text-base font-bold text-[#14264b]">
                    Tabela dos Pontos Utilizados (xᵢ e f(xᵢ))
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-sm text-right border-collapse">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                      <tr>
                        <th className="py-3 px-2.5 text-center font-semibold">i</th>
                        <th className="py-3 px-3 font-semibold">xᵢ</th>
                        <th className="py-3 px-3 font-semibold">f(xᵢ)</th>
                        <th className="py-3 px-3 text-center font-semibold">Peso</th>
                        <th className="py-3 px-4 font-semibold">Peso · f(xᵢ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-[#14264b]">
                      {solution.nodes.map((node) => (
                        <tr key={node.i} className="hover:bg-[#e6f1ff]/35 transition-colors">
                          <td className="py-2.5 px-2.5 text-center text-slate-500">{node.i}</td>
                          <td className="py-2.5 px-3">{formatNum(node.x, decimals)}</td>
                          <td className="py-2.5 px-3">{formatNum(node.fx, decimals)}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{node.weight}</td>
                          <td className="py-2.5 px-4 font-semibold text-[#2457e8]">
                            {formatNum(node.weightedTerm, decimals)}
                          </td>
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

      {stepData && <StepByStepPanel data={stepData} theme="integration" />}
    </div>
  );
}
