import { compile, parse, type EvalFunction, type MathNode } from 'mathjs';

const BUILTIN_FUNCTIONS_AND_CONSTANTS = new Set([
  'sin',
  'cos',
  'tan',
  'cot',
  'sec',
  'csc',
  'asin',
  'acos',
  'atan',
  'atan2',
  'sinh',
  'cosh',
  'tanh',
  'asinh',
  'acosh',
  'atanh',
  'exp',
  'log',
  'log10',
  'log2',
  'sqrt',
  'cbrt',
  'abs',
  'sign',
  'ceil',
  'floor',
  'round',
  'pow',
  'min',
  'max',
  'mod',
  'pi',
  'PI',
  'e',
  'E',
  'tau',
  'phi',
]);

export function normalizeExpression(raw: string): string {
  let expr = raw.trim();
  if (!expr) return '';

  expr = expr
    .replace(/π/g, 'pi')
    .replace(/−/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/·/g, '*')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3');

  // Portuguese trig & log aliases (case-insensitive, word boundaries)
  expr = expr
    .replace(/\barcsen\s*\(/gi, 'asin(')
    .replace(/\barctg\s*\(/gi, 'atan(')
    .replace(/\bsen\s*\(/gi, 'sin(')
    .replace(/\btg\s*\(/gi, 'tan(')
    .replace(/\bctg\s*\(/gi, 'cot(')
    .replace(/\bln\s*\(/gi, 'log(')
    .replace(/\braiz\s*\(/gi, 'sqrt(');

  return expr;
}

export interface CompiledExpression {
  original: string;
  normalized: string;
  compiled: EvalFunction;
}

export function compileMathExpression(
  rawExpr: string,
  allowedVariables: string[]
): CompiledExpression {
  const normalized = normalizeExpression(rawExpr);
  if (!normalized) {
    throw new Error('Informe uma expressão matemática válida.');
  }

  let ast: MathNode;
  try {
    ast = parse(normalized);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sintaxe inválida';
    throw new Error(`Erro de sintaxe na expressão "${rawExpr}": ${msg}`);
  }

  const allowedSet = new Set(allowedVariables);
  const unknownSymbols: string[] = [];

  ast.traverse((node: MathNode) => {
    if (node.type === 'SymbolNode') {
      const sym = (node as unknown as { name: string }).name;
      if (!allowedSet.has(sym) && !BUILTIN_FUNCTIONS_AND_CONSTANTS.has(sym)) {
        if (!unknownSymbols.includes(sym)) {
          unknownSymbols.push(sym);
        }
      }
    }
    if (node.type === 'AssignmentNode') {
      throw new Error('Não utilize sinais de atribuição (=) na expressão; informe apenas o lado direito da função.');
    }
  });

  if (unknownSymbols.length > 0) {
    throw new Error(
      `Variável ou símbolo não reconhecido: "${unknownSymbols.join(', ')}". Utilize apenas: ${allowedVariables.join(', ')}.`
    );
  }

  try {
    const compiled = compile(normalized);
    return {
      original: rawExpr,
      normalized,
      compiled,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao compilar';
    throw new Error(`Não foi possível compilar a expressão "${rawExpr}": ${msg}`);
  }
}

export function evaluateMathExpression(
  expr: CompiledExpression,
  scope: Record<string, number>,
  pointLabel?: string
): number {
  let result: unknown;
  try {
    result = expr.compiled.evaluate(scope);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro de avaliação';
    throw new Error(
      `Erro ao avaliar a função${pointLabel ? ` em ${pointLabel}` : ''}: ${msg}`
    );
  }

  if (typeof result !== 'number' || Number.isNaN(result) || !Number.isFinite(result)) {
    throw new Error(
      `Operação indefinida ou divisão por zero ao avaliar "${expr.original}"${pointLabel ? ` em ${pointLabel}` : ''}.`
    );
  }

  return result;
}

export function parseStrictNumber(raw: string, fieldName: string): number {
  const cleaned = raw.trim().replace(',', '.');
  if (!cleaned) {
    throw new Error(`O campo "${fieldName}" não pode estar vazio.`);
  }
  const value = Number(cleaned);
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    throw new Error(`O campo "${fieldName}" deve conter um número real válido.`);
  }
  return value;
}

export function formatNum(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return 'Indefinido';
  const clean = Math.abs(value) < 1e-14 ? 0 : value;
  if (clean === 0) {
    return (0).toFixed(decimals);
  }
  const abs = Math.abs(clean);
  const threshold = Math.pow(10, -decimals);
  if (abs >= 1e9 || (abs > 0 && abs < threshold)) {
    return clean.toExponential(Math.max(2, Math.min(decimals, 6)));
  }
  return clean.toFixed(decimals);
}

export function formatSignedTerm(coeff: number, decimals: number, suffix: string): string {
  const clean = Math.abs(coeff) < 1e-14 ? 0 : coeff;
  const sign = clean >= 0 ? ' + ' : ' - ';
  return `${sign}${formatNum(Math.abs(clean), decimals)}${suffix}`;
}

export function solveLinearSystem(matrixA: number[][], vectorB: number[]): number[] {
  const n = vectorB.length;
  if (n === 0 || matrixA.length !== n) {
    throw new Error('Dimensões inválidas para resolução do sistema linear.');
  }

  // Deep copy augmented matrix
  const aug: number[][] = matrixA.map((row, i) => [...row, vectorB[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let row = col + 1; row < n; row++) {
      const absVal = Math.abs(aug[row][col]);
      if (absVal > maxVal) {
        maxVal = absVal;
        maxRow = row;
      }
    }

    if (maxVal < 1e-12) {
      throw new Error(
        'O sistema normal é singular ou mal condicionado (determinante próximo de zero / divisão por zero). Verifique os dados fornecidos.'
      );
    }

    if (maxRow !== col) {
      const temp = aug[col];
      aug[col] = aug[maxRow];
      aug[maxRow] = temp;
    }

    const pivot = aug[col][col];
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / pivot;
      if (factor === 0) continue;
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  const x = new Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = aug[row][n];
    for (let j = row + 1; j < n; j++) {
      sum -= aug[row][j] * x[j];
    }
    if (Math.abs(aug[row][row]) < 1e-12) {
      throw new Error('Divisão por zero encontrada na retrosubstituição do sistema linear.');
    }
    x[row] = sum / aug[row][row];
  }

  return x;
}

// 16-point Gauss-Legendre nodes and weights on [-1, 1]
const GL16_NODES = [
  -0.9894009349916499, -0.9445750230732326, -0.8656312023878318, -0.755404408355003,
  -0.6178762444026438, -0.4580167776572274, -0.2816035507792589, -0.0950125098376374,
  0.0950125098376374, 0.2816035507792589, 0.4580167776572274, 0.6178762444026438,
  0.755404408355003, 0.8656312023878318, 0.9445750230732326, 0.9894009349916499,
];

const GL16_WEIGHTS = [
  0.0271524594117541, 0.0622535239386479, 0.0951585116824928, 0.1246289712555339,
  0.1495959888165767, 0.1691565193950025, 0.1826034150449236, 0.1894506104550685,
  0.1894506104550685, 0.1826034150449236, 0.1691565193950025, 0.1495959888165767,
  0.1246289712555339, 0.0951585116824928, 0.0622535239386479, 0.0271524594117541,
];

export function gaussLegendreIntegrate(
  fn: (x: number) => number,
  a: number,
  b: number,
  subintervals = 24
): number {
  if (a === b) return 0;
  const h = (b - a) / subintervals;
  let total = 0;

  for (let s = 0; s < subintervals; s++) {
    const x0 = a + s * h;
    const x1 = x0 + h;
    const mid = 0.5 * (x0 + x1);
    const half = 0.5 * (x1 - x0);
    let localSum = 0;
    for (let k = 0; k < 16; k++) {
      localSum += GL16_WEIGHTS[k] * fn(mid + half * GL16_NODES[k]);
    }
    total += half * localSum;
  }

  return total;
}

export function expressionToLatex(expr: string): string {
  return expr
    .trim()
    .replace(/\*/g, ' \\cdot ')
    .replace(/\bsen\(/gi, '\\operatorname{sen}(')
    .replace(/\bsin\(/gi, '\\sin(')
    .replace(/\bcos\(/gi, '\\cos(')
    .replace(/\btg\(/gi, '\\operatorname{tg}(')
    .replace(/\btan\(/gi, '\\tan(')
    .replace(/\bexp\(([^)]+)\)/gi, 'e^{$1}')
    .replace(/\bln\(/gi, '\\ln(')
    .replace(/\blog\(/gi, '\\ln(')
    .replace(/\bsqrt\(([^)]+)\)/gi, '\\sqrt{$1}')
    .replace(/\bpi\b/gi, '\\pi');
}
