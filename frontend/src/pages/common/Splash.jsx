// Shown for a moment while a saved session is checked on start-up.
import BrandMark from '../../components/BrandMark';

export default function Splash() {
  return (
    <main className="grid min-h-dvh content-start px-4 pt-6 tablet:px-6 split:px-10 split:pt-[72px]">
      <BrandMark size={34} />
      <p role="status" className="mt-6 text-ink-soft t-mono-sm">
        Opening the counter...
      </p>
    </main>
  );
}
