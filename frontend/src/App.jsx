// Every route in the app, and which gate guards it (routes/Gate.jsx).
//
//   /welcome /login /register   signed-out visitors only
//   /pending                    accounts waiting for approval
//   /gallery                    the component gallery, open to everyone
//   everything else             inside the ResponsiveShell, approved users,
//                               only the pages their role may open
import { Suspense, lazy } from 'react';
import { Navigate, Outlet, ScrollRestoration, createBrowserRouter } from 'react-router';
import ResponsiveShell from './components/ResponsiveShell';
import { useAuth } from './context/AuthContext';
import { LiveProvider } from './context/LiveContext';
import Splash from './pages/common/Splash';
import { PendingOnly, PublicOnly, RequireApproved } from './routes/Gate';

// Code splitting by route: each page is its own JavaScript file, downloaded
// the first time it is opened. A recipient never downloads the admin's
// chart, and the sign-in page does not wait for the whole app.
// lazy() takes a function that imports the page; <Suspense> (below) shows a
// fallback while that file is on its way.
const Welcome = lazy(() => import('./pages/common/Welcome'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Pending = lazy(() => import('./pages/auth/Pending'));
const Gallery = lazy(() => import('./pages/common/Gallery'));
const Board = lazy(() => import('./pages/donor/Board'));
const ManageListings = lazy(() => import('./pages/donor/ManageListings'));
const Counter = lazy(() => import('./pages/recipient/Counter'));
const MyRequests = lazy(() => import('./pages/recipient/MyRequests'));
const Pickups = lazy(() => import('./pages/volunteer/Pickups'));
const Overview = lazy(() => import('./pages/admin/Overview'));
const Approvals = lazy(() => import('./pages/admin/Approvals'));
const Alerts = lazy(() => import('./pages/common/Alerts'));
const Profile = lazy(() => import('./pages/common/Profile'));

/** Home differs per role. */
function HomeForRole() {
  const { user } = useAuth();
  switch (user.role) {
    case 'donor':
      return <Board />;
    case 'volunteer':
      return <Pickups />;
    case 'admin':
      return <Overview />;
    default:
      return <Counter />;
  }
}

/**
 * The root layout: scroll goes back to the top on each new page.
 * The Suspense here covers the pages outside the shell (welcome, sign in,
 * register, pending, gallery) while their file loads. Inside the shell a
 * second Suspense (ResponsiveShell) keeps the navigation on screen.
 * React Router navigates inside a transition, so once a page is showing,
 * moving to a page that is still loading keeps the old page until the new
 * one is ready instead of flashing the fallback.
 */
function Root() {
  return (
    <>
      <ScrollRestoration />
      <Suspense fallback={<Splash />}>
        <Outlet />
      </Suspense>
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/welcome', element: <PublicOnly><Welcome /></PublicOnly> },
      { path: '/login', element: <PublicOnly><Login /></PublicOnly> },
      { path: '/register', element: <PublicOnly><Register /></PublicOnly> },
      { path: '/pending', element: <PendingOnly><Pending /></PendingOnly> },
      { path: '/gallery', element: <Gallery /> },
      {
        element: (
          <RequireApproved>
            {/* The 20-second refresh (badge, activity, lists) runs inside. */}
            <LiveProvider>
              <ResponsiveShell />
            </LiveProvider>
          </RequireApproved>
        ),
        children: [
          // /home/* so the recipient's counter stays mounted while the URL
          // moves between /home and /home/listing/:id (Counter reads the rest).
          { path: '/home/*', element: <HomeForRole /> },
          { path: '/requests', element: <MyRequests /> },
          { path: '/listings', element: <ManageListings /> },
          { path: '/approvals', element: <Approvals /> },
          { path: '/notifications', element: <Alerts /> },
          { path: '/profile', element: <Profile /> },
        ],
      },
      { path: '*', element: <Navigate to="/home" replace /> },
    ],
  },
]);
