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
import Board from './pages/donor/Board';
import ManageListings from './pages/donor/ManageListings';
import Counter from './pages/recipient/Counter';
import MyRequests from './pages/recipient/MyRequests';
import { PendingOnly, PublicOnly, RequireApproved } from './routes/Gate';

/** Home differs per role. (Each is replaced by its real page in its stage.) */
function HomeForRole() {
  const { user } = useAuth();
  switch (user.role) {
    case 'donor':
      return <Board />;
    case 'volunteer':
      return <Placeholder title="Pickups" stage={4} note="Your assigned runs with one large button for each step." />;
    case 'admin':
      return <Placeholder title="Overview" stage={4} note="Portions delivered, the 7-day chart and volunteer assignment." />;
    default:
      return <Counter />;
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
          // /home/* so the recipient's counter stays mounted while the URL
          // moves between /home and /home/listing/:id (Counter reads the rest).
          { path: '/home/*', element: <HomeForRole /> },
          { path: '/requests', element: <MyRequests /> },
          { path: '/listings', element: <ManageListings /> },
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
