import {
  compileMathExpression,
  evaluateMathExpression,
  gaussLegendreIntegrate,
  type CompiledExpression,
} from './mathEngine';

export type IntegrationMethodId =
  | 'trapezoid_simple'
  | 'trapezoid_repeated'
  | 'simpson_simple'
  | 'simpson_repeated';

export interface IntegrationMethodMeta {
  id: IntegrationMethodId;
  name: string;
  shortName: string;
  formulaLatex: string;
  errorFormulaLatex: string;
  derivativeOrder: 2 | 4;
}

export const INTEGRATION_METHODS: Record<IntegrationMethodId, IntegrationMethodMeta> = {
  trapezoid_simple: {
    id: 'trapezoid_simple',
    name: 'Regra dos Trapézios Simples',
    shortName: 'Trapézio Simples',
    formulaLatex: 'I_T = \\frac{h}{2}\\left[f(x_0) + f(x_1)\\right],\\quad h = b - a',
    errorFormulaLatex: '|E_T| \\le \\frac{h^3}{12} m_2,\\quad m_2 = \\max_{x \\in [x_0, x_1]} |f\'\'(x)|',
    derivativeOrder: 2,
  },
  trapezoid_repeated: {
    id: 'trapezoid_repeated',
    name: 'Regra dos Trapézios Repetida',
    shortName: 'Trapézios Repetida',
    formulaLatex:
      'I_{TR} = \\frac{h}{2}\\left(f(x_0) + 2\\left(f(x_1) + \\dots + f(x_{n-1})\\right) + f(x_n)\\right)',
    errorFormulaLatex:
      '|E_{TR}| \\le m \\frac{h^3}{12} M_2,\\quad M_2 = \\max_{x \\in [a,b]} |f\'\'(x)|,\\; m = \\frac{b-a}{h}',
    derivativeOrder: 2,
  },
  simpson_simple: {
    id: 'simpson_simple',
    name: 'Regra 1/3 de Simpson Simples',
    shortName: '1/3 Simpson Simples',
    formulaLatex: 'I_S = \\frac{h}{3}\\left[f(x_0) + 4f(x_1) + f(x_2)\\right],\\quad h = \\frac{b-a}{2}',
    errorFormulaLatex: '|E_S| \\le \\frac{h^5}{90} m_4,\\quad m_4 = \\max_{x \\in [x_0, x_2]} |f^{(iv)}(x)|',
    derivativeOrder: 4,
  },
  simpson_repeated: {
    id: 'simpson_repeated',
    name: 'Regra 1/3 de Simpson Repetida',
    shortName: '1/3 Simpson Repetida',
    formulaLatex:
      'I_{SR} = \\frac{h}{3}\\left[f(x_0) + f(x_n) + 4\\sum_{j=1}^{n/2} f(x_{2j-1}) + 2\\sum_{j=1}^{n/2 - 1} f(x_{2j})\\right]',
    errorFormulaLatex:
      '|E_{SR}| \\le m \\frac{h^5}{180} M_4,\\quad M_4 = \\max_{x \\in [a,b]} |f^{(iv)}(x)|,\\; m = \\frac{b-a}{h}',
    derivativeOrder: 4,
  },
};

export interface IntegrationNode {
  i: number;
  x: number;
  fx: number;
  weight: number;
  weightedTerm: number;
}

export interface IntegrationSolution {
  method: IntegrationMethodMeta;
  expression: string;
  a: number;
  b: number;
  n: number;
  h: number;
  nodes: IntegrationNode[];
  weightedSum: number;
  result: number;
  referenceIntegral: number;
  exactValueProvided?: number;
  trueError?: number;
  relativeErrorPct?: number;
  estimatedMaxDerivative: number;
  derivativeSource: 'user' | 'numerical';
  errorBound: number;
  minSubintervalsForTol?: number;
  toleranceUsed?: number;
  evaluateFn: (x: number) => number;
}

export interface IntegrationInput {
  expression: string;
  a: number;
  b: number;
  n?: number;
  method: IntegrationMethodId;
  userMaxDerivative?: number;
  exactValue?: number;
  targetTolerance?: number;
}

function estimateMaxDerivativeOrder(
  compiled: CompiledExpression,
  a: number,
  b: number,
  order: 2 | 4
): number {
  const span = Math.abs(b - a);
  const delta = order === 2 ? Math.max(1e-4, span * 1e-4) : Math.max(5e-3, span * 5e-3);
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const samples = 40;
  let maxVal = 0;

  for (let i = 0; i <= samples; i++) {
    const x = lo + (i / samples) * (hi - lo);
    try {
      let deriv = 0;
      if (order === 2) {
        const fm = evaluateMathExpression(compiled, { x: x - delta });
        const f0 = evaluateMathExpression(compiled, { x });
        const fp = evaluateMathExpression(compiled, { x: x + delta });
        deriv = Math.abs((fp - 2 * f0 + fm) / (delta * delta));
      } else {
        const f_2m = evaluateMathExpression(compiled, { x: x - 2 * delta });
        const f_m = evaluateMathExpression(compiled, { x: x - delta });
        const f0 = evaluateMathExpression(compiled, { x });
        const f_p = evaluateMathExpression(compiled, { x: x + delta });
        const f_2p = evaluateMathExpression(compiled, { x: x + 2 * delta });
        deriv = Math.abs(
          (f_2m - 4 * f_m + 6 * f0 - 4 * f_p + f_2p) / Math.pow(delta, 4)
        );
      }
      if (Number.isFinite(deriv) && deriv > maxVal) {
        maxVal = deriv;
      }
    } catch {
      // Ignore boundary points outside domain
    }
  }

  return maxVal;
}

export function solveIntegration(input: IntegrationInput): IntegrationSolution {
  if (input.a === input.b) {
    throw new Error('Os limites de integração a e b devem ser diferentes.');
  }

  const compiled = compileMathExpression(input.expression, ['x']);
  const evalFn = (x: number) => evaluateMathExpression(compiled, { x }, `x = ${x}`);

  let n = 1;
  if (input.method === 'trapezoid_simple') {
    n = 1;
  } else if (input.method === 'simpson_simple') {
    n = 2;
  } else {
    if (input.n === undefined || !Number.isInteger(input.n) || input.n < 1) {
      throw new Error('O número de subdivisões n deve ser um inteiro positivo.');
    }
    if (input.method === 'simpson_repeated') {
      if (input.n < 2 || input.n % 2 !== 0) {
        throw new Error(
          'Condição obrigatória: na Regra 1/3 de Simpson Repetida, o número de subdivisões n deve ser um inteiro PAR maior ou igual a 2.'
        );
      }
    }
    if (input.n > 500) {
      throw new Error('O número de subdivisões n deve ser no máximo 500 para exibição clara.');
    }
    n = input.n;
  }

  const h = (input.b - input.a) / n;
  const nodes: IntegrationNode[] = [];
  let weightedSum = 0;

  for (let i = 0; i <= n; i++) {
    const x = i === n ? input.b : input.a + i * h;
    const fx = evalFn(x);

    let weight = 1;
    if (input.method === 'trapezoid_simple') {
      weight = 1;
    } else if (input.method === 'trapezoid_repeated') {
      weight = i === 0 || i === n ? 1 : 2;
    } else if (input.method === 'simpson_simple' || input.method === 'simpson_repeated') {
      if (i === 0 || i === n) {
        weight = 1;
      } else {
        weight = i % 2 === 1 ? 4 : 2;
      }
    }

    const weightedTerm = weight * fx;
    weightedSum += weightedTerm;

    nodes.push({
      i,
      x,
      fx,
      weight,
      weightedTerm,
    });
  }

  const factor =
    input.method === 'trapezoid_simple' || input.method === 'trapezoid_repeated'
      ? h / 2
      : h / 3;
  const result = factor * weightedSum;

  const referenceIntegral = gaussLegendreIntegrate(evalFn, input.a, input.b, 32);

  const meta = INTEGRATION_METHODS[input.method];
  let estimatedMaxDerivative = 0;
  let derivativeSource: 'user' | 'numerical' = 'numerical';

  if (
    input.userMaxDerivative !== undefined &&
    Number.isFinite(input.userMaxDerivative) &&
    input.userMaxDerivative >= 0
  ) {
    estimatedMaxDerivative = input.userMaxDerivative;
    derivativeSource = 'user';
  } else {
    estimatedMaxDerivative = estimateMaxDerivativeOrder(
      compiled,
      input.a,
      input.b,
      meta.derivativeOrder
    );
  }

  const span = Math.abs(input.b - input.a);
  const absH = Math.abs(h);
  let errorBound = 0;

  if (input.method === 'trapezoid_simple') {
    errorBound = (Math.pow(absH, 3) / 12) * estimatedMaxDerivative;
  } else if (input.method === 'trapezoid_repeated') {
    errorBound = ((n * Math.pow(absH, 3)) / 12) * estimatedMaxDerivative;
  } else if (input.method === 'simpson_simple') {
    errorBound = (Math.pow(absH, 5) / 90) * estimatedMaxDerivative;
  } else {
    errorBound = ((n * Math.pow(absH, 5)) / 180) * estimatedMaxDerivative;
  }

  const tol = input.targetTolerance ?? 1e-3;
  let minSubintervalsForTol: number | undefined;
  if (tol > 0 && Number.isFinite(tol)) {
    if (meta.derivativeOrder === 2) {
      const mMin = Math.ceil(
        Math.sqrt((Math.pow(span, 3) * estimatedMaxDerivative) / (12 * tol))
      );
      minSubintervalsForTol = Math.max(1, mMin);
    } else {
      let mMin = Math.ceil(
        Math.pow((Math.pow(span, 5) * estimatedMaxDerivative) / (180 * tol), 0.25)
      );
      if (mMin < 2) mMin = 2;
      if (mMin % 2 !== 0) mMin += 1;
      minSubintervalsForTol = mMin;
    }
  }

  let trueError: number | undefined;
  let relativeErrorPct: number | undefined;
  if (input.exactValue !== undefined && Number.isFinite(input.exactValue)) {
    trueError = Math.abs(input.exactValue - result);
    if (Math.abs(input.exactValue) > 1e-14) {
      relativeErrorPct = (trueError / Math.abs(input.exactValue)) * 100;
    }
  } else {
    trueError = Math.abs(referenceIntegral - result);
    if (Math.abs(referenceIntegral) > 1e-14) {
      relativeErrorPct = (trueError / Math.abs(referenceIntegral)) * 100;
    }
  }

  return {
    method: meta,
    expression: input.expression,
    a: input.a,
    b: input.b,
    n,
    h,
    nodes,
    weightedSum,
    result,
    referenceIntegral,
    exactValueProvided: input.exactValue,
    trueError,
    relativeErrorPct,
    estimatedMaxDerivative,
    derivativeSource,
    errorBound,
    minSubintervalsForTol,
    toleranceUsed: tol,
    evaluateFn: evalFn,
  };
}

export interface IntegrationComparisonRow {
  methodId: IntegrationMethodId;
  label: string;
  nUsed: number | string;
  available: boolean;
  reason?: string;
  result?: number;
  errorBound?: number;
  diffFromRef?: number;
  solution?: IntegrationSolution;
}

export function compareIntegrationMethods(
  expression: string,
  a: number,
  b: number,
  n: number,
  exactValue?: number
): IntegrationComparisonRow[] {
  const items: { id: IntegrationMethodId; nVal: number }[] = [
    { id: 'trapezoid_simple', nVal: 1 },
    { id: 'trapezoid_repeated', nVal: n },
    { id: 'simpson_simple', nVal: 2 },
    { id: 'simpson_repeated', nVal: n },
  ];

  return items.map((item) => {
    const meta = INTEGRATION_METHODS[item.id];
    try {
      const sol = solveIntegration({
        expression,
        a,
        b,
        n: item.nVal,
        method: item.id,
        exactValue,
      });
      return {
        methodId: item.id,
        label: meta.name,
        nUsed: sol.n,
        available: true,
        result: sol.result,
        errorBound: sol.errorBound,
        diffFromRef: sol.trueError,
        solution: sol,
      };
    } catch (err) {
      return {
        methodId: item.id,
        label: meta.name,
        nUsed: item.nVal,
        available: false,
        reason: err instanceof Error ? err.message : 'Indisponível',
      };
    }
  });
}
