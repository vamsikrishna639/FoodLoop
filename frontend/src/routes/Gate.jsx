// The rules that decide who may see which page. Each page is wrapped in one
// gate; the gate either shows the page or redirects. Because the gates read
// AuthContext, signing in, signing out or being approved moves the user to
// the right place automatically: pages never navigate after login/logout.
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { canOpen } from '../lib/roles';
import Splash from '../pages/common/Splash';

/** /welcome, /login, /register: only for signed-out visitors. */
export function PublicOnly({ children }) {
  const { status, user, seenWelcome } = useAuth();
  const location = useLocation();

  if (status === 'restoring') return <Splash />;
  if (status === 'signedIn') {
    if (user.verificationStatus !== 'approved') return <Navigate to="/pending" replace />;
    // Go back to the page that was asked for before signing in, if any.
    return <Navigate to={location.state?.from || '/home'} replace />;
  }
  // First visit on this device: show the welcome slides once.
  if (!seenWelcome && location.pathname !== '/welcome') return <Navigate to="/welcome" replace />;
  return children;
}

/** /pending: only for signed-in accounts that are not approved (yet). */
export function PendingOnly({ children }) {
  const { status, user } = useAuth();
  if (status === 'restoring') return <Splash />;
  if (status === 'signedOut') return <Navigate to="/login" replace />;
  if (user.verificationStatus === 'approved') return <Navigate to="/home" replace />;
  return children;
}

/** Every page inside the shell: approved accounts, and only their role's pages. */
export function RequireApproved({ children }) {
  const { status, user, seenWelcome } = useAuth();
  const location = useLocation();

  // While the saved session is checked, wait on the splash at the same URL,
  // so a browser refresh on /profile comes back to /profile.
  if (status === 'restoring') return <Splash />;
  if (status === 'signedOut') {
    return <Navigate to={seenWelcome ? '/login' : '/welcome'} replace state={{ from: location.pathname }} />;
  }
  // Pending and rejected accounts only ever see the waiting page.
  if (user.verificationStatus !== 'approved') return <Navigate to="/pending" replace />;
  // Role-based access: e.g. a recipient typing /approvals goes home.
  if (!canOpen(user.role, location.pathname)) return <Navigate to="/home" replace />;
  // A token's detail page belongs to the recipient's counter.
  if (location.pathname.startsWith('/home/listing/') && user.role !== 'recipient') {
    return <Navigate to="/home" replace />;
  }
  return children;
}
