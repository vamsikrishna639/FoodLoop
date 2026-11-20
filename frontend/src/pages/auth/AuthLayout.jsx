// Shared frame for the sign-in and create-account pages.
//   900px and wider: a chalkboard panel on the left, the form on paper at right.
//   Narrower:        a short chalkboard band on top, the form underneath.
// The form is left-aligned at every width, in line with the logo.
import BrandMark from '../../components/BrandMark';
import { ChalkItem } from '../../components/Chalkboard';

export default function AuthLayout({ children, formWidth = 'max-w-[440px]' }) {
  return (
    <div className="min-h-dvh split:grid split:grid-cols-[clamp(380px,44vw,620px)_1fr]">
      {/* Phones and tablets: the band. */}
      <header className="on-board bg-board px-4 py-4 tablet:px-6 split:hidden">
        <BrandMark onBoard size={28} />
      </header>

      {/* Wide screens: the menu board, written like a canteen menu. */}
      <aside className="on-board hidden bg-board p-12 split:block">
        <div className="sticky top-12">
          <BrandMark onBoard size={34} />
          <p className="mt-[72px] t-display-lg text-chalk">Surplus food, served before the bell.</p>
          <p className="mt-6 max-w-[46ch] text-chalk-soft t-body-lg">
            The canteen posts what is left after service. Someone who needs it asks for a share. A volunteer carries it
            over.
          </p>
          <div className="mt-12">
            <ChalkItem name="Canteen" trailing="posts surplus" />
            <ChalkItem name="Recipient" trailing="requests a share" />
            <ChalkItem name="Volunteer" trailing="picks up, delivers" />
            <ChalkItem name="Admin" trailing="keeps it fair" />
          </div>
        </div>
      </aside>

      <main id="main" className="px-4 pb-12 pt-6 tablet:px-6 split:px-10 split:pt-[72px]">
        <div className={formWidth}>{children}</div>
      </main>
    </div>
  );
}
