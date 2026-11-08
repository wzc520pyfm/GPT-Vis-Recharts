export function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const exponent = Math.floor(Math.log10(raw));
  const fraction = raw / 10 ** exponent;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * 10 ** exponent;
}

export function niceDomain(
  values: number[],
  includeZero = false,
): [number, number] {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return [0, 1];
  let min = Math.min(...finite);
  let max = Math.max(...finite);
  if (includeZero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  if (min === max) {
    const padding = Math.abs(min) > 1 ? Math.abs(min) * 0.1 : 1;
    min -= padding;
    max += padding;
  } else {
    const padding = (max - min) * 0.06;
    min -= padding;
    max += padding;
  }
  return [min, max];
}

export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [min || 0];
  const step = niceStep((max - min) / Math.max(1, count));
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= max + step * 0.001; value += step) {
    ticks.push(Number(value.toPrecision(12)));
    if (ticks.length > count + 4) break;
  }
  return ticks.length ? ticks : [min, max];
}

export function linearScale(
  domain: [number, number],
  range: [number, number],
): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (value: number) => r0 + ((value - d0) / span) * (r1 - r0);
}

export function bandScale(
  count: number,
  range: [number, number],
  padding = 0.18,
): { center: (index: number) => number; width: number; step: number } {
  const [start, end] = range;
  const total = Math.max(1, end - start);
  const step = total / Math.max(1, count);
  const width = step * (1 - padding);
  return {
    center(index: number) {
      return start + step * (index + 0.5);
    },
    width,
    step,
  };
}

export function compactNumber(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `${Number((value / 1_000_000_000).toFixed(1))}B`;
  if (absolute >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (absolute >= 10_000) return `${Number((value / 1_000).toFixed(1))}k`;
  if (absolute >= 1_000) return `${Number((value / 1_000).toFixed(1))}k`;
  if (absolute > 0 && absolute < 1) return String(Number(value.toFixed(3)));
  return String(Number(value.toFixed(2)));
}

export function approximateTextWidth(text: string, fontSize: number): number {
  let units = 0;
  for (const char of text) {
    units += /[\u2e80-\u9fff\uf900-\ufaff]/.test(char) ? 1 : 0.58;
  }
  return units * fontSize;
}
