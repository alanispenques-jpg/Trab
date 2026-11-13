import { useState } from 'react';
import { formatNum } from '../utils/mathEngine';

interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const DEFAULT_PAD: ChartPadding = { top: 24, right: 24, bottom: 44, left: 62 };
const WIDTH = 760;
const HEIGHT = 360;

function niceStep(range: number, targetTicks = 6): number {
  if (range <= 0 || !Number.isFinite(range)) return 1;
  const rough = range / targetTicks;
  const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
  const fraction = rough / pow10;
  let niceFrac = 1;
  if (fraction <= 1.2) niceFrac = 1;
  else if (fraction <= 2.5) niceFrac = 2;
  else if (fraction <= 5.5) niceFrac = 5;
  else niceFrac = 10;
  return niceFrac * pow10;
}

function generateTicks(min: number, max: number, target = 6): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0];
  if (min === max) return [min - 1, min, min + 1];
  const step = niceStep(max - min, target);
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 1e-6; v += step) {
    ticks.push(Math.abs(v) < 1e-12 ? 0 : v);
    if (ticks.length > 20) break;
  }
  return ticks;
}

function formatTick(v: number): string {
  if (Math.abs(v) < 1e-12) return '0';
  if (Math.abs(v) >= 10000 || (Math.abs(v) > 0 && Math.abs(v) < 0.001)) {
    return v.toExponential(1);
  }
  const rounded = Number(v.toPrecision(4));
  return String(rounded);
}

function computeDomain(values: number[], padRatio = 0.08): [number, number] {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return [-1, 1];
  let min = Math.min(...finite);
  let max = Math.max(...finite);
  if (min === max) {
    const delta = Math.abs(min) > 1 ? Math.abs(min) * 0.2 : 1;
    return [min - delta, max + delta];
  }
  const span = max - min;
  return [min - span * padRatio, max + span * padRatio];
}

// ============================================================================
// 1. ODE CHART
// ============================================================================

export interface OdeChartSeries {
  id: string;
  label: string;
  color: string;
  points: { x: number; y: number }[];
  dashed?: boolean;
}

interface OdeChartProps {
  series: OdeChartSeries[];
  decimals: number;
}

export function OdeChart({ series, decimals }: OdeChartProps) {
  const [hovered, setHovered] = useState<{
    seriesLabel: string;
    x: number;
    y: number;
    px: number;
    py: number;
    color: string;
  } | null>(null);

  const allX = series.flatMap((s) => s.points.map((p) => p.x));
  const allY = series.flatMap((s) => s.points.map((p) => p.y));

  const [xMin, xMax] = computeDomain(allX, 0.05);
  const [yMin, yMax] = computeDomain(allY, 0.12);

  const plotW = WIDTH - DEFAULT_PAD.left - DEFAULT_PAD.right;
  const plotH = HEIGHT - DEFAULT_PAD.top - DEFAULT_PAD.bottom;

  const mapX = (x: number) => DEFAULT_PAD.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const mapY = (y: number) => DEFAULT_PAD.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  const xTicks = generateTicks(xMin, xMax, 7);
  const yTicks = generateTicks(yMin, yMax, 6);

  return (
    <div className="bg-white border border-[#2457e8]/20 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-[#e6f1ff]/55 border-b border-slate-200/75">
        <h3 className="font-display text-base font-bold text-[#14264b]">
          Gráfico da Solução Numérica
        </h3>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
          {series.map((s) => (
            <div key={s.id} className="inline-flex items-center gap-2">
              <span
                className="inline-block w-4 h-0.5 rounded"
                style={{
                  backgroundColor: s.color,
                  borderTop: s.dashed ? `2px dashed ${s.color}` : undefined,
                }}
              />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative w-full overflow-hidden p-4 sm:p-5">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label="Gráfico comparativo da solução numérica da EDO"
        >
          {/* Grid lines */}
          {xTicks.map((t) => {
            const px = mapX(t);
            return (
              <g key={`xg-${t}`}>
                <line
                  x1={px}
                  y1={DEFAULT_PAD.top}
                  x2={px}
                  y2={HEIGHT - DEFAULT_PAD.bottom}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
                <text
                  x={px}
                  y={HEIGHT - DEFAULT_PAD.bottom + 18}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-mono tabular-nums"
                >
                  {formatTick(t)}
                </text>
              </g>
            );
          })}

          {yTicks.map((t) => {
            const py = mapY(t);
            return (
              <g key={`yg-${t}`}>
                <line
                  x1={DEFAULT_PAD.left}
                  y1={py}
                  x2={WIDTH - DEFAULT_PAD.right}
                  y2={py}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
                <text
                  x={DEFAULT_PAD.left - 10}
                  y={py + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[11px] font-mono tabular-nums"
                >
                  {formatTick(t)}
                </text>
              </g>
            );
          })}

          {/* Axes zero lines if inside range */}
          {yMin <= 0 && yMax >= 0 && (
            <line
              x1={DEFAULT_PAD.left}
              y1={mapY(0)}
              x2={WIDTH - DEFAULT_PAD.right}
              y2={mapY(0)}
              stroke="#94a3b8"
              strokeWidth={1.25}
            />
          )}
          {xMin <= 0 && xMax >= 0 && (
            <line
              x1={mapX(0)}
              y1={DEFAULT_PAD.top}
              x2={mapX(0)}
              y2={HEIGHT - DEFAULT_PAD.bottom}
              stroke="#94a3b8"
              strokeWidth={1.25}
            />
          )}

          {/* Plot border */}
          <rect
            x={DEFAULT_PAD.left}
            y={DEFAULT_PAD.top}
            width={plotW}
            height={plotH}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth={1}
          />

          {/* Axis labels */}
          <text
            x={DEFAULT_PAD.left + plotW / 2}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fill-slate-600 text-[12px] font-medium"
          >
            x
          </text>
          <text
            x={16}
            y={DEFAULT_PAD.top + plotH / 2}
            textAnchor="middle"
            transform={`rotate(-90 16 ${DEFAULT_PAD.top + plotH / 2})`}
            className="fill-slate-600 text-[12px] font-medium"
          >
            y(x)
          </text>

          {/* Series paths & points */}
          {series.map((s) => {
            const pathD = s.points
              .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.x)} ${mapY(p.y)}`)
              .join(' ');

            return (
              <g key={s.id}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2.25}
                  strokeDasharray={s.dashed ? '6 4' : undefined}
                />
                {!s.dashed &&
                  s.points.length <= 80 &&
                  s.points.map((p, idx) => {
                    const px = mapX(p.x);
                    const py = mapY(p.y);
                    return (
                      <circle
                        key={`${s.id}-${idx}`}
                        cx={px}
                        cy={py}
                        r={3.5}
                        fill="#ffffff"
                        stroke={s.color}
                        strokeWidth={2}
                        className="cursor-pointer"
                        onMouseEnter={() =>
                          setHovered({
                            seriesLabel: s.label,
                            x: p.x,
                            y: p.y,
                            px,
                            py,
                            color: s.color,
                          })
                        }
                        onMouseLeave={() => setHovered(null)}
                      />
                    );
                  })}
              </g>
            );
          })}

          {/* Hover Tooltip inside SVG */}
          {hovered && (
            <g
              transform={`translate(${
                hovered.px > WIDTH - 190 ? hovered.px - 172 : hovered.px + 12
              }, ${hovered.py < 65 ? hovered.py + 12 : hovered.py - 56})`}
            >
              <rect
                width={160}
                height={48}
                rx={6}
                fill="#14264b"
                fillOpacity={0.96}
              />
              <text x={10} y={17} className="fill-slate-200 text-[11px] font-medium">
                {hovered.seriesLabel}
              </text>
              <text x={10} y={35} className="fill-white text-[11px] font-mono tabular-nums">
                ({formatNum(hovered.x, decimals)}, {formatNum(hovered.y, decimals)})
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// 2. LEAST SQUARES CHART
// ============================================================================

interface LeastSquaresChartProps {
  kind: 'discrete' | 'continuous';
  points?: { x: number; y: number; yHat: number }[];
  xRange: [number, number];
  predict: (x: number) => number;
  originalFn?: (x: number) => number;
  equationLabel: string;
  decimals: number;
}

export function LeastSquaresChart({
  kind,
  points = [],
  xRange,
  predict,
  originalFn,
  equationLabel,
  decimals,
}: LeastSquaresChartProps) {
  const [hoveredPt, setHoveredPt] = useState<{
    x: number;
    y: number;
    yHat: number;
    px: number;
    py: number;
  } | null>(null);

  const [rawMinX, rawMaxX] = xRange;
  const spanX = rawMaxX - rawMinX || 1;
  const padX = kind === 'discrete' ? spanX * 0.1 : 0;
  const xStart = rawMinX - padX;
  const xEnd = rawMaxX + padX;

  const curveSamples = 140;
  const fittedCurve: { x: number; y: number }[] = [];
  const origCurve: { x: number; y: number }[] = [];

  for (let i = 0; i <= curveSamples; i++) {
    const x = xStart + (i / curveSamples) * (xEnd - xStart);
    try {
      const yFit = predict(x);
      if (Number.isFinite(yFit)) fittedCurve.push({ x, y: yFit });
    } catch {
      // Skip asymptote points (e.g. 1/(a0+a1x) pole)
    }
    if (originalFn) {
      try {
        const yOrig = originalFn(x);
        if (Number.isFinite(yOrig)) origCurve.push({ x, y: yOrig });
      } catch {
        // Ignore out of domain
      }
    }
  }

  const allY: number[] = [
    ...points.map((p) => p.y),
    ...fittedCurve.map((p) => p.y),
    ...origCurve.map((p) => p.y),
  ];

  const [xMin, xMax] = [xStart, xEnd];
  const [yMin, yMax] = computeDomain(allY, 0.14);

  const plotW = WIDTH - DEFAULT_PAD.left - DEFAULT_PAD.right;
  const plotH = HEIGHT - DEFAULT_PAD.top - DEFAULT_PAD.bottom;

  const mapX = (x: number) => DEFAULT_PAD.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const mapY = (y: number) => DEFAULT_PAD.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  const xTicks = generateTicks(xMin, xMax, 7);
  const yTicks = generateTicks(yMin, yMax, 6);

  const buildPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.x)} ${mapY(p.y)}`).join(' ');

  return (
    <div className="bg-white border border-[#7955d9]/20 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-[#eee9ff]/60 border-b border-slate-200/75">
        <h3 className="font-display text-base font-bold text-[#14264b]">
          {kind === 'discrete'
            ? 'Diagrama de Dispersão e Curva Ajustada'
            : 'Comparação da Função Original e Curva Ajustada'}
        </h3>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
          {kind === 'discrete' ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#14264b]" />
              Pontos experimentais
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-4 h-0.5 bg-[#14264b]" />
              Função original f(x)
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-[#7955d9]" />
            <span className="font-mono font-medium text-[#14264b]">{equationLabel}</span>
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden p-4 sm:p-5">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label="Gráfico do Método dos Mínimos Quadrados"
        >
          <defs>
            <clipPath id="ls-clip">
              <rect x={DEFAULT_PAD.left} y={DEFAULT_PAD.top} width={plotW} height={plotH} />
            </clipPath>
          </defs>

          {xTicks.map((t) => {
            const px = mapX(t);
            return (
              <g key={`lsx-${t}`}>
                <line
                  x1={px}
                  y1={DEFAULT_PAD.top}
                  x2={px}
                  y2={HEIGHT - DEFAULT_PAD.bottom}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
                <text
                  x={px}
                  y={HEIGHT - DEFAULT_PAD.bottom + 18}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-mono tabular-nums"
                >
                  {formatTick(t)}
                </text>
              </g>
            );
          })}

          {yTicks.map((t) => {
            const py = mapY(t);
            return (
              <g key={`lsy-${t}`}>
                <line
                  x1={DEFAULT_PAD.left}
                  y1={py}
                  x2={WIDTH - DEFAULT_PAD.right}
                  y2={py}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
                <text
                  x={DEFAULT_PAD.left - 10}
                  y={py + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[11px] font-mono tabular-nums"
                >
                  {formatTick(t)}
                </text>
              </g>
            );
          })}

          {yMin <= 0 && yMax >= 0 && (
            <line
              x1={DEFAULT_PAD.left}
              y1={mapY(0)}
              x2={WIDTH - DEFAULT_PAD.right}
              y2={mapY(0)}
              stroke="#94a3b8"
              strokeWidth={1.2}
            />
          )}
          {xMin <= 0 && xMax >= 0 && (
            <line
              x1={mapX(0)}
              y1={DEFAULT_PAD.top}
              x2={mapX(0)}
              y2={HEIGHT - DEFAULT_PAD.bottom}
              stroke="#94a3b8"
              strokeWidth={1.2}
            />
          )}

          <g clipPath="url(#ls-clip)">
            {/* Residual vertical lines */}
            {kind === 'discrete' &&
              points.map((pt, i) => (
                <line
                  key={`res-${i}`}
                  x1={mapX(pt.x)}
                  y1={mapY(pt.y)}
                  x2={mapX(pt.x)}
                  y2={mapY(pt.yHat)}
                  stroke="#a78bfa"
                  strokeWidth={1.35}
                  strokeDasharray="3 3"
                />
              ))}

            {/* Original function in continuous case */}
            {origCurve.length > 1 && (
              <path
                d={buildPath(origCurve)}
                fill="none"
                stroke="#14264b"
                strokeWidth={2.2}
              />
            )}

            {/* Fitted curve */}
            {fittedCurve.length > 1 && (
              <path
                d={buildPath(fittedCurve)}
                fill="none"
                stroke="#7955d9"
                strokeWidth={2.75}
                strokeDasharray={kind === 'continuous' ? '6 4' : undefined}
              />
            )}

            {/* Experimental scatter points */}
            {kind === 'discrete' &&
              points.map((pt, i) => {
                const px = mapX(pt.x);
                const py = mapY(pt.y);
                return (
                  <circle
                    key={`pt-${i}`}
                    cx={px}
                    cy={py}
                    r={5.2}
                    fill="#14264b"
                    stroke="#ffffff"
                    strokeWidth={1.85}
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      setHoveredPt({ x: pt.x, y: pt.y, yHat: pt.yHat, px, py })
                    }
                    onMouseLeave={() => setHoveredPt(null)}
                  />
                );
              })}
          </g>

          <rect
            x={DEFAULT_PAD.left}
            y={DEFAULT_PAD.top}
            width={plotW}
            height={plotH}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth={1}
          />

          <text
            x={DEFAULT_PAD.left + plotW / 2}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fill-slate-600 text-[12px] font-medium"
          >
            x
          </text>
          <text
            x={16}
            y={DEFAULT_PAD.top + plotH / 2}
            textAnchor="middle"
            transform={`rotate(-90 16 ${DEFAULT_PAD.top + plotH / 2})`}
            className="fill-slate-600 text-[12px] font-medium"
          >
            y
          </text>

          {hoveredPt && (
            <g
              transform={`translate(${
                hoveredPt.px > WIDTH - 205 ? hoveredPt.px - 188 : hoveredPt.px + 12
              }, ${hoveredPt.py < 70 ? hoveredPt.py + 12 : hoveredPt.py - 58})`}
            >
              <rect width={176} height={50} rx={6} fill="#14264b" fillOpacity={0.96} />
              <text x={10} y={18} className="fill-white text-[11px] font-mono tabular-nums">
                ({formatNum(hoveredPt.x, decimals)}, {formatNum(hoveredPt.y, decimals)})
              </text>
              <text x={10} y={36} className="fill-[#c4b5fd] text-[11px] font-mono tabular-nums">
                Ajustado: {formatNum(hoveredPt.yHat, decimals)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// 3. INTEGRATION CHART
// ============================================================================

interface IntegrationChartProps {
  a: number;
  b: number;
  nodes: { i: number; x: number; fx: number }[];
  evaluateFn: (x: number) => number;
  methodKind: 'trapezoid' | 'simpson';
  decimals: number;
}

export function IntegrationChart({
  a,
  b,
  nodes,
  evaluateFn,
  methodKind,
  decimals,
}: IntegrationChartProps) {
  const [hoveredNode, setHoveredNode] = useState<{
    i: number;
    x: number;
    fx: number;
    px: number;
    py: number;
  } | null>(null);

  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const span = hi - lo || 1;
  const xMin = lo - span * 0.08;
  const xMax = hi + span * 0.08;

  const curvePts: { x: number; y: number }[] = [];
  const samples = 150;
  for (let s = 0; s <= samples; s++) {
    const x = xMin + (s / samples) * (xMax - xMin);
    try {
      const y = evaluateFn(x);
      if (Number.isFinite(y)) curvePts.push({ x, y });
    } catch {
      // Ignore outside [a, b] domain if function is restricted (e.g. sqrt(x) at x<0)
    }
  }

  const allY = [0, ...nodes.map((n) => n.fx), ...curvePts.map((p) => p.y)];
  const [yMin, yMax] = computeDomain(allY, 0.12);

  const plotW = WIDTH - DEFAULT_PAD.left - DEFAULT_PAD.right;
  const plotH = HEIGHT - DEFAULT_PAD.top - DEFAULT_PAD.bottom;

  const mapX = (x: number) => DEFAULT_PAD.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const mapY = (y: number) => DEFAULT_PAD.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

  const xTicks = generateTicks(xMin, xMax, 7);
  const yTicks = generateTicks(yMin, yMax, 6);

  const zeroY = mapY(0);

  // Build shaded polygon(s) representing the numerical approximation
  const shadedPolygons: string[] = [];
  if (methodKind === 'trapezoid') {
    for (let k = 0; k < nodes.length - 1; k++) {
      const n0 = nodes[k];
      const n1 = nodes[k + 1];
      const d = `M ${mapX(n0.x)} ${zeroY} L ${mapX(n0.x)} ${mapY(n0.fx)} L ${mapX(n1.x)} ${mapY(
        n1.fx
      )} L ${mapX(n1.x)} ${zeroY} Z`;
      shadedPolygons.push(d);
    }
  } else {
    // Parabolic segments through triplets (nodes[k], nodes[k+1], nodes[k+2])
    for (let k = 0; k + 2 < nodes.length; k += 2) {
      const p0 = nodes[k];
      const p1 = nodes[k + 1];
      const p2 = nodes[k + 2];
      const segPts: string[] = [`M ${mapX(p0.x)} ${zeroY}`];
      const steps = 20;
      for (let s = 0; s <= steps; s++) {
        const x = p0.x + (s / steps) * (p2.x - p0.x);
        // Lagrange quadratic interpolation
        const l0 = ((x - p1.x) * (x - p2.x)) / ((p0.x - p1.x) * (p0.x - p2.x));
        const l1 = ((x - p0.x) * (x - p2.x)) / ((p1.x - p0.x) * (p1.x - p2.x));
        const l2 = ((x - p0.x) * (x - p1.x)) / ((p2.x - p0.x) * (p2.x - p1.x));
        const yQuad = p0.fx * l0 + p1.fx * l1 + p2.fx * l2;
        segPts.push(`L ${mapX(x)} ${mapY(yQuad)}`);
      }
      segPts.push(`L ${mapX(p2.x)} ${zeroY} Z`);
      shadedPolygons.push(segPts.join(' '));
    }
  }

  const funcPath = curvePts
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.x)} ${mapY(p.y)}`)
    .join(' ');

  return (
    <div className="bg-white border border-[#24b8d5]/30 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-gradient-to-r from-[#e6f1ff]/75 to-[#dcf7fb]/65 border-b border-slate-200/75">
        <h3 className="font-display text-base font-bold text-[#14264b]">
          Gráfico da Função e Área Integrada
        </h3>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-[#24b8d5]/30 border border-[#24b8d5]" />
            {methodKind === 'trapezoid'
              ? 'Trapézios aproximadores'
              : 'Parábolas de Simpson'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-[#2457e8]" />
            f(x)
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden p-4 sm:p-5">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label="Gráfico da integração numérica com área destacada"
        >
          <defs>
            <clipPath id="int-clip">
              <rect x={DEFAULT_PAD.left} y={DEFAULT_PAD.top} width={plotW} height={plotH} />
            </clipPath>
            <linearGradient id="intShadedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#24b8d5" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#2457e8" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {xTicks.map((t) => {
            const px = mapX(t);
            return (
              <g key={`ix-${t}`}>
                <line
                  x1={px}
                  y1={DEFAULT_PAD.top}
                  x2={px}
                  y2={HEIGHT - DEFAULT_PAD.bottom}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
                <text
                  x={px}
                  y={HEIGHT - DEFAULT_PAD.bottom + 18}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-mono tabular-nums"
                >
                  {formatTick(t)}
                </text>
              </g>
            );
          })}

          {yTicks.map((t) => {
            const py = mapY(t);
            return (
              <g key={`iy-${t}`}>
                <line
                  x1={DEFAULT_PAD.left}
                  y1={py}
                  x2={WIDTH - DEFAULT_PAD.right}
                  y2={py}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
                <text
                  x={DEFAULT_PAD.left - 10}
                  y={py + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[11px] font-mono tabular-nums"
                >
                  {formatTick(t)}
                </text>
              </g>
            );
          })}

          <line
            x1={DEFAULT_PAD.left}
            y1={zeroY}
            x2={WIDTH - DEFAULT_PAD.right}
            y2={zeroY}
            stroke="#94a3b8"
            strokeWidth={1.25}
          />

          <g clipPath="url(#int-clip)">
            {shadedPolygons.map((d, idx) => (
              <path
                key={`poly-${idx}`}
                d={d}
                fill="url(#intShadedGrad)"
                stroke="#24b8d5"
                strokeOpacity={0.75}
                strokeWidth={1.1}
              />
            ))}

            {funcPath && (
              <path d={funcPath} fill="none" stroke="#2457e8" strokeWidth={2.5} />
            )}

            {nodes.length <= 65 &&
              nodes.map((n) => {
                const px = mapX(n.x);
                const py = mapY(n.fx);
                return (
                  <g key={`node-${n.i}`}>
                    <line
                      x1={px}
                      y1={zeroY}
                      x2={px}
                      y2={py}
                      stroke="#24b8d5"
                      strokeOpacity={0.45}
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={px}
                      cy={py}
                      r={4}
                      fill="#ffffff"
                      stroke="#2457e8"
                      strokeWidth={2.1}
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredNode({ i: n.i, x: n.x, fx: n.fx, px, py })
                      }
                      onMouseLeave={() => setHoveredNode(null)}
                    />
                  </g>
                );
              })}
          </g>

          <rect
            x={DEFAULT_PAD.left}
            y={DEFAULT_PAD.top}
            width={plotW}
            height={plotH}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth={1}
          />

          <text
            x={DEFAULT_PAD.left + plotW / 2}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fill-slate-600 text-[12px] font-medium"
          >
            x
          </text>
          <text
            x={16}
            y={DEFAULT_PAD.top + plotH / 2}
            textAnchor="middle"
            transform={`rotate(-90 16 ${DEFAULT_PAD.top + plotH / 2})`}
            className="fill-slate-600 text-[12px] font-medium"
          >
            f(x)
          </text>

          {hoveredNode && (
            <g
              transform={`translate(${
                hoveredNode.px > WIDTH - 195 ? hoveredNode.px - 178 : hoveredNode.px + 12
              }, ${hoveredNode.py < 65 ? hoveredNode.py + 12 : hoveredNode.py - 54})`}
            >
              <rect width={166} height={46} rx={6} fill="#14264b" fillOpacity={0.96} />
              <text x={10} y={17} className="fill-slate-300 text-[11px] font-medium">
                Ponto x{hoveredNode.i}
              </text>
              <text x={10} y={35} className="fill-white text-[11px] font-mono tabular-nums">
                ({formatNum(hoveredNode.x, decimals)}, {formatNum(hoveredNode.fx, decimals)})
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
