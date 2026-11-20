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
import { LiveProvider } from './context/LiveContext';
import Login from './pages/auth/Login';
import Pending from './pages/auth/Pending';
import Register from './pages/auth/Register';
import Approvals from './pages/admin/Approvals';
import Overview from './pages/admin/Overview';
import Alerts from './pages/common/Alerts';
import Gallery from './pages/common/Gallery';
import Profile from './pages/common/Profile';
import Welcome from './pages/common/Welcome';
import Board from './pages/donor/Board';
import ManageListings from './pages/donor/ManageListings';
import Counter from './pages/recipient/Counter';
import MyRequests from './pages/recipient/MyRequests';
import Pickups from './pages/volunteer/Pickups';
import { PendingOnly, PublicOnly, RequireApproved } from './routes/Gate';

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
