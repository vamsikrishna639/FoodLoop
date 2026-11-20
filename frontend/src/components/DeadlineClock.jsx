// A small ring countdown to the pickup deadline, like a kitchen timer.
// Ink normally, turmeric under 1 hour, chilli under 15 minutes, and an
// EXPIRED stamp once the deadline has passed. The time is always printed
// beside the ring, so the colour is never the only signal.
import { useEffect, useState } from 'react';
import StatusStamp from './StatusStamp';

const FULL_RING_MS = 6 * 60 * 60 * 1000; // the ring is full with 6 hours or more left

/** "3h 05m", "45m", "50s", "2d 4h" */
export function formatLeft(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h >= 1) return `${h}h ${String(m % 60).padStart(2, '0')}m`;
  if (m >= 1) return `${m}m`;
  return `${Math.max(0, s)}s`;
}

export default function DeadlineClock({ deadline, size = 40, onBoard = false }) {
  const end = new Date(deadline).getTime();
  const [now, setNow] = useState(() => Date.now());
  const left = end - now;

  // Tick every second in the final minute, otherwise every 20 seconds.
  // Nothing ticks once the deadline has passed.
  useEffect(() => {
    if (left <= 0) return undefined;
    const id = setTimeout(() => setNow(Date.now()), left < 60000 ? 1000 : 20000);
    return () => clearTimeout(id);
  }, [left]);

  if (left <= 0) return <StatusStamp kind="expired" size="sm" />;

  const minutes = left / 60000;
  const [ring, text, note] =
    minutes < 15
      ? ['text-chilli', onBoard ? 'text-chilli' : 'text-chilli-deep', 'Hurry']
      : minutes < 60
        ? ['text-turmeric', onBoard ? 'text-turmeric' : 'text-turmeric-deep', 'Closing']
        : onBoard
          ? ['text-chalk', 'text-chalk', 'Left']
          : ['text-ink', 'text-ink', 'Left'];

  const fraction = Math.min(1, Math.max(0.04, left / FULL_RING_MS));
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const label = formatLeft(left);

  return (
    <div role="img" aria-label={`Pickup closes in ${label}`} className="flex shrink-0 items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className={ring}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={onBoard ? 'stroke-chalk-line' : 'stroke-perforation'}
        />
        {/* Time left, drawn clockwise from 12 o'clock. */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={`${circumference * fraction} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* The timer's knob: a tick at 12 o'clock and a centre dot. */}
        <line x1={size / 2} y1="0" x2={size / 2} y2={stroke + 3} stroke="currentColor" strokeWidth="2" />
        <circle cx={size / 2} cy={size / 2} r="2" fill="currentColor" />
      </svg>
      <div aria-hidden="true" className={text}>
        <p className="t-mono font-bold leading-tight">{label}</p>
        <p className="t-mono-sm">{note}</p>
      </div>
    </div>
  );
}
