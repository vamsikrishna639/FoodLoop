// First-run welcome, shown once per device before the first sign-in.
//
//   Narrower than 900px: the logo and three short slides, with Skip and Next.
//   900px and wider:     a split page: the chalkboard on the left with one big
//                        real number (portions delivered so far), and the
//                        three steps listed on the right.
//
// The number comes from the public /api/impact endpoint. If the server
// cannot be reached the board shows a line of text instead; nothing is made up.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { impact } from '../../api/dashboard';
import BrandMark from '../../components/BrandMark';
import Button from '../../components/Button';
import { ChalkItem } from '../../components/Chalkboard';
import { EmptyArt } from '../../components/EmptyState';
import ImpactNumber from '../../components/ImpactNumber';
import StatusStamp from '../../components/StatusStamp';
import { useAuth } from '../../context/AuthContext';
import useMediaQuery from '../../hooks/useMediaQuery';
import { DURATION, EASE } from '../../lib/motion';

const STEPS = [
  {
    title: "The canteen posts what's left",
    body: 'After each service the surplus goes on the counter as a numbered token, with a time it must be collected by.',
    art: <EmptyArt art="slip" />,
  },
  {
    title: 'You ask for a share',
    body: 'Shelters, hostel messes and student groups request what they can use. The canteen stamps each request.',
    art: (
      <div className="grid h-24 w-[132px] items-center">
        <StatusStamp kind="approved" size="lg" />
      </div>
    ),
  },
  {
    title: 'A volunteer carries it over',
    body: 'Approved food is picked up and delivered before the deadline. Only food that arrives is counted.',
    art: <EmptyArt art="clock" />,
  },
];

export default function Welcome() {
  const wide = useMediaQuery('(min-width: 900px)'); // the same split as sign in
  const { markWelcomeSeen } = useAuth();
  const navigate = useNavigate();

  // Remember that the welcome was seen, then go to sign in or register.
  const finish = (path) => {
    markWelcomeSeen();
    navigate(path);
  };

  return wide ? <WideWelcome finish={finish} /> : <SlidesWelcome finish={finish} />;
}

// ---------------------------------------------------------------------------
// Phones and tablets: three slides
// ---------------------------------------------------------------------------

function SlidesWelcome({ finish }) {
  const [page, setPage] = useState(0);
  const reduced = useReducedMotion();
  const last = page === STEPS.length - 1;
  const step = STEPS[page];

  return (
    <main id="main" className="flex min-h-dvh flex-col px-4 pb-6 pt-3 tablet:px-6">
      {/* Logo on the left, Skip on the right. Fixed height, so the logo
          does not move when Skip disappears. */}
      <div className="flex h-12 items-center justify-between">
        <BrandMark size={28} />
        {!last && (
          <Button variant="text" onClick={() => finish('/login')}>
            Skip
          </Button>
        )}
      </div>

      {/* A short slide-in confirms where the next card came from. Under
          reduced motion only the fade remains. */}
      <motion.section
        key={page}
        aria-live="polite"
        initial={{ opacity: 0, x: reduced ? 0 : 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: reduced ? DURATION.fast : DURATION.slow, ease: EASE.out }}
        className="flex-1 pt-[72px]"
      >
        <div className="flex h-[110px] items-end">{step.art}</div>
        <h1 className="mt-8 t-display-sm text-ink">{step.title}</h1>
        <p className="mt-3 max-w-[52ch] text-ink-soft t-body-lg">{step.body}</p>
      </motion.section>

      {last ? (
        <div className="flex flex-col gap-3">
          <Dots count={STEPS.length} current={page} />
          <Button variant="accent" expand className="mt-3" onClick={() => finish('/login')}>
            Sign in
          </Button>
          <Button variant="outline" expand onClick={() => finish('/register')}>
            Create an account
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <Dots count={STEPS.length} current={page} />
          <Button onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </main>
  );
}

/**
 * Step indicator: short dashes, the current one longer and inked (shape, not
 * just colour). The length changes instantly (widths are never animated);
 * only the colour fades. The sliding card above is the motion.
 */
function Dots({ count, current }) {
  return (
    <div role="img" aria-label={`Step ${current + 1} of ${count}`} className="flex gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`h-1 rounded-full transition-colors duration-200 ${i === current ? 'w-6 bg-ink' : 'w-2 bg-perforation'}`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wide screens: split layout
// ---------------------------------------------------------------------------

function WideWelcome({ finish }) {
  const [portions, setPortions] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    impact()
      .then((data) => setPortions(data.portionsDelivered))
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="grid min-h-dvh grid-cols-[clamp(380px,44vw,620px)_1fr]">
      <aside className="on-board bg-board p-12">
        <BrandMark onBoard size={34} />
        <div className="mt-[72px] min-h-[130px]">
          {portions !== null ? (
            <ImpactNumber value={portions} caption="portions delivered on campus so far" onBoard />
          ) : (
            failed && <p className="t-display-lg text-chalk">Surplus food, served before the bell.</p>
          )}
        </div>
        <p className="mt-6 max-w-[44ch] text-chalk-soft t-body-lg">
          Counted only when a volunteer marks the food delivered, never when it is posted.
        </p>
        <div className="mt-12">
          <ChalkItem name="Canteen" trailing="posts surplus" />
          <ChalkItem name="Recipient" trailing="requests a share" />
          <ChalkItem name="Volunteer" trailing="picks up, delivers" />
        </div>
      </aside>

      <main id="main" className="px-12 pb-12 pt-[72px] desktop:px-[72px]">
        <div className="max-w-[520px]">
          <h1 className="t-display-sm text-ink">How the counter works</h1>
          <ol className="mt-8 space-y-8">
            {STEPS.map((s) => (
              <li key={s.title} className="flex gap-6">
                {/* The drawings are 132 wide; shown smaller here. */}
                <div className="h-[68px] w-[92px] shrink-0 origin-top-left scale-[0.7]">{s.art}</div>
                <div>
                  <h2 className="t-headline-sm text-ink">{s.title}</h2>
                  <p className="mt-1 text-ink-soft t-body-lg">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button variant="accent" onClick={() => finish('/login')}>
              Sign in
            </Button>
            <Button variant="outline" onClick={() => finish('/register')}>
              Create an account
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
