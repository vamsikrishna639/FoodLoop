// Shown to accounts that are not approved yet. They can sign in, but this is
// all they see until an admin approves them (or the account is declined).
import { useState } from 'react';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import BrandMark from '../../components/BrandMark';
import Button from '../../components/Button';
import { EmptyArt } from '../../components/EmptyState';
import ReceiptTimeline from '../../components/ReceiptTimeline';
import StatusStamp from '../../components/StatusStamp';
import { useAuth } from '../../context/AuthContext';
import { useSlip } from '../../context/ToastContext';
import { ROLES } from '../../lib/roles';

export default function Pending() {
  const { user, refreshUser, logout } = useAuth();
  const showSlip = useSlip();
  const [checking, setChecking] = useState(false);

  if (!user) return null; // signing out
  const rejected = user.verificationStatus === 'rejected';
  const firstName = user.name.split(' ')[0];

  async function checkAgain() {
    setChecking(true);
    try {
      const fresh = await refreshUser();
      // If approved, the route gate has already moved on; otherwise say so.
      if (fresh.verificationStatus === 'pending') {
        showSlip('Still in the queue. An admin has not reviewed it yet.', { kind: 'note' });
      }
    } catch (error) {
      showSlip(error.message, { kind: 'error' });
    } finally {
      setChecking(false);
    }
  }

  return (
    <main id="main" className="min-h-dvh px-4 pb-12 pt-6 tablet:px-6 split:px-10">
      <div className="max-w-[1080px]">
        <BrandMark size={28} />
        {/* Side by side on wide screens, stacked on phones. */}
        <div className="mt-8 grid gap-8 split:mt-[72px] split:grid-cols-[6fr_4fr] split:gap-12">
          <div>
            <EmptyArt art={rejected ? 'slip' : 'clock'} />
            <h1 className="mt-6 t-display-sm text-ink split:t-display-md">
              {rejected ? 'This token was not approved' : 'Your token is in the queue'}
            </h1>
            <p className="mt-3 max-w-[480px] text-ink-soft t-body-lg">
              {rejected
                ? 'An admin reviewed your account and could not approve it. If you think that is a mistake, speak to the campus office.'
                : `Thanks, ${firstName}. An admin checks every new account before it can post or request food. This usually takes less than a day.`}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {!rejected && (
                <Button icon={ArrowClockwiseIcon} loading={checking} loadingLabel="Checking" onClick={checkAgain}>
                  Check again
                </Button>
              )}
              <Button variant="outline" disabled={checking} onClick={() => logout()}>
                Sign out
              </Button>
            </div>
          </div>

          <ReceiptTimeline
            className="max-w-[380px]"
            title={user.name}
            heading="Account slip"
            stamp={<StatusStamp kind={rejected ? 'rejected' : 'pending'} />}
            entries={[
              { label: 'Role', value: ROLES[user.role]?.label },
              ...(user.organization ? [{ label: 'From', value: user.organization }] : []),
              { label: 'Email', value: user.email },
              { label: 'Registered', value: 'Done' },
              { label: 'Admin review', value: rejected ? 'Declined' : null, emphasis: true },
            ]}
            footer={rejected ? null : 'Keep this slip'}
          />
        </div>
      </div>
    </main>
  );
}
