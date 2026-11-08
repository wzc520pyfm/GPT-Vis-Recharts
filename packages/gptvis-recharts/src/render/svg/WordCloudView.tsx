import type { WordCloudModel } from '../../build/types.js';
import { ChartFrame } from '../Frame.js';
import { approximateTextWidth } from './scale.js';
import { SvgSurface } from './SvgSurface.js';

interface WordBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PlacedWord extends WordBox {
  text: string;
  value: number;
  fontSize: number;
  colorIndex: number;
  angle: number;
}

const WIDTH = 860;
const HEIGHT = 460;
const PADDING = 4;

function hashText(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rotatedBox(width: number, height: number, angle: number): { width: number; height: number } {
  const radians = (Math.abs(angle) * Math.PI) / 180;
  return {
    width: Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians)),
    height: Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians)),
  };
}

function intersects(candidate: WordBox, boxes: WordBox[]): boolean {
  return boxes.some(
    (box) =>
      candidate.x < box.x + box.width &&
      candidate.x + candidate.width > box.x &&
      candidate.y < box.y + box.height &&
      candidate.y + candidate.height > box.y,
  );
}

function fontScale(values: number[], index: number): number {
  const maximum = values[0] ?? 1;
  const minimum = values[values.length - 1] ?? maximum;
  const value = values[index] ?? minimum;
  if (maximum === minimum) return 0.72;
  const rootMaximum = Math.sqrt(Math.max(0, maximum));
  const rootMinimum = Math.sqrt(Math.max(0, minimum));
  const rootValue = Math.sqrt(Math.max(0, value));
  return rootMaximum === rootMinimum
    ? 0.72
    : (rootValue - rootMinimum) / (rootMaximum - rootMinimum);
}

function layoutWords(model: WordCloudModel): PlacedWord[] {
  const values = model.data.map((item) => item.value);
  const boxes: WordBox[] = [];
  const placed: PlacedWord[] = [];
  const centerX = WIDTH / 2;
  const centerY = HEIGHT / 2;

  model.data.forEach((item, index) => {
    const seed = hashText(item.text);
    const preferredAngle =
      item.text.length > 10 && seed % 5 === 0 ? (seed % 2 ? -22 : 22) : 0;
    let solution: PlacedWord | null = null;

    for (let attempt = 0; attempt < 3600 && !solution; attempt += 1) {
      const shrink = Math.min(0.38, Math.floor(attempt / 700) * 0.08);
      const fontSize = (13 + fontScale(values, index) * 39) * (1 - shrink);
      const textWidth = approximateTextWidth(item.text, fontSize);
      const rawHeight = fontSize * 1.08;
      const size = rotatedBox(textWidth, rawHeight, preferredAngle);
      const theta = (seed % 360) * (Math.PI / 180) + attempt * 0.67;
      const radius = 4.15 * Math.sqrt(attempt);
      const x = centerX + Math.cos(theta) * radius * 1.92;
      const y = centerY + Math.sin(theta) * radius * 0.9;
      const box: WordBox = {
        x: x - size.width / 2 - PADDING,
        y: y - size.height / 2 - PADDING,
        width: size.width + PADDING * 2,
        height: size.height + PADDING * 2,
      };
      if (
        box.x < 6 ||
        box.y < 6 ||
        box.x + box.width > WIDTH - 6 ||
        box.y + box.height > HEIGHT - 6 ||
        intersects(box, boxes)
      ) {
        continue;
      }
      boxes.push(box);
      solution = {
        ...box,
        x,
        y,
        text: item.text,
        value: item.value,
        fontSize,
        colorIndex: index,
        angle: preferredAngle,
      };
    }

    if (solution) placed.push(solution);
  });

  return placed;
}

export function WordCloudView({ model }: { model: WordCloudModel }) {
  const theme = model.theme;
  const words = layoutWords(model);

  return (
    <ChartFrame title={model.title} subtitle={model.subtitle} theme={theme} bodyStyle={{ overflow: 'hidden' }}>
      <div style={{ width: '100%', height: '100%', minHeight: 220, position: 'relative' }}>
        <SvgSurface
          title={model.title || 'Word cloud'}
          description={`${model.data.length} weighted terms`}
          width={WIDTH}
          height={HEIGHT}
        >
          {words.map((word) => (
            <text
              key={`${word.text}-${word.x}-${word.y}`}
              x={word.x}
              y={word.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill={theme.palette[word.colorIndex % theme.palette.length]}
              fontFamily={theme.fontFamily}
              fontSize={word.fontSize}
              fontWeight={word.fontSize >= 30 ? 700 : word.fontSize >= 20 ? 600 : 500}
              transform={
                word.angle ? `rotate(${word.angle} ${word.x} ${word.y})` : undefined
              }
            >
              <title>{`${word.text}: ${word.value.toLocaleString()}`}</title>
              {word.text}
            </text>
          ))}
        </SvgSurface>
        <ul
          aria-label="Word frequencies"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
            clipPath: 'inset(50%)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {model.data.map((item, index) => (
            <li key={item.text}>
              {`${index + 1}. ${item.text}: ${item.value.toLocaleString()}`}
            </li>
          ))}
        </ul>
      </div>
    </ChartFrame>
  );
}
