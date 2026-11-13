import {
  AlertCircle,
  Calculator,
  Eraser,
  GitCompare,
  Plus,
  RotateCcw,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  compareDiscreteModels,
  solveContinuousLeastSquares,
  solveDiscreteLeastSquares,
  type DataPoint,
  type DiscreteComparisonItem,
  type LeastSquaresMode,
  type LeastSquaresSolution,
} from '../utils/leastSquaresSolver';
import { expressionToLatex, formatNum, parseStrictNumber } from '../utils/mathEngine';
import type { ActiveRoute } from './HomeView';
import { LeastSquaresChart } from './MathCharts';
import { MathFormula } from './MathFormula';
import { ModuleHeader } from './ModuleHeader';
import { StepByStepPanel, type StepSectionData } from './StepByStepPanel';

interface LeastSquaresModuleProps {
  decimals: number;
  onDecimalsChange: (d: number) => void;
  onBackHome: () => void;
  onSwitchModule?: (route: Exclude<ActiveRoute, 'home'>) => void;
}

interface EditableRow {
  id: number;
  x: string;
  y: string;
}

interface LsPreset {
  id: string;
  title: string;
  mode: LeastSquaresMode;
  points?: { x: string; y: string }[];
  expr?: string;
  a?: string;
  b?: string;
}

const LS_PRESETS: LsPreset[] = [
  {
    id: 'slide_linear_ex1',
    title: 'Ajuste Linear (Reta): (2,1), (5,2), (7,3), (8,3)',
    mode: 'linear',
    points: [
      { x: '2', y: '1' },
      { x: '5', y: '2' },
      { x: '7', y: '3' },
      { x: '8', y: '3' },
    ],
  },
  {
    id: 'slide_parabola_origin_ex2',
    title: 'Parábola pela Origem (α₁x²): 11 pontos experimentais',
    mode: 'parabola_origin_y',
    points: [
      { x: '-1.0', y: '2.05' },
      { x: '-0.75', y: '1.153' },
      { x: '-0.6', y: '0.45' },
      { x: '-0.5', y: '0.4' },
      { x: '-0.3', y: '0.5' },
      { x: '0', y: '0' },
      { x: '0.2', y: '0.2' },
      { x: '0.4', y: '0.6' },
      { x: '0.5', y: '0.512' },
      { x: '0.7', y: '1.2' },
      { x: '1.0', y: '2.05' },
    ],
  },
  {
    id: 'slide_nonlinear_inv',
    title: 'Não Linear Hiperbólico 1/(a₀+a₁x): 7 pontos',
    mode: 'nonlinear_inverse',
    points: [
      { x: '-8', y: '30' },
      { x: '-6', y: '10' },
      { x: '-4', y: '9' },
      { x: '-2', y: '6' },
      { x: '0', y: '5' },
      { x: '2', y: '4' },
      { x: '4', y: '4' },
    ],
  },
  {
    id: 'slide_nonlinear_exp',
    title: 'Não Linear Exponencial a₀·a₁ˣ: 7 pontos',
    mode: 'nonlinear_exponential',
    points: [
      { x: '-8', y: '30' },
      { x: '-6', y: '10' },
      { x: '-4', y: '9' },
      { x: '-2', y: '6' },
      { x: '0', y: '5' },
      { x: '2', y: '4' },
      { x: '4', y: '4' },
    ],
  },
  {
    id: 'slide_continuous_4x3',
    title: 'Caso Contínuo — Reta: f(x) = 4x³ em [0, 1]',
    mode: 'continuous_linear',
    expr: '4*x^3',
    a: '0',
    b: '1',
  },
  {
    id: 'parabola_classic',
    title: 'Parábola Completa: f(x) = a₀ + a₁x + a₂x² (6 pontos)',
    mode: 'parabola',
    points: [
      { x: '-2', y: '5.1' },
      { x: '-1', y: '2.2' },
      { x: '0', y: '1.0' },
      { x: '1', y: '1.8' },
      { x: '2', y: '4.9' },
      { x: '3', y: '9.8' },
    ],
  },
];

const MODE_FORMULA_PREVIEW: Record<LeastSquaresMode, { title: string; tex: string }> = {
  linear: {
    title: 'Ajuste Linear (Reta)',
    tex: 'f(x) = a_0 + a_1 x',
  },
  parabola: {
    title: 'Ajuste Polinomial (Parábola Completa)',
    tex: 'f(x) = a_0 + a_1 x + a_2 x^2',
  },
  parabola_origin_y: {
    title: 'Parábola pela Origem (1 termo)',
    tex: '\\varphi(x) = \\alpha_1 x^2',
  },
  parabola_origin: {
    title: 'Parábola pela Origem (Geral)',
    tex: 'f(x) = a_1 x + a_2 x^2',
  },
  nonlinear_inverse: {
    title: 'Modelo Não Linear Hiperbólico',
    tex: 'y \\approx \\frac{1}{a_0 + a_1 x} \\quad \\Longleftrightarrow \\quad Z = \\frac{1}{y} \\approx a_0 + a_1 x',
  },
  nonlinear_exponential: {
    title: 'Modelo Não Linear Exponencial',
    tex: 'y \\approx a_0 \\cdot a_1^x \\quad \\Longleftrightarrow \\quad Z = \\ln(y) \\approx A_0 + A_1 x',
  },
  continuous_linear: {
    title: 'Caso Contínuo — Aproximação Linear',
    tex: '\\varphi(x) = \\alpha_1 + \\alpha_2 x, \\quad \\min \\int_a^b [f(x)-\\varphi(x)]^2\\,dx',
  },
  continuous_parabola: {
    title: 'Caso Contínuo — Aproximação Parabólica',
    tex: '\\varphi(x) = \\alpha_1 + \\alpha_2 x + \\alpha_3 x^2, \\quad \\min \\int_a^b [f(x)-\\varphi(x)]^2\\,dx',
  },
};

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-xl text-[#14264b] placeholder:text-slate-400 focus:outline-none focus:border-[#7955d9] focus:ring-4 focus:ring-[#7955d9]/12 transition-all duration-150';

let nextRowId = 100;

export function LeastSquaresModule({
  decimals,
  onDecimalsChange,
  onBackHome,
  onSwitchModule,
}: LeastSquaresModuleProps) {
  const [mode, setMode] = useState<LeastSquaresMode>('linear');
  const [rows, setRows] = useState<EditableRow[]>([
    { id: 1, x: '2', y: '1' },
    { id: 2, x: '5', y: '2' },
    { id: 3, x: '7', y: '3' },
    { id: 4, x: '8', y: '3' },
  ]);

  const [contExpr, setContExpr] = useState('4*x^3');
  const [contA, setContA] = useState('0');
  const [contB, setContB] = useState('1');

  const [compareModels, setCompareModels] = useState(false);
  const [comparison, setComparison] = useState<DiscreteComparisonItem[] | null>(null);
  const [solution, setSolution] = useState<LeastSquaresSolution | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isContinuous = mode === 'continuous_linear' || mode === 'continuous_parabola';

  const handleApplyPreset = (presetId: string) => {
    const preset = LS_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setMode(preset.mode);
    if (preset.points) {
      setRows(
        preset.points.map((pt) => ({
          id: nextRowId++,
          x: pt.x,
          y: pt.y,
        }))
      );
    }
    if (preset.expr !== undefined) setContExpr(preset.expr);
    if (preset.a !== undefined) setContA(preset.a);
    if (preset.b !== undefined) setContB(preset.b);
    setSolution(null);
    setComparison(null);
    setError(null);
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, { id: nextRowId++, x: '', y: '' }]);
  };

  const handleRemoveRow = (id: number) => {
    if (rows.length <= 2) {
      setError('Mantenha pelo menos 2 linhas na tabela de pontos.');
      return;
    }
    setError(null);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRowChange = (id: number, field: 'x' | 'y', val: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  const handleClear = () => {
    if (isContinuous) {
      setContExpr('');
      setContA('');
      setContB('');
    } else {
      setRows([
        { id: nextRowId++, x: '', y: '' },
        { id: nextRowId++, x: '', y: '' },
        { id: nextRowId++, x: '', y: '' },
      ]);
    }
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
      if (isContinuous) {
        const aVal = parseStrictNumber(contA, 'Limite inferior a');
        const bVal = parseStrictNumber(contB, 'Limite superior b');
        const sol = solveContinuousLeastSquares(
          contExpr,
          aVal,
          bVal,
          mode as 'continuous_linear' | 'continuous_parabola',
          decimals
        );
        setSolution(sol);
      } else {
        const parsedPoints: DataPoint[] = rows.map((r, idx) => ({
          x: parseStrictNumber(r.x, `x do ponto #${idx + 1}`),
          y: parseStrictNumber(r.y, `y do ponto #${idx + 1}`),
        }));

        const discreteMode = mode as Exclude<
          LeastSquaresMode,
          'continuous_linear' | 'continuous_parabola'
        >;
        const sol = solveDiscreteLeastSquares(parsedPoints, discreteMode, decimals);
        setSolution(sol);

        if (compareModels) {
          setComparison(compareDiscreteModels(parsedPoints, decimals));
        }
      }
    } catch (err) {
      setSolution(null);
      setError(err instanceof Error ? err.message : 'Erro ao calcular o ajuste.');
    }
  };

  const buildMatrixLatex = (A: number[][], unknowns: string[], B: number[]): string => {
    const rowsA = A.map((row) => row.map((v) => formatNum(v, decimals)).join(' & ')).join(
      ' \\\\ '
    );
    const vecU = unknowns.join(' \\\\ ');
    const vecB = B.map((v) => formatNum(v, decimals)).join(' \\\\ ');
    return `\\begin{bmatrix} ${rowsA} \\end{bmatrix} \\begin{bmatrix} ${vecU} \\end{bmatrix} = \\begin{bmatrix} ${vecB} \\end{bmatrix}`;
  };

  const stepData: StepSectionData | null = useMemo(() => {
    if (!solution) return null;

    if (solution.kind === 'discrete') {
      const s = solution;
      const matrixTex = buildMatrixLatex(s.matrixA, s.unknownLabels, s.vectorB);

      const coeffEntries: string[] = [];
      if (s.coefficients.A0 !== undefined && s.coefficients.A1 !== undefined) {
        coeffEntries.push(
          `A_0 = ${formatNum(s.coefficients.A0, decimals)} \\implies a_0 = e^{A_0} = ${formatNum(
            s.coefficients.a0!,
            decimals
          )}`
        );
        coeffEntries.push(
          `A_1 = ${formatNum(s.coefficients.A1, decimals)} \\implies a_1 = e^{A_1} = ${formatNum(
            s.coefficients.a1!,
            decimals
          )}`
        );
      } else if (s.mode === 'parabola_origin_y') {
        coeffEntries.push(`\\alpha_1 = ${formatNum(s.coefficients.a2!, decimals)}`);
      } else {
        if (s.coefficients.a0 !== undefined) {
          coeffEntries.push(`a_0 = ${formatNum(s.coefficients.a0, decimals)}`);
        }
        if (s.coefficients.a1 !== undefined) {
          coeffEntries.push(`a_1 = ${formatNum(s.coefficients.a1, decimals)}`);
        }
        if (s.coefficients.a2 !== undefined) {
          coeffEntries.push(`a_2 = ${formatNum(s.coefficients.a2, decimals)}`);
        }
      }

      const plainLines = [
        `MÓDULO 2 — MÉTODO DOS MÍNIMOS QUADRADOS`,
        `Tipo de ajuste: ${s.modeName}`,
        `Número de pontos: n = ${s.sums.n}`,
        `Somas: Σx=${formatNum(s.sums.sumX, decimals)}, Σy=${formatNum(s.sums.sumY, decimals)}, Σx²=${formatNum(s.sums.sumX2, decimals)}, Σxy=${formatNum(s.sums.sumXY, decimals)}`,
        `Equação ajustada: ${s.equationText}`,
        `SQR = ${formatNum(s.sqr, decimals)}, R² = ${formatNum(s.rSquared, decimals)}`,
      ].join('\n');

      return {
        dados: (
          <div className="space-y-1.5">
            <p>
              Conjunto experimental composto por <strong>n = {s.sums.n}</strong> pontos{' '}
              <span className="font-mono">(xᵢ, yᵢ)</span>:
            </p>
            <p className="font-mono text-xs sm:text-sm text-slate-600 tabular-nums">
              {s.rows
                .map((r) => `(${formatNum(r.x, decimals)}; ${formatNum(r.y, decimals)})`)
                .join(' , ')}
            </p>
          </div>
        ),
        metodo: (
          <p>
            Foi aplicado o <strong>{s.modeName}</strong> pelo Método dos Mínimos Quadrados (MMQ),
            minimizando a soma dos quadrados dos desvios entre os valores observados e a curva
            ajustada.
          </p>
        ),
        formula: (
          <div className="space-y-2 bg-[#eee9ff]/55 border border-[#7955d9]/20 rounded-xl px-4 py-2.5">
            <MathFormula tex={s.formulaLatex} displayMode />
            {s.transformationLatex && (
              <div className="text-sm text-slate-600 pt-1 border-t border-[#7955d9]/15">
                <span className="block text-xs font-medium text-[#7955d9] mb-1">
                  Linearização aplicada:
                </span>
                <MathFormula tex={s.transformationLatex} displayMode />
              </div>
            )}
          </div>
        ),
        substituicao: (
          <div className="space-y-2.5">
            <p>Somatórios obtidos a partir dos pontos experimentais:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs sm:text-sm tabular-nums bg-[#e6f1ff]/50 border border-[#2457e8]/15 rounded-xl p-3.5">
              <div>n = {s.sums.n}</div>
              <div>Σxᵢ = {formatNum(s.sums.sumX, decimals)}</div>
              <div>Σyᵢ = {formatNum(s.sums.sumY, decimals)}</div>
              <div>Σxᵢ² = {formatNum(s.sums.sumX2, decimals)}</div>
              <div>Σxᵢyᵢ = {formatNum(s.sums.sumXY, decimals)}</div>
              {(s.mode === 'parabola' ||
                s.mode === 'parabola_origin' ||
                s.mode === 'parabola_origin_y') && (
                <>
                  <div>Σxᵢ³ = {formatNum(s.sums.sumX3, decimals)}</div>
                  <div>Σxᵢ⁴ = {formatNum(s.sums.sumX4, decimals)}</div>
                  <div>Σxᵢ²yᵢ = {formatNum(s.sums.sumX2Y, decimals)}</div>
                </>
              )}
              {s.sums.sumZ !== undefined && (
                <>
                  <div>ΣZᵢ = {formatNum(s.sums.sumZ, decimals)}</div>
                  <div>ΣxᵢZᵢ = {formatNum(s.sums.sumXZ!, decimals)}</div>
                </>
              )}
            </div>
            <p className="pt-1">Sistema normal substituído:</p>
            <div className="bg-[#eee9ff]/45 border border-[#7955d9]/20 rounded-xl px-4 py-2.5">
              <MathFormula tex={matrixTex} displayMode />
            </div>
          </div>
        ),
        desenvolvimento: (
          <div className="space-y-2">
            <p>Resolvendo o sistema linear normal:</p>
            <div className="bg-[#e6f1ff]/50 border border-[#2457e8]/15 rounded-xl px-4 py-2.5 space-y-1">
              {coeffEntries.map((tex, idx) => (
                <MathFormula key={idx} tex={tex} displayMode />
              ))}
            </div>
            <p className="text-sm text-slate-600 font-mono tabular-nums">
              Soma dos quadrados dos resíduos: SQR = Σ(yᵢ - ŷᵢ)² = {formatNum(s.sqr, decimals)}
              {s.sqrLinearized !== undefined &&
                ` · SQR (variável linearizada Z) = ${formatNum(s.sqrLinearized, decimals)}`}
            </p>
          </div>
        ),
        resultadoFinal: (
          <div className="space-y-2">
            <p>A função que melhor se ajusta aos dados segundo os Mínimos Quadrados é:</p>
            <div className="bg-gradient-to-r from-[#14264b] via-[#5a3cc8] to-[#7955d9] text-white rounded-xl px-5 py-3 shadow-sm">
              <MathFormula tex={s.equationLatex} displayMode />
            </div>
            <p className="text-sm font-mono tabular-nums text-slate-600">
              SQR = {formatNum(s.sqr, decimals)} · Coeficiente de determinação R² ={' '}
              {formatNum(s.rSquared, decimals)}
            </p>
          </div>
        ),
        plainTextSummary: plainLines,
      };
    }

    const c = solution;
    const integralMatrixTex = c.integralLabelsMatrix
      .map((row) => row.join(' & '))
      .join(' \\\\ ');
    const integralRhsTex = c.integralLabelsRHS.join(' \\\\ ');
    const symbolicSystem = `\\begin{bmatrix} ${integralMatrixTex} \\end{bmatrix} \\begin{bmatrix} ${c.unknownLabels.join(
      ' \\\\ '
    )} \\end{bmatrix} = \\begin{bmatrix} ${integralRhsTex} \\end{bmatrix}`;
    const numericSystem = buildMatrixLatex(c.matrixA, c.unknownLabels, c.vectorB);

    const plainLines = [
      `MÓDULO 2 — MÉTODO DOS MÍNIMOS QUADRADOS (CASO CONTÍNUO)`,
      `Função original: f(x) = ${c.expression} em [${c.a}, ${c.b}]`,
      `Modelo ajustado: ${c.equationText}`,
      `Erro quadrático integrado E² = ${formatNum(c.integratedSquaredError, decimals)}`,
    ].join('\n');

    return {
      dados: (
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Função contínua fornecida:{' '}
            <MathFormula tex={`f(x) = ${expressionToLatex(c.expression)}`} />
          </li>
          <li className="font-mono tabular-nums">
            Intervalo de aproximação: [{formatNum(c.a, decimals)}, {formatNum(c.b, decimals)}]
          </li>
        </ul>
      ),
      metodo: (
        <p>
          Foi utilizado o <strong>{c.modeName}</strong>, buscando os coeficientes que minimizam a
          integral do erro quadrático{' '}
          <MathFormula tex={`\\int_{${c.a}}^{${c.b}} [f(x) - \\varphi(x)]^2\\,dx`} />.
        </p>
      ),
      formula: (
        <div className="space-y-2 bg-[#eee9ff]/55 border border-[#7955d9]/20 rounded-xl px-4 py-2.5">
          <MathFormula tex={c.formulaLatex} displayMode />
          <MathFormula tex={symbolicSystem} displayMode />
        </div>
      ),
      substituicao: (
        <div className="space-y-2">
          <p>
            Calculando as integrais definidas sobre o intervalo{' '}
            <span className="font-mono">
              [{formatNum(c.a, decimals)}, {formatNum(c.b, decimals)}]
            </span>
            , obtemos o sistema normal:
          </p>
          <div className="bg-[#e6f1ff]/50 border border-[#2457e8]/15 rounded-xl px-4 py-2.5">
            <MathFormula tex={numericSystem} displayMode />
          </div>
        </div>
      ),
      desenvolvimento: (
        <div className="space-y-2">
          <p>Resolvendo o sistema linear normal:</p>
          <div className="bg-[#e6f1ff]/50 border border-[#2457e8]/15 rounded-xl px-4 py-2.5">
            <MathFormula
              tex={`\\alpha_1 = ${formatNum(c.coefficients.a0, decimals)},\\quad \\alpha_2 = ${formatNum(
                c.coefficients.a1,
                decimals
              )}${
                c.coefficients.a2 !== undefined
                  ? `,\\quad \\alpha_3 = ${formatNum(c.coefficients.a2, decimals)}`
                  : ''
              }`}
              displayMode
            />
          </div>
          <p className="font-mono text-sm tabular-nums text-slate-600">
            Erro quadrático integrado: ∫[f(x) - φ(x)]² dx ={' '}
            {formatNum(c.integratedSquaredError, decimals)}
          </p>
        </div>
      ),
      resultadoFinal: (
        <div className="bg-gradient-to-r from-[#14264b] via-[#5a3cc8] to-[#7955d9] text-white rounded-xl px-5 py-3 shadow-sm">
          <MathFormula tex={c.equationLatex} displayMode />
        </div>
      ),
      plainTextSummary: plainLines,
    };
  }, [solution, decimals]);

  const activePreview = MODE_FORMULA_PREVIEW[mode];

  return (
    <div className="space-y-6">
      <ModuleHeader
        moduleNumber="Módulo 02"
        subtitleTag="Ajuste de Curvas e Regressão"
        title="Método dos Mínimos Quadrados"
        description="Ajuste linear, polinomial, modelos não lineares por linearização e aproximação contínua por sistema de integrais."
        icon={<TrendingUp className="w-5 h-5" />}
        activeModule="least-squares"
        decimals={decimals}
        onDecimalsChange={onDecimalsChange}
        onBackHome={onBackHome}
        onSwitchModule={onSwitchModule}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          id="module-calc-form"
          onSubmit={handleCalculate}
          className="lg:col-span-5 bg-white border border-[#7955d9]/20 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="bg-gradient-to-r from-[#eee9ff] via-[#f4f1ff] to-[#e6f1ff] px-6 py-4 border-b border-slate-200/75">
            <h2 className="font-display text-base font-bold text-[#14264b]">
              Dados de Entrada
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Escolha o modelo de ajuste e informe os pontos ou a função contínua
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div className="bg-[#f8f6ff] border border-[#7955d9]/15 rounded-xl p-3.5">
              <label htmlFor="ls-preset" className="block text-xs font-semibold text-[#7955d9] mb-1.5">
                Exercícios modelo para testar
              </label>
              <select
                id="ls-preset"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) handleApplyPreset(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-[#14264b] focus:outline-none focus:border-[#7955d9] focus:ring-4 focus:ring-[#7955d9]/12 transition-all duration-150 cursor-pointer"
              >
                <option value="" disabled>
                  Selecione um exemplo pronto...
                </option>
                {LS_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ls-mode" className="block text-sm font-semibold text-[#14264b] mb-1.5">
                Tipo de ajuste
              </label>
              <select
                id="ls-mode"
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value as LeastSquaresMode);
                  setSolution(null);
                  setComparison(null);
                  setError(null);
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-[#14264b] focus:outline-none focus:border-[#7955d9] focus:ring-4 focus:ring-[#7955d9]/12 transition-all duration-150 cursor-pointer"
              >
                <optgroup label="Caso Discreto — Pontos Experimentais">
                  <option value="linear">A) Ajuste Linear — Reta: f(x) = a₀ + a₁x</option>
                  <option value="parabola">B) Ajuste Polinomial — Parábola: f(x) = a₀ + a₁x + a₂x²</option>
                  <option value="parabola_origin_y">
                    B) Parábola pela Origem (1 termo): φ(x) = α₁x²
                  </option>
                  <option value="parabola_origin">
                    B) Parábola pela Origem (Geral): f(x) = a₁x + a₂x²
                  </option>
                  <option value="nonlinear_inverse">
                    C) Não Linear Hiperbólico: y ≈ 1 / (a₀ + a₁x)
                  </option>
                  <option value="nonlinear_exponential">
                    C) Não Linear Exponencial: y ≈ a₀ · a₁ˣ
                  </option>
                </optgroup>
                <optgroup label="D) Caso Contínuo — Sistema de Integrais">
                  <option value="continuous_linear">Contínuo — Reta: φ(x) = α₁ + α₂x</option>
                  <option value="continuous_parabola">
                    Contínuo — Parábola: φ(x) = α₁ + α₂x + α₃x²
                  </option>
                </optgroup>
              </select>
            </div>

          {isContinuous ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="ls-cont-expr"
                  className="block text-sm font-semibold text-[#14264b] mb-1.5"
                >
                  Função contínua <span className="font-mono text-slate-600 font-normal">f(x)</span>
                </label>
                <input
                  id="ls-cont-expr"
                  type="text"
                  value={contExpr}
                  onChange={(e) => setContExpr(e.target.value)}
                  placeholder="Ex: 4*x^3, exp(x), sin(x)"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ls-cont-a" className="block text-sm font-semibold text-[#14264b] mb-1">
                    Limite inferior a
                  </label>
                  <input
                    id="ls-cont-a"
                    type="text"
                    inputMode="decimal"
                    value={contA}
                    onChange={(e) => setContA(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="ls-cont-b" className="block text-sm font-semibold text-[#14264b] mb-1">
                    Limite superior b
                  </label>
                  <input
                    id="ls-cont-b"
                    type="text"
                    inputMode="decimal"
                    value={contB}
                    onChange={(e) => setContB(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#14264b]">
                  Tabela de pontos ({rows.length} pontos)
                </span>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#7955d9] bg-[#eee9ff] border border-[#7955d9]/25 rounded-lg hover:bg-[#e5ddff] active:scale-[0.98] transition-all duration-150 whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar ponto</span>
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 bg-[#eee9ff]/75 border-b border-[#7955d9]/15 text-xs text-[#14264b]">
                    <tr>
                      <th className="py-2.5 px-2 text-center font-semibold w-10">#</th>
                      <th className="py-2.5 px-2 text-left font-semibold">xᵢ</th>
                      <th className="py-2.5 px-2 text-left font-semibold">yᵢ</th>
                      <th className="py-2.5 px-2 text-center font-semibold w-10">
                        <span className="sr-only">Remover</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r, idx) => (
                      <tr key={r.id} className="bg-white hover:bg-[#eee9ff]/25 transition-colors">
                        <td className="py-1.5 px-2 text-center text-xs font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            aria-label={`x do ponto ${idx + 1}`}
                            value={r.x}
                            onChange={(e) => handleRowChange(r.id, 'x', e.target.value)}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-[#14264b] focus:outline-none focus:border-[#7955d9] focus:ring-2 focus:ring-[#7955d9]/15 transition-all"
                          />
                        </td>
                        <td className="py-1.5 px-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            aria-label={`y do ponto ${idx + 1}`}
                            value={r.y}
                            onChange={(e) => handleRowChange(r.id, 'y', e.target.value)}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-[#14264b] focus:outline-none focus:border-[#7955d9] focus:ring-2 focus:ring-[#7955d9]/15 transition-all"
                          />
                        </td>
                        <td className="py-1.5 px-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(r.id)}
                            aria-label={`Remover ponto ${idx + 1}`}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={compareModels}
                  onChange={(e) => setCompareModels(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#7955d9] focus:ring-[#7955d9] cursor-pointer"
                />
                <span className="inline-flex items-center gap-1.5 font-medium text-[#14264b]">
                  <GitCompare className="w-4 h-4 text-[#7955d9]" />
                  Comparar modelos (SQR e R²)
                </span>
              </label>
            </div>
          )}

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
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#7955d9] to-[#2457e8] rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-150 shadow-sm whitespace-nowrap cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Calcular Ajuste</span>
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
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 text-sm font-medium text-[#7955d9] bg-[#eee9ff] border border-[#7955d9]/25 rounded-xl hover:bg-purple-100 active:scale-[0.98] transition-all duration-150 whitespace-nowrap cursor-pointer"
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
            <div className="bg-white border border-[#7955d9]/20 rounded-2xl p-8 sm:p-10 shadow-sm space-y-6">
              <div className="space-y-2 text-center max-w-lg mx-auto">
                <h2 className="font-display text-xl font-bold text-[#14264b]">
                  Área de Resultados e Visualização
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Insira ou edite os pontos experimentais na tabela ao lado (ou escolha um exemplo
                  pronto) e clique em <strong>Calcular Ajuste</strong>.
                </p>
              </div>

              <div className="bg-[#eee9ff]/60 border border-[#7955d9]/20 rounded-2xl p-5 space-y-2">
                <div className="text-xs font-bold text-[#7955d9]">
                  Formulação matemática do modelo selecionado
                </div>
                <div className="text-sm font-semibold text-[#14264b]">{activePreview.title}</div>
                <div className="pt-1 overflow-x-auto text-[#14264b]">
                  <MathFormula tex={activePreview.tex} displayMode />
                </div>
              </div>
            </div>
          ) : solution.kind === 'discrete' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 bg-gradient-to-br from-[#14264b] via-[#5a3cc8] to-[#7955d9] text-white rounded-2xl p-5 shadow-md">
                  <div className="text-xs text-[#eee9ff] font-medium">Equação da curva ajustada</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-white mt-1.5 break-all">
                    {solution.equationText}
                  </div>
                  <div className="text-xs text-purple-100/90 mt-1">{solution.modeName}</div>
                </div>

                <div className="bg-[#eee9ff]/60 border border-[#7955d9]/20 rounded-2xl p-5 shadow-xs">
                  <div className="text-xs text-[#7955d9] font-semibold">Resíduos &amp; Ajuste</div>
                  <div className="text-base font-bold font-mono tabular-nums text-[#14264b] mt-1.5">
                    SQR = {formatNum(solution.sqr, decimals)}
                  </div>
                  <div className="text-xs font-mono tabular-nums text-[#2457e8] font-semibold mt-1">
                    R² = {formatNum(solution.rSquared, decimals)}
                  </div>
                </div>
              </div>

              <LeastSquaresChart
                kind="discrete"
                points={solution.rows.map((r) => ({ x: r.x, y: r.y, yHat: r.yHat }))}
                xRange={[
                  Math.min(...solution.rows.map((r) => r.x)),
                  Math.max(...solution.rows.map((r) => r.x)),
                ]}
                predict={solution.predict}
                equationLabel={solution.equationText}
                decimals={decimals}
              />

              {comparison && (
                <div className="bg-white border border-[#7955d9]/20 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 sm:px-6 py-4 bg-[#eee9ff]/60 border-b border-slate-200/75">
                    <h3 className="font-display text-base font-bold text-[#14264b]">
                      Comparação entre Modelos de Ajuste
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200 text-xs text-slate-600">
                          <th className="py-3 px-4 font-semibold">Modelo</th>
                          <th className="py-3 px-3 font-semibold">Equação ajustada</th>
                          <th className="py-3 px-3 font-semibold text-right">SQR</th>
                          <th className="py-3 px-4 font-semibold text-right">R²</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {comparison.map((item) => (
                          <tr key={item.mode} className="hover:bg-[#eee9ff]/35 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-[#14264b] whitespace-nowrap">
                              {item.label}
                            </td>
                            {item.available ? (
                              <>
                                <td className="py-2.5 px-3 font-mono text-xs text-slate-700">
                                  {item.equationText}
                                </td>
                                <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-[#7955d9]">
                                  {formatNum(item.sqr!, decimals)}
                                </td>
                                <td className="py-2.5 px-4 font-mono tabular-nums text-right text-slate-700">
                                  {formatNum(item.rSquared!, decimals)}
                                </td>
                              </>
                            ) : (
                              <td colSpan={3} className="py-2.5 px-3 text-xs text-slate-500">
                                {item.reason}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#7955d9]/20 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 sm:px-6 py-4 bg-[#eee9ff]/60 border-b border-slate-200/75">
                  <h3 className="font-display text-base font-bold text-[#14264b]">
                    Tabela dos Dados, Termos Intermediários e Resíduos
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-xs text-slate-600">
                        <th className="py-3 px-2.5 text-center font-semibold">i</th>
                        <th className="py-3 px-2.5 font-semibold">xᵢ</th>
                        <th className="py-3 px-2.5 font-semibold">yᵢ</th>
                        {solution.rows[0]?.z !== undefined && (
                          <th className="py-3 px-2.5 font-semibold">Zᵢ</th>
                        )}
                        <th className="py-3 px-2.5 font-semibold">xᵢ²</th>
                        <th className="py-3 px-2.5 font-semibold">xᵢ·yᵢ</th>
                        <th className="py-3 px-2.5 font-semibold">ŷᵢ</th>
                        <th className="py-3 px-3 font-semibold">(yᵢ - ŷᵢ)²</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-[#14264b]">
                      {solution.rows.map((r) => (
                        <tr key={r.index} className="hover:bg-[#eee9ff]/35 transition-colors">
                          <td className="py-2.5 px-2.5 text-center text-slate-500">{r.index}</td>
                          <td className="py-2.5 px-2.5">{formatNum(r.x, decimals)}</td>
                          <td className="py-2.5 px-2.5">{formatNum(r.y, decimals)}</td>
                          {r.z !== undefined && (
                            <td className="py-2.5 px-2.5 text-slate-600">{formatNum(r.z, decimals)}</td>
                          )}
                          <td className="py-2.5 px-2.5 text-slate-600">{formatNum(r.xSq, decimals)}</td>
                          <td className="py-2.5 px-2.5 text-slate-600">{formatNum(r.xy, decimals)}</td>
                          <td className="py-2.5 px-2.5 font-semibold text-[#7955d9]">
                            {formatNum(r.yHat, decimals)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {formatNum(r.residualSq, decimals)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-200 bg-[#eee9ff]/40 font-mono tabular-nums font-semibold text-[#14264b] text-xs sm:text-sm">
                      <tr>
                        <td className="py-2.5 px-2.5 text-center">Σ</td>
                        <td className="py-2.5 px-2.5">
                          {formatNum(solution.sums.sumX, decimals)}
                        </td>
                        <td className="py-2.5 px-2.5">
                          {formatNum(solution.sums.sumY, decimals)}
                        </td>
                        {solution.sums.sumZ !== undefined && (
                          <td className="py-2.5 px-2.5">
                            {formatNum(solution.sums.sumZ, decimals)}
                          </td>
                        )}
                        <td className="py-2.5 px-2.5">
                          {formatNum(solution.sums.sumX2, decimals)}
                        </td>
                        <td className="py-2.5 px-2.5">
                          {formatNum(solution.sums.sumXY, decimals)}
                        </td>
                        <td className="py-2.5 px-2.5 text-slate-400">—</td>
                        <td className="py-2.5 px-3 text-[#7955d9]">
                          {formatNum(solution.sqr, decimals)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 bg-gradient-to-br from-[#14264b] via-[#5a3cc8] to-[#7955d9] text-white rounded-2xl p-5 shadow-md">
                  <div className="text-xs text-[#eee9ff] font-medium">
                    Função aproximadora ajustada
                  </div>
                  <div className="text-base sm:text-lg font-bold font-mono text-white mt-1.5">
                    {solution.equationText}
                  </div>
                  <div className="text-xs text-purple-100/90 mt-1">{solution.modeName}</div>
                </div>
                <div className="bg-[#eee9ff]/60 border border-[#7955d9]/20 rounded-2xl p-5 shadow-xs">
                  <div className="text-xs text-[#7955d9] font-semibold">Erro quadrático integrado</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-[#14264b] mt-1.5">
                    {formatNum(solution.integratedSquaredError, decimals)}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    ∫ [f(x) - φ(x)]² dx
                  </div>
                </div>
              </div>

              <LeastSquaresChart
                kind="continuous"
                xRange={[solution.a, solution.b]}
                predict={solution.predict}
                originalFn={solution.evaluateOriginal}
                equationLabel={solution.equationText}
                decimals={decimals}
              />
            </>
          )}
        </div>
      </div>

      {stepData && <StepByStepPanel data={stepData} theme="least-squares" />}
    </div>
  );
}
