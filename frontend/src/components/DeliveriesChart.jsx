// The 7-day deliveries chart (DESIGN.md section 8), drawn with Recharts:
//   - leaf bars with square tops, today's bar in chilli,
//   - the value printed above each bar, so nothing depends on colour or hover,
//   - mono day labels, dotted perforation grid lines,
//   - one sentence for screen readers (the drawing itself is hidden from them).
// It does not animate: the figures are data the admin reads, not decoration.
// Colours are the theme's CSS variables, so the chart follows paper and
// chalkboard mode without re-rendering.
//
//   <DeliveriesChart days={last7Days} />   days: [{ date: '2026-11-14', portions, deliveries }]
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short' }); // Mon
const longWeekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }); // Monday

/** "2026-11-14" -> a local date (not midnight UTC). */
function localDate(text) {
  const [y, m, d] = text.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** A round step for the grid lines: 1, 2, 5, 10, 20, 25, 50 ... */
function niceStep(top) {
  const raw = top / 4;
  for (const step of [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500]) {
    if (raw <= step) return step;
  }
  return Math.ceil(raw / 1000) * 1000;
}

// The SVG text inherits JetBrains Mono from the wrapper's `font-mono` class.
const MONO = { fontSize: 12 };

export default function DeliveriesChart({ days, height = 200 }) {
  const lastIndex = days.length - 1;
  const data = days.map((d, i) => ({
    ...d,
    label: i === lastIndex ? 'TODAY' : weekday.format(localDate(d.date)).toUpperCase(),
    today: i === lastIndex,
  }));

  // Head room above the tallest bar for its printed value; an empty week
  // still gets a sensible scale.
  const top = Math.max(...days.map((d) => d.portions), 0);
  const step = niceStep(Math.max(top * 1.25, 8));
  const max = Math.ceil(Math.max(top * 1.25, 8) / step) * step;
  const ticks = [];
  for (let v = 0; v < max; v += step) ticks.push(v); // the top line is head room, not a value

  const total = days.reduce((sum, d) => sum + d.portions, 0);
  const summary = `Portions delivered in the last 7 days: ${days
    .map((d, i) => `${i === lastIndex ? 'today' : longWeekday.format(localDate(d.date))} ${d.portions}`)
    .join(', ')}. ${total} in all.`;

  return (
    <figure>
      <figcaption className="sr-only">{summary}</figcaption>
      {/* The drawing is hidden from screen readers (the figcaption reads the
          numbers) and inert, so nothing inside it can take keyboard focus:
          Recharts' own keyboard layer is off (accessibilityLayer={false}),
          and Chrome would otherwise stop on one of its SVG layers. There is
          no tooltip to lose; the values are printed on the bars. */}
      <div inert aria-hidden="true" className="font-mono" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart accessibilityLayer={false} data={data} margin={{ top: 22, right: 4, bottom: 0, left: -12 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="var(--fl-perforation)" strokeDasharray="2 4" />
            <XAxis
              dataKey="label"
              axisLine={{ stroke: 'var(--fl-control)' }}
              tickLine={false}
              interval={0}
              tick={<DayTick />}
            />
            <YAxis
              domain={[0, max]}
              ticks={ticks}
              axisLine={false}
              tickLine={false}
              width={40}
              allowDecimals={false}
              tick={{ ...MONO, fill: 'var(--fl-ink-soft)' }}
            />
            <Bar dataKey="portions" isAnimationActive={false} shape={<PrintedBar />}>
              <LabelList
                dataKey="portions"
                position="top"
                offset={6}
                style={{ ...MONO, fontSize: 13, fontWeight: 700, fill: 'var(--fl-ink)' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

/** A square-topped bar: leaf, or chilli for today. */
function PrintedBar({ x, y, width, height, payload }) {
  if (!height || height < 0) return null;
  // Bars are at most 40px wide, centred in their slot.
  const w = Math.min(width, 40);
  return (
    <rect
      x={x + (width - w) / 2}
      y={y}
      width={w}
      height={height}
      fill={payload.today ? 'var(--fl-chilli)' : 'var(--fl-leaf)'}
    />
  );
}

/** The day under each bar; TODAY in bold ink. */
function DayTick({ x, y, payload, index }) {
  const today = payload.value === 'TODAY';
  return (
    <text
      key={index}
      x={x}
      y={y + 14}
      textAnchor="middle"
      style={{ ...MONO, fontSize: 11, fontWeight: today ? 700 : 500, letterSpacing: '0.04em' }}
      fill={today ? 'var(--fl-ink)' : 'var(--fl-ink-soft)'}
    >
      {payload.value}
    </text>
  );
}
