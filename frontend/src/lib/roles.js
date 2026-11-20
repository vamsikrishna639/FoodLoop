// Everything the app knows about the four roles in one place: labels, the
// pages each role may open, and the navigation each role sees.
import {
  BellIcon,
  BicycleIcon,
  ChartLineUpIcon,
  ReceiptIcon,
  SquaresFourIcon,
  StorefrontIcon,
  TicketIcon,
  UserCheckIcon,
  UserIcon,
} from '@phosphor-icons/react';

export const ROLES = {
  donor: { label: 'Donor', blurb: 'I run a canteen and have surplus food' },
  recipient: { label: 'Recipient', blurb: 'I collect food for people who need it' },
  volunteer: { label: 'Volunteer', blurb: 'I pick up and deliver food' },
  admin: { label: 'Admin', blurb: 'I manage accounts and assignments' },
};

/** Roles a person may pick when registering (admins come from the seed). */
export const REGISTER_ROLES = ['donor', 'recipient', 'volunteer'];

/**
 * Pages each role may open inside the shell. Sub-pages are allowed with
 * their parent: '/home' also allows '/home/listing/42'.
 */
const ALLOWED = {
  recipient: ['/home', '/requests', '/notifications', '/profile'],
  donor: ['/home', '/listings', '/notifications', '/profile'],
  volunteer: ['/home', '/notifications', '/profile'],
  admin: ['/home', '/approvals', '/listings', '/notifications', '/profile'],
};

export function canOpen(role, path) {
  return (ALLOWED[role] || []).some((p) => path === p || path.startsWith(`${p}/`));
}

/** The navigation shown to each role, in order. */
export function destinationsFor(role) {
  const alerts = { label: 'Alerts', icon: BellIcon, path: '/notifications', badge: true };
  const profile = { label: 'Profile', icon: UserIcon, path: '/profile' };
  switch (role) {
    case 'recipient':
      return [
        { label: 'Counter', icon: StorefrontIcon, path: '/home' },
        { label: 'Requests', icon: ReceiptIcon, path: '/requests' },
        alerts,
        profile,
      ];
    case 'donor':
      return [
        { label: 'Board', icon: SquaresFourIcon, path: '/home' },
        { label: 'Listings', icon: TicketIcon, path: '/listings' },
        alerts,
        profile,
      ];
    case 'volunteer':
      return [{ label: 'Pickups', icon: BicycleIcon, path: '/home' }, alerts, profile];
    case 'admin':
      return [
        { label: 'Overview', icon: ChartLineUpIcon, path: '/home' },
        { label: 'Approvals', icon: UserCheckIcon, path: '/approvals' },
        { label: 'Listings', icon: TicketIcon, path: '/listings' },
        alerts,
        profile,
      ];
    default:
      return [];
  }
}
