import {
  compileMathExpression,
  evaluateMathExpression,
  type CompiledExpression,
} from './mathEngine';

export type OdeMethodId =
  | 'euler'
  | 'rk2_slide37'
  | 'rk2_heun'
  | 'rk2_ralston'
  | 'rk3_slide40'
  | 'rk3_kutta'
  | 'rk4';

export type OdeStopMode = 'xf' | 'iterations';

export interface OdeMethodMeta {
  id: OdeMethodId;
  name: string;
  shortName: string;
  order: number;
  kIncludesH: boolean;
  formulaLatex: string[];
  slideNote?: string;
}

export const ODE_METHODS: Record<OdeMethodId, OdeMethodMeta> = {
  euler: {
    id: 'euler',
    name: 'Método de Euler (1ª ordem)',
    shortName: 'Euler',
    order: 1,
    kIncludesH: false,
    formulaLatex: ['y_{i+1} = y_i + h \\cdot f(x_i, y_i)'],
  },
  rk2_slide37: {
    id: 'rk2_slide37',
    name: 'Runge-Kutta de 2ª Ordem — Euler Aperfeiçoado (Formulação com h)',
    shortName: 'RK2 (Aperfeiçoado)',
    order: 2,
    kIncludesH: true,
    formulaLatex: [
      'k_1 = h \\cdot f(x_i, y_i)',
      'k_2 = h \\cdot f\\!\\left(x_i + \\frac{1}{2}h,\\; y_i + \\frac{1}{2}k_1\\right)',
      'y_{i+1} = y_i + k_2',
    ],
    slideNote:
      'Formulação com os coeficientes k₁ e k₂ já multiplicados pelo passo de integração h.',
  },
  rk2_heun: {
    id: 'rk2_heun',
    name: 'Runge-Kutta de 2ª Ordem — Método de Heun',
    shortName: 'RK2 (Heun)',
    order: 2,
    kIncludesH: false,
    formulaLatex: [
      'k_1 = f(x_i, y_i)',
      'k_2 = f(x_i + h,\\; y_i + h \\cdot k_1)',
      'y_{i+1} = y_i + \\frac{h}{2}\\left[f(x_i, y_i) + f(x_i + h,\\; y_i + h f(x_i, y_i))\\right]',
    ],
    slideNote:
      'Formulação pela média aritmética das inclinações no início e no fim do intervalo.',
  },
  rk2_ralston: {
    id: 'rk2_ralston',
    name: 'Runge-Kutta de 2ª Ordem — Ralston',
    shortName: 'RK2 (Ralston)',
    order: 2,
    kIncludesH: false,
    formulaLatex: [
      'k_1 = f(x_i, y_i)',
      'k_2 = f\\!\\left(x_i + \\frac{3}{4}h,\\; y_i + \\frac{3}{4}h \\cdot k_1\\right)',
      'y_{i+1} = y_i + \\frac{h}{3}(k_1 + 2k_2)',
    ],
  },
  rk3_slide40: {
    id: 'rk3_slide40',
    name: 'Runge-Kutta de 3ª Ordem (Ralston)',
    shortName: 'RK3 (3ª ordem)',
    order: 3,
    kIncludesH: true,
    formulaLatex: [
      'k_1 = h \\cdot f(x_i, y_i)',
      'k_2 = h \\cdot f\\!\\left(x_i + \\frac{h}{2},\\; y_i + \\frac{k_1}{2}\\right)',
      'k_3 = h \\cdot f\\!\\left(x_i + \\frac{3}{4}h,\\; y_i + \\frac{3}{4}k_2\\right)',
      'y_{i+1} = y_i + \\frac{2}{9}k_1 + \\frac{1}{3}k_2 + \\frac{4}{9}k_3',
    ],
    slideNote:
      'Formulação de 3ª ordem com pesos 2/9, 1/3 e 4/9 e coeficientes k₁, k₂, k₃ multiplicados por h.',
  },
  rk3_kutta: {
    id: 'rk3_kutta',
    name: 'Runge-Kutta de 3ª Ordem — Clássico de Kutta',
    shortName: 'RK3 (Kutta)',
    order: 3,
    kIncludesH: false,
    formulaLatex: [
      'k_1 = f(x_i, y_i)',
      'k_2 = f\\!\\left(x_i + \\frac{h}{2},\\; y_i + \\frac{h}{2}k_1\\right)',
      'k_3 = f(x_i + h,\\; y_i - h \\cdot k_1 + 2h \\cdot k_2)',
      'y_{i+1} = y_i + \\frac{h}{6}(k_1 + 4k_2 + k_3)',
    ],
  },
  rk4: {
    id: 'rk4',
    name: 'Runge-Kutta de 4ª Ordem (RK4 Clássico)',
    shortName: 'RK4',
    order: 4,
    kIncludesH: false,
    formulaLatex: [
      'k_1 = f(x_i, y_i)',
      'k_2 = f\\!\\left(x_i + \\frac{h}{2},\\; y_i + \\frac{h \\cdot k_1}{2}\\right)',
      'k_3 = f\\!\\left(x_i + \\frac{h}{2},\\; y_i + \\frac{h \\cdot k_2}{2}\\right)',
      'k_4 = f(x_i + h,\\; y_i + h \\cdot k_3)',
      'y_{i+1} = y_i + \\frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)',
    ],
  },
};

export interface OdeStepRow {
  i: number;
  x: number;
  y: number;
  k1?: number;
  k2?: number;
  k3?: number;
  k4?: number;
  yNext?: number;
  yExact?: number;
  absError?: number;
}

export interface OdeSolution {
  method: OdeMethodMeta;
  expression: string;
  x0: number;
  y0: number;
  h: number;
  xf: number;
  iterations: number;
  rows: OdeStepRow[];
  finalX: number;
  finalY: number;
  exactExpression?: string;
  warning?: string;
}

export interface OdeComparisonResult {
  primary: OdeSolution;
  series: {
    id: OdeMethodId;
    label: string;
    solution: OdeSolution;
  }[];
}

export interface OdeInput {
  expression: string;
  x0: number;
  y0: number;
  h: number;
  stopMode: OdeStopMode;
  xf?: number;
  iterations?: number;
  method: OdeMethodId;
  exactExpression?: string;
}

function stepSingleMethod(
  compiled: CompiledExpression,
  methodId: OdeMethodId,
  x: number,
  y: number,
  h: number,
  stepIndex: number
): { k1: number; k2?: number; k3?: number; k4?: number; yNext: number } {
  const label = `(x_${stepIndex} = ${x}, y_${stepIndex} = ${y})`;

  if (methodId === 'euler') {
    const k1 = evaluateMathExpression(compiled, { x, y }, label);
    return {
      k1,
      yNext: y + h * k1,
    };
  }

  if (methodId === 'rk2_slide37') {
    const k1 = h * evaluateMathExpression(compiled, { x, y }, label);
    const k2 =
      h *
      evaluateMathExpression(
        compiled,
        { x: x + 0.5 * h, y: y + 0.5 * k1 },
        `k2 da iteração ${stepIndex}`
      );
    return {
      k1,
      k2,
      yNext: y + k2,
    };
  }

  if (methodId === 'rk2_heun') {
    const k1 = evaluateMathExpression(compiled, { x, y }, label);
    const k2 = evaluateMathExpression(
      compiled,
      { x: x + h, y: y + h * k1 },
      `k2 da iteração ${stepIndex}`
    );
    return {
      k1,
      k2,
      yNext: y + (h / 2) * (k1 + k2),
    };
  }

  if (methodId === 'rk2_ralston') {
    const k1 = evaluateMathExpression(compiled, { x, y }, label);
    const k2 = evaluateMathExpression(
      compiled,
      { x: x + (3 * h) / 4, y: y + ((3 * h) / 4) * k1 },
      `k2 da iteração ${stepIndex}`
    );
    return {
      k1,
      k2,
      yNext: y + (h / 3) * (k1 + 2 * k2),
    };
  }

  if (methodId === 'rk3_slide40') {
    const k1 = h * evaluateMathExpression(compiled, { x, y }, label);
    const k2 =
      h *
      evaluateMathExpression(
        compiled,
        { x: x + h / 2, y: y + k1 / 2 },
        `k2 da iteração ${stepIndex}`
      );
    const k3 =
      h *
      evaluateMathExpression(
        compiled,
        { x: x + (3 / 4) * h, y: y + (3 / 4) * k2 },
        `k3 da iteração ${stepIndex}`
      );
    return {
      k1,
      k2,
      k3,
      yNext: y + (2 / 9) * k1 + (1 / 3) * k2 + (4 / 9) * k3,
    };
  }

  if (methodId === 'rk3_kutta') {
    const k1 = evaluateMathExpression(compiled, { x, y }, label);
    const k2 = evaluateMathExpression(
      compiled,
      { x: x + h / 2, y: y + (h / 2) * k1 },
      `k2 da iteração ${stepIndex}`
    );
    const k3 = evaluateMathExpression(
      compiled,
      { x: x + h, y: y - h * k1 + 2 * h * k2 },
      `k3 da iteração ${stepIndex}`
    );
    return {
      k1,
      k2,
      k3,
      yNext: y + (h / 6) * (k1 + 4 * k2 + k3),
    };
  }

  // rk4
  const k1 = evaluateMathExpression(compiled, { x, y }, label);
  const k2 = evaluateMathExpression(
    compiled,
    { x: x + h / 2, y: y + (h * k1) / 2 },
    `k2 da iteração ${stepIndex}`
  );
  const k3 = evaluateMathExpression(
    compiled,
    { x: x + h / 2, y: y + (h * k2) / 2 },
    `k3 da iteração ${stepIndex}`
  );
  const k4 = evaluateMathExpression(
    compiled,
    { x: x + h, y: y + h * k3 },
    `k4 da iteração ${stepIndex}`
  );

  return {
    k1,
    k2,
    k3,
    k4,
    yNext: y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4),
  };
}

export function solveOde(input: OdeInput): OdeSolution {
  const compiled = compileMathExpression(input.expression, ['x', 'y']);
  let exactCompiled: CompiledExpression | undefined;
  if (input.exactExpression && input.exactExpression.trim().length > 0) {
    exactCompiled = compileMathExpression(input.exactExpression, ['x']);
  }

  if (input.h === 0) {
    throw new Error('O passo de integração h não pode ser igual a zero.');
  }

  let n = 0;
  let warning: string | undefined;

  if (input.stopMode === 'xf') {
    if (input.xf === undefined || Number.isNaN(input.xf)) {
      throw new Error('Informe o valor final de x (xf).');
    }
    if (input.xf === input.x0) {
      throw new Error('O valor final xf deve ser diferente da condição inicial x0.');
    }
    const diff = input.xf - input.x0;
    if ((diff > 0 && input.h < 0) || (diff < 0 && input.h > 0)) {
      throw new Error(
        'O sinal do passo h é incompatível com o intervalo de x0 até xf. Para xf > x0, utilize h > 0.'
      );
    }
    const ratio = diff / input.h;
    const rounded = Math.round(ratio);
    if (Math.abs(ratio - rounded) > 1e-6) {
      n = Math.floor(ratio);
      if (n < 1) {
        throw new Error(
          `O passo h = ${input.h} é maior que o intervalo |xf - x0| = ${Math.abs(diff)}. Reduza h para executar pelo menos 1 iteração.`
        );
      }
      warning = `O quociente (xf - x0) / h = ${ratio.toFixed(6)} não é inteiro. Foram executadas ${n} iterações completas até x = ${input.x0 + n * input.h}.`;
    } else {
      n = rounded;
    }
  } else {
    if (input.iterations === undefined || !Number.isInteger(input.iterations) || input.iterations < 1) {
      throw new Error('O número de iterações deve ser um número inteiro maior ou igual a 1.');
    }
    n = input.iterations;
  }

  if (n > 500) {
    throw new Error(
      `O número de iterações calculado (${n}) excede o limite máximo de 500 passos. Aumente o passo h ou reduza o intervalo.`
    );
  }

  const rows: OdeStepRow[] = [];
  let x = input.x0;
  let y = input.y0;

  for (let i = 0; i < n; i++) {
    const step = stepSingleMethod(compiled, input.method, x, y, input.h, i);
    let yExact: number | undefined;
    let absError: number | undefined;

    if (exactCompiled) {
      yExact = evaluateMathExpression(exactCompiled, { x }, `x_${i} = ${x}`);
      absError = Math.abs(yExact - y);
    }

    rows.push({
      i,
      x,
      y,
      k1: step.k1,
      k2: step.k2,
      k3: step.k3,
      k4: step.k4,
      yNext: step.yNext,
      yExact,
      absError,
    });

    x = input.x0 + (i + 1) * input.h;
    y = step.yNext;
  }

  let finalExact: number | undefined;
  let finalError: number | undefined;
  if (exactCompiled) {
    finalExact = evaluateMathExpression(exactCompiled, { x }, `x_${n} = ${x}`);
    finalError = Math.abs(finalExact - y);
  }

  rows.push({
    i: n,
    x,
    y,
    yExact: finalExact,
    absError: finalError,
  });

  return {
    method: ODE_METHODS[input.method],
    expression: input.expression,
    x0: input.x0,
    y0: input.y0,
    h: input.h,
    xf: x,
    iterations: n,
    rows,
    finalX: x,
    finalY: y,
    exactExpression: input.exactExpression?.trim() || undefined,
    warning,
  };
}

export function compareOdeMethods(input: OdeInput): OdeComparisonResult {
  const primary = solveOde(input);
  const rk2Id: OdeMethodId = input.method.startsWith('rk2') ? input.method : 'rk2_slide37';
  const rk3Id: OdeMethodId = input.method.startsWith('rk3') ? input.method : 'rk3_slide40';

  const compareIds: OdeMethodId[] = ['euler', rk2Id, rk3Id, 'rk4'];
  const series = compareIds.map((id) => ({
    id,
    label: ODE_METHODS[id].shortName,
    solution: id === input.method ? primary : solveOde({ ...input, method: id }),
  }));

  return {
    primary,
    series,
  };
}
