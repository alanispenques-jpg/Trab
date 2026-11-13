import {
  compileMathExpression,
  evaluateMathExpression,
  formatNum,
  formatSignedTerm,
  gaussLegendreIntegrate,
  solveLinearSystem,
} from './mathEngine';

export type LeastSquaresMode =
  | 'linear'
  | 'parabola'
  | 'parabola_origin_y'
  | 'parabola_origin'
  | 'nonlinear_inverse'
  | 'nonlinear_exponential'
  | 'continuous_linear'
  | 'continuous_parabola';

export interface DataPoint {
  x: number;
  y: number;
}

export interface DiscretePointRow {
  index: number;
  x: number;
  y: number;
  z?: number;
  yHat: number;
  residual: number;
  residualSq: number;
  xSq: number;
  xCu: number;
  xQuad: number;
  xy: number;
  xSqY: number;
  xz?: number;
}

export interface LeastSquaresDiscreteSolution {
  kind: 'discrete';
  mode: Exclude<LeastSquaresMode, 'continuous_linear' | 'continuous_parabola'>;
  modeName: string;
  formulaLatex: string;
  transformationLatex?: string;
  coefficients: {
    a0?: number;
    a1?: number;
    a2?: number;
    A0?: number;
    A1?: number;
  };
  equationText: string;
  equationLatex: string;
  matrixA: number[][];
  vectorB: number[];
  unknownLabels: string[];
  sums: {
    n: number;
    sumX: number;
    sumY: number;
    sumX2: number;
    sumX3: number;
    sumX4: number;
    sumXY: number;
    sumX2Y: number;
    sumZ?: number;
    sumXZ?: number;
  };
  rows: DiscretePointRow[];
  sqr: number;
  sqrLinearized?: number;
  rSquared: number;
  predict: (x: number) => number;
}

export interface LeastSquaresContinuousSolution {
  kind: 'continuous';
  mode: 'continuous_linear' | 'continuous_parabola';
  modeName: string;
  expression: string;
  a: number;
  b: number;
  formulaLatex: string;
  matrixA: number[][];
  vectorB: number[];
  unknownLabels: string[];
  integralLabelsMatrix: string[][];
  integralLabelsRHS: string[];
  coefficients: {
    a0: number;
    a1: number;
    a2?: number;
  };
  equationText: string;
  equationLatex: string;
  integratedSquaredError: number;
  evaluateOriginal: (x: number) => number;
  predict: (x: number) => number;
}

export type LeastSquaresSolution =
  | LeastSquaresDiscreteSolution
  | LeastSquaresContinuousSolution;

export function solveDiscreteLeastSquares(
  points: DataPoint[],
  mode: Exclude<LeastSquaresMode, 'continuous_linear' | 'continuous_parabola'>,
  decimals = 4
): LeastSquaresDiscreteSolution {
  if (points.length < 2) {
    throw new Error('Informe pelo menos 2 pontos experimentais para realizar o ajuste.');
  }

  if (mode === 'parabola' && points.length < 3) {
    throw new Error('O ajuste parabólico completo (3 coeficientes) exige pelo menos 3 pontos distintos.');
  }

  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumX2 = 0;
  let sumX3 = 0;
  let sumX4 = 0;
  let sumXY = 0;
  let sumX2Y = 0;
  let sumZ = 0;
  let sumXZ = 0;

  const zValues: number[] = [];

  for (let i = 0; i < n; i++) {
    const { x, y } = points[i];
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`O ponto #${i + 1} contém valores inválidos.`);
    }

    sumX += x;
    sumY += y;
    const x2 = x * x;
    const x3 = x2 * x;
    const x4 = x2 * x2;
    sumX2 += x2;
    sumX3 += x3;
    sumX4 += x4;
    sumXY += x * y;
    sumX2Y += x2 * y;

    if (mode === 'nonlinear_inverse') {
      if (Math.abs(y) < 1e-14) {
        throw new Error(
          `Divisão por zero na linearização Z = 1/y: o ponto #${i + 1} possui y = 0.`
        );
      }
      const z = 1 / y;
      zValues.push(z);
      sumZ += z;
      sumXZ += x * z;
    } else if (mode === 'nonlinear_exponential') {
      if (y <= 0) {
        throw new Error(
          `Logaritmo indefinido na linearização Z = ln(y): o ponto #${i + 1} possui y = ${y} ≤ 0.`
        );
      }
      const z = Math.log(y);
      zValues.push(z);
      sumZ += z;
      sumXZ += x * z;
    }
  }

  let matrixA: number[][];
  let vectorB: number[];
  let unknownLabels: string[];
  let a0: number | undefined;
  let a1: number | undefined;
  let a2: number | undefined;
  let A0: number | undefined;
  let A1: number | undefined;
  let modeName = '';
  let formulaLatex = '';
  let transformationLatex: string | undefined;
  let predict: (x: number) => number;
  let equationText = '';
  let equationLatex = '';

  if (mode === 'linear') {
    modeName = 'Ajuste Linear (Reta)';
    formulaLatex = 'f(x) = a_0 + a_1 x \\quad (\\text{ou } \\varphi(x) = \\alpha_1 + \\alpha_2 x)';
    matrixA = [
      [n, sumX],
      [sumX, sumX2],
    ];
    vectorB = [sumY, sumXY];
    unknownLabels = ['a_0', 'a_1'];
    const sol = solveLinearSystem(matrixA, vectorB);
    a0 = sol[0];
    a1 = sol[1];
    predict = (x: number) => a0! + a1! * x;
    equationText = `f(x) = ${formatNum(a0, decimals)}${formatSignedTerm(a1, decimals, 'x')}`;
    equationLatex = `f(x) = ${formatNum(a0, decimals)}${formatSignedTerm(a1, decimals, 'x')}`;
  } else if (mode === 'parabola') {
    modeName = 'Ajuste Polinomial (Parábola Completa)';
    formulaLatex = 'f(x) = a_0 + a_1 x + a_2 x^2';
    matrixA = [
      [n, sumX, sumX2],
      [sumX, sumX2, sumX3],
      [sumX2, sumX3, sumX4],
    ];
    vectorB = [sumY, sumXY, sumX2Y];
    unknownLabels = ['a_0', 'a_1', 'a_2'];
    const sol = solveLinearSystem(matrixA, vectorB);
    a0 = sol[0];
    a1 = sol[1];
    a2 = sol[2];
    predict = (x: number) => a0! + a1! * x + a2! * x * x;
    equationText = `f(x) = ${formatNum(a0, decimals)}${formatSignedTerm(a1, decimals, 'x')}${formatSignedTerm(a2, decimals, 'x²')}`;
    equationLatex = `f(x) = ${formatNum(a0, decimals)}${formatSignedTerm(a1, decimals, 'x')}${formatSignedTerm(a2, decimals, 'x^2')}`;
  } else if (mode === 'parabola_origin_y') {
    modeName = 'Parábola pela Origem (Alinhada ao Eixo y)';
    formulaLatex = '\\varphi(x) = \\alpha_1 x^2 \\quad (g_1(x) = x^2)';
    matrixA = [[sumX4]];
    vectorB = [sumX2Y];
    unknownLabels = ['\\alpha_1'];
    const sol = solveLinearSystem(matrixA, vectorB);
    a2 = sol[0];
    predict = (x: number) => a2! * x * x;
    equationText = `φ(x) = ${formatNum(a2, decimals)}x²`;
    equationLatex = `\\varphi(x) = ${formatNum(a2, decimals)}x^2`;
  } else if (mode === 'parabola_origin') {
    modeName = 'Parábola pela Origem (a₀ = 0)';
    formulaLatex = 'f(x) = a_1 x + a_2 x^2';
    matrixA = [
      [sumX2, sumX3],
      [sumX3, sumX4],
    ];
    vectorB = [sumXY, sumX2Y];
    unknownLabels = ['a_1', 'a_2'];
    const sol = solveLinearSystem(matrixA, vectorB);
    a1 = sol[0];
    a2 = sol[1];
    predict = (x: number) => a1! * x + a2! * x * x;
    equationText = `f(x) = ${formatNum(a1, decimals)}x${formatSignedTerm(a2, decimals, 'x²')}`;
    equationLatex = `f(x) = ${formatNum(a1, decimals)}x${formatSignedTerm(a2, decimals, 'x^2')}`;
  } else if (mode === 'nonlinear_inverse') {
    modeName = 'Ajuste Não Linear — Modelo Hiperbólico';
    formulaLatex = 'y \\approx \\frac{1}{a_0 + a_1 x}';
    transformationLatex = 'Z = \\frac{1}{y} \\implies Z \\approx a_0 + a_1 x';
    matrixA = [
      [n, sumX],
      [sumX, sumX2],
    ];
    vectorB = [sumZ, sumXZ];
    unknownLabels = ['a_0', 'a_1'];
    const sol = solveLinearSystem(matrixA, vectorB);
    a0 = sol[0];
    a1 = sol[1];
    predict = (x: number) => {
      const denom = a0! + a1! * x;
      if (Math.abs(denom) < 1e-12) {
        throw new Error(`Divisão por zero no modelo ajustado em x = ${x}.`);
      }
      return 1 / denom;
    };
    equationText = `y ≈ 1 / (${formatNum(a0, decimals)}${formatSignedTerm(a1, decimals, 'x')})`;
    equationLatex = `y \\approx \\frac{1}{${formatNum(a0, decimals)}${formatSignedTerm(a1, decimals, 'x')}}`;
  } else {
    // nonlinear_exponential: y ≈ a0 * a1^x
    modeName = 'Ajuste Não Linear — Modelo Exponencial (a₀ · a₁ˣ)';
    formulaLatex = 'y \\approx a_0 \\cdot a_1^x';
    transformationLatex =
      'Z = \\ln(y) \\implies Z \\approx A_0 + A_1 x,\\quad A_0 = \\ln(a_0),\\; A_1 = \\ln(a_1)';
    matrixA = [
      [n, sumX],
      [sumX, sumX2],
    ];
    vectorB = [sumZ, sumXZ];
    unknownLabels = ['A_0', 'A_1'];
    const sol = solveLinearSystem(matrixA, vectorB);
    A0 = sol[0];
    A1 = sol[1];
    a0 = Math.exp(A0);
    a1 = Math.exp(A1);
    predict = (x: number) => a0! * Math.pow(a1!, x);
    equationText = `y ≈ ${formatNum(a0, decimals)} · (${formatNum(a1, decimals)})^x`;
    equationLatex = `y \\approx ${formatNum(a0, decimals)} \\cdot (${formatNum(a1, decimals)})^x`;
  }

  let sqr = 0;
  let sqrLinearized = 0;
  const yMean = sumY / n;
  let sst = 0;

  const rows: DiscretePointRow[] = points.map((pt, idx) => {
    const yHat = predict(pt.x);
    const residual = pt.y - yHat;
    const residualSq = residual * residual;
    sqr += residualSq;
    sst += (pt.y - yMean) * (pt.y - yMean);

    const z = zValues.length > 0 ? zValues[idx] : undefined;
    if (z !== undefined) {
      const zHat = mode === 'nonlinear_inverse' ? a0! + a1! * pt.x : A0! + A1! * pt.x;
      sqrLinearized += (z - zHat) * (z - zHat);
    }

    return {
      index: idx + 1,
      x: pt.x,
      y: pt.y,
      z,
      yHat,
      residual,
      residualSq,
      xSq: pt.x * pt.x,
      xCu: pt.x * pt.x * pt.x,
      xQuad: pt.x * pt.x * pt.x * pt.x,
      xy: pt.x * pt.y,
      xSqY: pt.x * pt.x * pt.y,
      xz: z !== undefined ? pt.x * z : undefined,
    };
  });

  const rSquared = sst > 1e-14 ? Math.max(-999, 1 - sqr / sst) : 1;

  return {
    kind: 'discrete',
    mode,
    modeName,
    formulaLatex,
    transformationLatex,
    coefficients: { a0, a1, a2, A0, A1 },
    equationText,
    equationLatex,
    matrixA,
    vectorB,
    unknownLabels,
    sums: {
      n,
      sumX,
      sumY,
      sumX2,
      sumX3,
      sumX4,
      sumXY,
      sumX2Y,
      sumZ: zValues.length > 0 ? sumZ : undefined,
      sumXZ: zValues.length > 0 ? sumXZ : undefined,
    },
    rows,
    sqr,
    sqrLinearized: zValues.length > 0 ? sqrLinearized : undefined,
    rSquared,
    predict,
  };
}

export function solveContinuousLeastSquares(
  expression: string,
  a: number,
  b: number,
  mode: 'continuous_linear' | 'continuous_parabola',
  decimals = 4
): LeastSquaresContinuousSolution {
  if (a >= b) {
    throw new Error('No caso contínuo, o limite inferior a deve ser estritamente menor que o limite superior b.');
  }

  const compiled = compileMathExpression(expression, ['x']);
  const evalFn = (x: number) => evaluateMathExpression(compiled, { x }, `x = ${x}`);

  evalFn(a);
  evalFn((a + b) / 2);
  evalFn(b);

  const degree = mode === 'continuous_linear' ? 1 : 2;
  const size = degree + 1;

  const matrixA: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  const vectorB: number[] = new Array(size).fill(0);
  const integralLabelsMatrix: string[][] = Array.from({ length: size }, () =>
    new Array(size).fill('')
  );
  const integralLabelsRHS: string[] = new Array(size).fill('');

  for (let j = 0; j < size; j++) {
    for (let k = 0; k < size; k++) {
      const power = j + k;
      matrixA[j][k] = gaussLegendreIntegrate((x) => Math.pow(x, power), a, b);
      if (power === 0) {
        integralLabelsMatrix[j][k] = `\\int_{${a}}^{${b}} 1\\,dx`;
      } else if (power === 1) {
        integralLabelsMatrix[j][k] = `\\int_{${a}}^{${b}} x\\,dx`;
      } else {
        integralLabelsMatrix[j][k] = `\\int_{${a}}^{${b}} x^{${power}}\\,dx`;
      }
    }

    vectorB[j] = gaussLegendreIntegrate((x) => Math.pow(x, j) * evalFn(x), a, b);
    if (j === 0) {
      integralLabelsRHS[j] = `\\int_{${a}}^{${b}} f(x)\\,dx`;
    } else if (j === 1) {
      integralLabelsRHS[j] = `\\int_{${a}}^{${b}} x\\,f(x)\\,dx`;
    } else {
      integralLabelsRHS[j] = `\\int_{${a}}^{${b}} x^{${j}}\\,f(x)\\,dx`;
    }
  }

  const sol = solveLinearSystem(matrixA, vectorB);
  const a0 = sol[0];
  const a1 = sol[1];
  const a2 = mode === 'continuous_parabola' ? sol[2] : undefined;

  const predict =
    mode === 'continuous_linear'
      ? (x: number) => a0 + a1 * x
      : (x: number) => a0 + a1 * x + a2! * x * x;

  const integratedSquaredError = gaussLegendreIntegrate((x) => {
    const diff = evalFn(x) - predict(x);
    return diff * diff;
  }, a, b);

  const equationText =
    mode === 'continuous_linear'
      ? `φ(x) = ${formatNum(a0, decimals)}${formatSignedTerm(a1, decimals, 'x')}`
      : `φ(x) = ${formatNum(a0, decimals)}${formatSignedTerm(a1, decimals, 'x')}${formatSignedTerm(a2!, decimals, 'x²')}`;

  const equationLatex =
    mode === 'continuous_linear'
      ? `\\varphi(x) = ${formatNum(a0, decimals)}${formatSignedTerm(a1, decimals, 'x')}`
      : `\\varphi(x) = ${formatNum(a0, decimals)}${formatSignedTerm(a1, decimals, 'x')}${formatSignedTerm(a2!, decimals, 'x^2')}`;

  return {
    kind: 'continuous',
    mode,
    modeName:
      mode === 'continuous_linear'
        ? 'Caso Contínuo — Aproximação Linear (Reta)'
        : 'Caso Contínuo — Aproximação Parabólica (2º Grau)',
    expression,
    a,
    b,
    formulaLatex:
      mode === 'continuous_linear'
        ? '\\varphi(x) = \\alpha_1 + \\alpha_2 x \\quad (g_1(x)=1,\\; g_2(x)=x)'
        : '\\varphi(x) = \\alpha_1 + \\alpha_2 x + \\alpha_3 x^2',
    matrixA,
    vectorB,
    unknownLabels: mode === 'continuous_linear' ? ['\\alpha_1', '\\alpha_2'] : ['\\alpha_1', '\\alpha_2', '\\alpha_3'],
    integralLabelsMatrix,
    integralLabelsRHS,
    coefficients: { a0, a1, a2 },
    equationText,
    equationLatex,
    integratedSquaredError,
    evaluateOriginal: evalFn,
    predict,
  };
}

export interface DiscreteComparisonItem {
  mode: Exclude<LeastSquaresMode, 'continuous_linear' | 'continuous_parabola'>;
  label: string;
  available: boolean;
  reason?: string;
  equationText?: string;
  sqr?: number;
  rSquared?: number;
  solution?: LeastSquaresDiscreteSolution;
}

export function compareDiscreteModels(
  points: DataPoint[],
  decimals = 4
): DiscreteComparisonItem[] {
  const candidates: {
    mode: Exclude<LeastSquaresMode, 'continuous_linear' | 'continuous_parabola'>;
    label: string;
  }[] = [
    { mode: 'linear', label: 'Linear (a₀ + a₁x)' },
    { mode: 'parabola', label: 'Parábola completa (a₀ + a₁x + a₂x²)' },
    { mode: 'parabola_origin_y', label: 'Parábola pela origem (α₁x²)' },
    { mode: 'parabola_origin', label: 'Parábola pela origem (a₁x + a₂x²)' },
    { mode: 'nonlinear_inverse', label: 'Não Linear (1 / (a₀ + a₁x))' },
    { mode: 'nonlinear_exponential', label: 'Não Linear (a₀ · a₁ˣ)' },
  ];

  return candidates.map((cand) => {
    try {
      const sol = solveDiscreteLeastSquares(points, cand.mode, decimals);
      return {
        mode: cand.mode,
        label: cand.label,
        available: true,
        equationText: sol.equationText,
        sqr: sol.sqr,
        rSquared: sol.rSquared,
        solution: sol,
      };
    } catch (err) {
      return {
        mode: cand.mode,
        label: cand.label,
        available: false,
        reason: err instanceof Error ? err.message : 'Indisponível para estes dados.',
      };
    }
  });
}
