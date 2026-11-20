// The paper / chalkboard switch. The whole row is the control (a large tap
// target), announced as a switch that is on or off.
import { useTheme } from '../context/ThemeContext';

export default function ThemeSwitch({ className = '' }) {
  const { isChalkboard, setChalkboard } = useTheme();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChalkboard}
      onClick={() => setChalkboard(!isChalkboard)}
      className={`flex min-h-14 w-full items-center gap-4 rounded-control py-2 text-left ${className}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-ink t-title-md">Chalkboard mode</span>
        <span className="block text-ink-soft t-body">
          {isChalkboard ? 'Dark slate with chalk text' : 'Warm paper with ink text'}
        </span>
      </span>
      {/* The track and knob. The knob slides with transform (120ms). */}
      <span
        aria-hidden="true"
        className={`relative h-8 w-[52px] shrink-0 rounded-pill border-2 transition-colors duration-[120ms] ${
          isChalkboard ? 'border-ink bg-ink' : 'border-control bg-sunken'
        }`}
      >
        <span
          className={`absolute left-[3px] top-[3px] size-[22px] rounded-full transition-transform duration-[120ms] ease-fl-out ${
            isChalkboard ? 'translate-x-5 bg-paper' : 'translate-x-0 bg-control'
          }`}
        />
      </span>
    </button>
  );
}
