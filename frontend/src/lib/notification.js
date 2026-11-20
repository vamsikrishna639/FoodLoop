// Facts about a notification, worked out the same way everywhere.
// A notification from the API: { id, message, type, isRead, createdAt }.
// Types (backend/src/utils/notify.js): claim_submitted, claim_approved,
// claim_rejected, volunteer_assigned, delivered, account_approved.

/** The short printed word beside the message, so the kind of news reads at a glance. */
export function alertWord(type) {
  return (
    {
      claim_submitted: 'New request',
      claim_approved: 'Approved',
      claim_rejected: 'Turned down',
      volunteer_assigned: 'Pickup',
      delivered: 'Delivered',
      account_approved: 'Account',
    }[type] || 'Note'
  );
}

/**
 * Where an alert leads: { path, page }, or null when there is no better
 * page. A notification carries only its type, so the page follows from the
 * type and the reader's role: a donor's news is on the Board, a
 * recipient's on My requests, a volunteer's on Pickups.
 */
export function alertTarget(type, role) {
  const home = { donor: 'Board', recipient: 'Counter', volunteer: 'Pickups', admin: 'Overview' }[role];
  if (type === 'account_approved') return home ? { path: '/home', page: home } : null;
  if (role === 'donor' && (type === 'claim_submitted' || type === 'delivered')) return { path: '/home', page: 'Board' };
  if (role === 'recipient' && ['claim_approved', 'claim_rejected', 'volunteer_assigned', 'delivered'].includes(type)) {
    return { path: '/requests', page: 'My requests' };
  }
  if (role === 'volunteer' && type === 'volunteer_assigned') return { path: '/home', page: 'Pickups' };
  return null;
}
