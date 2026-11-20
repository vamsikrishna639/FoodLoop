// Profile and settings: who you are, the paper/chalkboard switch, sign out.
import { Link } from 'react-router';
import { SignOutIcon } from '@phosphor-icons/react';
import Button from '../../components/Button';
import PageFrame from '../../components/PageFrame';
import ReceiptTimeline from '../../components/ReceiptTimeline';
import StatusStamp from '../../components/StatusStamp';
import ThemeSwitch from '../../components/ThemeSwitch';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../lib/roles';

export default function Profile() {
  const { user, logout } = useAuth();

  return (
    <PageFrame title="Profile" maxWidth="max-w-[640px]">
      {/* The account, printed as a member slip with the role stamped on it. */}
      <ReceiptTimeline
        title={user.name}
        heading="Member slip"
        stamp={<StatusStamp label={ROLES[user.role]?.label} ink="text-chilli-deep" />}
        entries={[
          { label: 'Email', value: user.email },
          { label: 'Phone', value: user.phone },
          ...(user.organization ? [{ label: 'From', value: user.organization }] : []),
          { label: 'Account', value: user.verificationStatus === 'approved' ? 'Approved' : 'Waiting', emphasis: true },
        ]}
      />

      <h2 className="mt-10 t-headline-sm text-ink">Appearance</h2>
      <ThemeSwitch className="mt-2" />

      <hr className="my-8 border-line" />

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" icon={SignOutIcon} onClick={() => logout()}>
          Sign out
        </Button>
        <Link to="/gallery" className="inline-flex min-h-12 items-center px-3 font-semibold text-ink underline t-label-lg">
          Component gallery
        </Link>
      </div>
    </PageFrame>
  );
}
