// The frame around every signed-in page. One component, three layouts, all
// switched by CSS breakpoints (see @theme in styles/index.css):
//
//   Mobile  (< 600)     bottom bar with a raised centre action
//   Tablet  (600-1024)  a dark navigation rail on the left (icons over labels)
//   Desktop (> 1024)    menu-board sidebar | content | activity rail
//
// The page itself is the router's <Outlet />. It cross-fades on navigation
// (opacity only, so it stays under reduced motion, just shorter), and focus
// moves to the page so screen-reader users hear where they arrived.
import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { MagnifyingGlassIcon, PlusIcon } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { initials } from '../lib/format';
import { DURATION, EASE } from '../lib/motion';
import { ROLES, destinationsFor } from '../lib/roles';
import ActivityRail from './ActivityRail';
import BrandMark from './BrandMark';

export default function ResponsiveShell({ unread = 0 }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const mainRef = useRef(null);
  const firstRender = useRef(true);

  // After a navigation (not on first load), move focus to the new page.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // A page may already have put focus somewhere useful (Browse puts it in
    // the search field); only move it when it is still outside the page.
    const main = mainRef.current;
    if (main && !main.contains(document.activeElement)) main.focus({ preventScroll: true });
  }, [location.pathname]);

  if (!user) return null; // mid sign-out

  const destinations = destinationsFor(user.role);
  // The role's main action: the raised centre button on phones, the red
  // button at the top of the rail and sidebar.
  const action = {
    donor: { label: 'Post food', icon: PlusIcon, onClick: () => navigate('/home', { state: { postFood: Date.now() } }) },
    recipient: {
      label: 'Browse',
      icon: MagnifyingGlassIcon,
      onClick: () => navigate('/home', { state: { focusSearch: Date.now() } }),
    },
  }[user.role];

  return (
    <div className="min-h-dvh tablet:flex">
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-ink px-4 py-3 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <SideNav user={user} destinations={destinations} action={action} unread={unread} />

      {/* Content grows up to the max width (1320 with the sidebar), then stays
          left-aligned next to the sidebar instead of floating in the middle. */}
      <div className="min-w-0 flex-1 desktop:flex desktop:max-w-[calc(1320px-248px)]">
        <main
          id="main"
          ref={mainRef}
          tabIndex={-1}
          className="min-w-0 flex-1 pb-[calc(var(--bottom-bar,0px)+env(safe-area-inset-bottom)+32px)] focus:outline-none tablet:pb-0"
        >
          {/* Keyed by the first part of the path, so /home and /home/listing/42
              are the same page (the counter keeps its list) while moving to
              /profile fades the page in. */}
          <motion.div
            key={location.pathname.split('/')[1]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? DURATION.fast : DURATION.base, ease: EASE.out }}
          >
            <Outlet />
          </motion.div>
        </main>

        {/* As with the sidebar, the outer column carries the dividing line
            for the full page height; the rail itself sticks to the top. */}
        <div className="hidden w-[304px] shrink-0 border-l border-line desktop:block">
          <aside aria-label="Activity" className="sticky top-0 h-dvh overflow-y-auto">
            <ActivityRail />
          </aside>
        </div>
      </div>

      <BottomBar destinations={destinations} action={action} unread={unread} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tablet rail and desktop sidebar. Both are styled as the canteen menu board,
// so they stay dark in light mode too.
// ---------------------------------------------------------------------------

function SideNav({ user, destinations, action, unread }) {
  // The outer column paints the board colour for the full height of the
  // page; the nav inside it sticks to the top of the window.
  return (
    <div className="on-board hidden shrink-0 bg-board tablet:block">
      <nav
        aria-label="Main"
        className="sticky top-0 flex h-dvh w-[92px] flex-col items-center px-2 pb-4 pt-6 desktop:w-[248px] desktop:items-stretch desktop:px-4"
      >
        <div className="desktop:hidden">
          <BrandMark onBoard size={36} showWordmark={false} />
        </div>
        <div className="hidden pl-2 desktop:block">
          <BrandMark onBoard size={30} />
        </div>

        {action && (
          <button
            type="button"
            onClick={action.onClick}
            aria-label={action.label}
            className="press-scale mt-6 flex size-14 items-center justify-center gap-2 rounded-control bg-chilli-deep text-on-chilli transition-[background-color,transform] duration-[120ms] hover:bg-chilli-deep/90 active:scale-[0.98] desktop:h-12 desktop:w-full"
          >
            <action.icon size={22} weight="bold" aria-hidden="true" />
            <span className="hidden t-label-lg desktop:inline">{action.label}</span>
          </button>
        )}

        <ul className="mt-4 w-full flex-1 space-y-1 overflow-y-auto">
          {destinations.map((d) => (
            <li key={d.path}>
              <NavLink
                to={d.path}
                aria-label={d.badge && unread > 0 ? `${d.label}, ${unread} unread` : undefined}
                className={({ isActive }) =>
                  `flex min-h-12 flex-col items-center justify-center gap-1 rounded-control px-1 py-2 transition-colors duration-[120ms] desktop:flex-row desktop:justify-start desktop:gap-3 desktop:px-3 ${
                    isActive ? 'bg-chalk font-bold text-board' : 'font-medium text-chalk hover:bg-chalk/8'
                  }`
                }
              >
                <BadgedIcon icon={d.icon} count={d.badge ? unread : 0} />
                <span className="max-w-full truncate t-label-sm text-current desktop:t-title-md desktop:font-[inherit]">
                  {d.label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>

        <NavLink
          to="/profile"
          aria-label={`Profile and settings for ${user.name}`}
          className="mt-2 flex min-h-14 items-center gap-3 rounded-control p-2 transition-colors duration-[120ms] hover:bg-chalk/8"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full border-[1.5px] border-chalk-soft font-bold text-chalk t-mono">
            {initials(user.name)}
          </span>
          <span className="hidden min-w-0 desktop:block">
            <span className="block truncate text-chalk t-title-sm">{user.name}</span>
            <span className="block text-chalk-soft t-mono-sm">{ROLES[user.role]?.label}</span>
          </span>
        </NavLink>
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile bottom bar.
// ---------------------------------------------------------------------------

function BottomBar({ destinations, action, unread }) {
  // With a centre action, half the destinations sit on each side of it.
  const half = Math.ceil(destinations.length / 2);
  const left = action ? destinations.slice(0, half) : destinations;
  const right = action ? destinations.slice(half) : [];

  return (
    <nav
      aria-label="Main"
      className="bottom-bar fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] tablet:hidden"
    >
      <ul className="flex h-[68px]">
        {left.map((d) => (
          <BottomItem key={d.path} destination={d} unread={unread} />
        ))}
        {action && (
          <li className="flex-1">
            <button
              type="button"
              onClick={action.onClick}
              className="group flex h-full w-full flex-col items-center justify-end pb-[15px]"
            >
              {/* The raised action pokes out above the bar. */}
              <span className="press-scale -mt-7 mb-1 grid size-14 place-items-center rounded-slip border-[3px] border-surface bg-chilli-deep text-on-chilli shadow-lifted transition-transform duration-[120ms] group-active:scale-[0.96]">
                <action.icon size={26} weight="bold" aria-hidden="true" />
              </span>
              <span className="font-bold text-ink t-label-sm">{action.label}</span>
            </button>
          </li>
        )}
        {right.map((d) => (
          <BottomItem key={d.path} destination={d} unread={unread} />
        ))}
      </ul>
    </nav>
  );
}

function BottomItem({ destination: d, unread }) {
  return (
    <li className="min-w-0 flex-1">
      <NavLink
        to={d.path}
        aria-label={d.badge && unread > 0 ? `${d.label}, ${unread} unread` : undefined}
        className={({ isActive }) =>
          `flex h-full flex-col items-center justify-center gap-1 ${isActive ? 'font-bold text-ink' : 'font-medium text-ink-soft'}`
        }
      >
        {({ isActive }) => (
          <>
            <BadgedIcon icon={d.icon} count={d.badge ? unread : 0} />
            <span className="max-w-full truncate t-label-sm text-current [font-weight:inherit]">{d.label}</span>
            {/* A short ink dash marks the current tab (shape, not only colour).
                Not animated: tabs are tapped many times a day, and the page's
                own cross-fade already confirms the change. */}
            <span className={`h-[3px] rounded-sm bg-ink ${isActive ? 'w-5' : 'w-0'}`} aria-hidden="true" />
          </>
        )}
      </NavLink>
    </li>
  );
}

/** An icon with an optional unread count in the corner. */
function BadgedIcon({ icon: Icon, count }) {
  return (
    <span className="relative inline-flex">
      <Icon size={24} aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-2 -top-1.5 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-chilli-deep px-1 font-mono text-[0.65625rem] font-bold leading-none text-on-chilli"
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </span>
  );
}
