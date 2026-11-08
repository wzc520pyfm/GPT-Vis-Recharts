const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink';

export function serializeSvg(svg: SVGSVGElement, background?: string): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', SVG_NAMESPACE);
  clone.setAttribute('xmlns:xlink', XLINK_NAMESPACE);

  const viewBox = clone.getAttribute('viewBox')?.trim().split(/\s+/).map(Number) ?? [];
  const width =
    viewBox.length === 4 && Number.isFinite(viewBox[2])
      ? Math.max(1, Number(viewBox[2]))
      : Math.max(1, Number(clone.getAttribute('width')) || 800);
  const height =
    viewBox.length === 4 && Number.isFinite(viewBox[3])
      ? Math.max(1, Number(viewBox[3]))
      : Math.max(1, Number(clone.getAttribute('height')) || 420);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  if (background) {
    const rect = clone.ownerDocument.createElementNS(SVG_NAMESPACE, 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('fill', background);
    clone.insertBefore(rect, clone.firstChild);
  }

  return new XMLSerializer().serializeToString(clone);
}

export function downloadSvg(
  host: HTMLElement | null,
  filename: string,
  background?: string,
): boolean {
  if (!host) return false;
  const svg = host.querySelector('svg');
  if (!(svg instanceof SVGSVGElement)) return false;
  try {
    const source = serializeSvg(svg, background);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    return true;
  } catch {
    return false;
  }
}
