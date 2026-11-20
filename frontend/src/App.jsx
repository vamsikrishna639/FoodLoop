// Every route in the app, and which gate guards it (routes/Gate.jsx).
//
//   /welcome /login /register   signed-out visitors only
//   /pending                    accounts waiting for approval
//   /gallery                    the component gallery, open to everyone
//   everything else             inside the ResponsiveShell, approved users,
//                               only the pages their role may open
import { Navigate, Outlet, ScrollRestoration, createBrowserRouter } from 'react-router';
import ResponsiveShell from './components/ResponsiveShell';
import { useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Pending from './pages/auth/Pending';
import Register from './pages/auth/Register';
import Gallery from './pages/common/Gallery';
import Placeholder from './pages/common/Placeholder';
import Profile from './pages/common/Profile';
import Welcome from './pages/common/Welcome';
import { PendingOnly, PublicOnly, RequireApproved } from './routes/Gate';

/** Home differs per role. (Each is replaced by its real page in its stage.) */
function HomeForRole() {
  const { user } = useAuth();
  switch (user.role) {
    case 'donor':
      return <Placeholder title="Board" stage={2} note="Today's Surplus chalkboard, the request queue and the Post food form." />;
    case 'volunteer':
      return <Placeholder title="Pickups" stage={4} note="Your assigned runs with one large button for each step." />;
    case 'admin':
      return <Placeholder title="Overview" stage={4} note="Portions delivered, the 7-day chart and volunteer assignment." />;
    default:
      return <Placeholder title="Today's Counter" stage={2} note="Every token on the counter, with search and filter tags." />;
  }
}

/** The root layout: scroll goes back to the top on each new page. */
function Root() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
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
            <ResponsiveShell />
          </RequireApproved>
        ),
        children: [
          { path: '/home', element: <HomeForRole /> },
          {
            path: '/requests',
            element: <Placeholder title="My requests" stage={3} note="Every request printed as a receipt." />,
          },
          {
            path: '/listings',
            element: <Placeholder title="Listings" stage={2} note="Open and closed tokens, with Edit and Delete." />,
          },
          {
            path: '/approvals',
            element: <Placeholder title="Approvals" stage={4} note="New accounts waiting for a decision." />,
          },
          {
            path: '/notifications',
            element: <Placeholder title="Alerts" stage={4} note="Notifications grouped by day, with Mark all read." />,
          },
          { path: '/profile', element: <Profile /> },
        ],
      },
      { path: '*', element: <Navigate to="/home" replace /> },
    ],
  },
]);
