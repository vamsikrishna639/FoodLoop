// Approvals: new accounts wait here until the admin lets them in.
//
// Windows 640px wide or more (the `register:` breakpoint): a printed table,
// like the register at the canteen office.
//   NAME / FROM       CONTACT              ROLE / JOINED   DECISION
//   Rohit Verma       rohit@...            RECIPIENT       [Approve] [Reject]
//   Hope Foundation   9000000007           Today
// Below desktop the contact details sit under the name, so the table fits
// beside the tablet rail. Narrower windows: the same facts as stacked slips.
//
// An account decided on this visit stays under "Waiting" with its stamp, so
// the admin sees the result where they clicked. It moves to "Decided" on
// the next visit.
import { useCallback, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CheckIcon, XIcon } from '@phosphor-icons/react';
import * as usersApi from '../../api/users';
import Button from '../../components/Button';
import EmptyState, { ErrorState } from '../../components/EmptyState';
import FilterTag from '../../components/FilterTag';
import Modal from '../../components/Modal';
import PageFrame from '../../components/PageFrame';
import SkeletonToken from '../../components/SkeletonToken';
import StatusStamp from '../../components/StatusStamp';
import { useSlip } from '../../context/ToastContext';
import useFocusWhen from '../../hooks/useFocusWhen';
import useLiveList from '../../hooks/useLiveList';
import { day } from '../../lib/format';
import { DURATION, EASE } from '../../lib/motion';
import { ROLES } from '../../lib/roles';

export default function Approvals() {
  const showSlip = useSlip();
  const fetchAccounts = useCallback(async () => (await usersApi.list()).users, []);
  const accounts = useLiveList(fetchAccounts);
  const [showDecided, setShowDecided] = useState(false);
  const [decidedHere, setDecidedHere] = useState(() => new Set());
  const [lastDecided, setLastDecided] = useState(null);
  const [busy, setBusy] = useState(null); // { id, status }
  const [toReject, setToReject] = useState(null);

  async function decide(user, status) {
    setBusy({ id: user.id, status });
    try {
      const data = await usersApi.verify(user.id, status);
      accounts.upsert(data.user);
      setDecidedHere((set) => new Set(set).add(user.id));
      setLastDecided(user.id);
      showSlip(data.message); // "Rohit Verma can now sign in"
    } catch (err) {
      // e.g. 400 "This account is already approved" (decided in another tab).
      showSlip(err.message, { kind: 'error' });
      accounts.load();
    } finally {
      setBusy(null);
      setToReject(null);
    }
  }

  const all = accounts.items;
  // Waiting: still pending, plus anything decided on this visit. Oldest
  // registration first, so nobody waits longest.
  const waiting = (all || [])
    .filter((u) => u.verificationStatus === 'pending' || decidedHere.has(u.id))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const decided = (all || []).filter((u) => u.verificationStatus !== 'pending' && !decidedHere.has(u.id));
  const pendingCount = waiting.filter((u) => u.verificationStatus === 'pending').length;
  const shown = showDecided ? decided : waiting;

  const rowProps = (u) => ({
    user: u,
    busy: busy?.id === u.id ? busy.status : null,
    locked: Boolean(busy),
    focusResult: lastDecided === u.id,
    justNow: decidedHere.has(u.id),
    onApprove: () => decide(u, 'approved'),
    onReject: () => setToReject(u),
  });

  let body;
  if (all === null && accounts.error) {
    body = <ErrorState message={accounts.error} onRetry={accounts.load} />;
  } else if (all === null) {
    body = <SkeletonToken />;
  } else if (shown.length === 0) {
    body = showDecided ? (
      <EmptyState art="slip" title="No decisions yet" message="Approved and rejected accounts are listed here as a record." />
    ) : (
      <EmptyState
        art="clock"
        title="Nobody is waiting"
        message="New sign-ups appear here. Until you approve them they only see a waiting screen."
      />
    );
  } else {
    body = (
      <>
        {/* Wide: the register. */}
        <div className="hidden overflow-hidden rounded-sharp border border-line bg-surface register:block">
          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">{showDecided ? 'Decided accounts' : 'Accounts waiting for approval'}</caption>
            <colgroup>
              <col />
              <col className="hidden desktop:table-column" />
              <col className="w-[128px]" />
              <col className="w-[232px]" />
            </colgroup>
            <thead className="bg-sunken">
              <tr className="font-bold text-ink t-mono-sm">
                <th scope="col" className="px-4 py-3 font-bold">
                  Name / from
                </th>
                <th scope="col" className="hidden px-4 py-3 font-bold desktop:table-cell">
                  Contact
                </th>
                <th scope="col" className="whitespace-nowrap px-3 py-3 font-bold">
                  Role / joined
                </th>
                <th scope="col" className="px-4 py-3 font-bold">
                  Decision
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <RegisterRow key={u.id} {...rowProps(u)} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Narrow: one slip per account. */}
        <ul className="space-y-3 register:hidden">
          {shown.map((u) => (
            <li key={u.id}>
              <AccountSlip {...rowProps(u)} />
            </li>
          ))}
        </ul>
      </>
    );
  }

  const count = (n) => (all === null ? '' : ` ${n}`);

  return (
    <PageFrame
      title="Approvals"
      maxWidth="max-w-[1040px]"
      caption="Check that each person belongs to a real campus group before letting them in."
    >
      <div className="-mt-2 mb-6 flex flex-wrap gap-x-2">
        <FilterTag label={`Waiting${count(pendingCount)}`} selected={!showDecided} onClick={() => setShowDecided(false)} />
        <FilterTag label={`Decided${count(decided.length)}`} selected={showDecided} onClick={() => setShowDecided(true)} />
      </div>
      {body}

      {/* A rejected person cannot use FoodLoop, so it asks first. */}
      <Modal open={Boolean(toReject)} onClose={() => !busy && setToReject(null)} labelledBy="reject-account-title">
        {toReject && (
          <div className="px-4 pb-6 pt-3 tablet:px-6 tablet:pt-6">
            <h2 id="reject-account-title" className="t-headline-md text-ink">
              Reject {toReject.name}?
            </h2>
            <p className="mt-2 max-w-[52ch] text-ink t-body-lg">
              {toReject.name} will not be able to use FoodLoop. Their waiting screen will say the account was not
              approved.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="accent"
                icon={XIcon}
                loading={busy?.status === 'rejected'}
                loadingLabel="Rejecting"
                onClick={() => decide(toReject, 'rejected')}
              >
                Reject
              </Button>
              <Button variant="text" disabled={Boolean(busy)} onClick={() => setToReject(null)}>
                Keep waiting
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageFrame>
  );
}

/** One account as a table row. */
function RegisterRow({ user: u, ...decision }) {
  const cell = 'px-4 py-4 align-middle';
  return (
    <tr className="border-t border-line">
      <td className={cell}>
        <NameBlock user={u} />
        {/* Below desktop the contact column folds in under the name. */}
        <div className="mt-1 desktop:hidden">
          <Contact user={u} />
        </div>
      </td>
      <td className={`${cell} hidden desktop:table-cell`}>
        <Contact user={u} />
      </td>
      <td className="px-3 py-4 align-middle">
        <RoleStamp role={u.role} />
        <p className="mt-2 text-ink-soft t-mono-sm">{day(u.createdAt)}</p>
      </td>
      <td className={cell}>
        {/* In the table Approve drops its icon, so both buttons fit on one line. */}
        <Decision user={u} compact {...decision} />
      </td>
    </tr>
  );
}

/** The same facts as a slip, for phones. */
function AccountSlip({ user: u, ...decision }) {
  return (
    <article aria-label={u.name} className="rounded-sharp border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <NameBlock user={u} as="h2" />
        </div>
        <div className="shrink-0 pt-1">
          <RoleStamp role={u.role} />
        </div>
      </div>
      <div className="mt-3">
        <Contact user={u} />
        <p className="mt-1 text-ink-soft t-mono-sm">Joined {day(u.createdAt)}</p>
      </div>
      <div className="mt-4">
        <Decision user={u} {...decision} />
      </div>
    </article>
  );
}

function NameBlock({ user: u, as: Name = 'p' }) {
  return (
    <>
      <Name className="t-title-md text-ink [overflow-wrap:anywhere]">{u.name}</Name>
      {u.organization && <p className="text-ink-soft t-body-sm [overflow-wrap:anywhere]">{u.organization}</p>}
    </>
  );
}

function Contact({ user: u }) {
  const [local, domain] = u.email.split('@');
  return (
    <>
      {/* A long address may break after the @, never in the middle of a word. */}
      <p className="text-ink t-mono [overflow-wrap:anywhere]">
        {local}@<wbr />
        {domain}
      </p>
      <p className="text-ink-soft t-mono">{u.phone}</p>
    </>
  );
}

/** The role as a small ink stamp ("VOLUNTEER"), as on the profile. */
function RoleStamp({ role }) {
  return <StatusStamp label={ROLES[role]?.label} ink="text-ink" size="sm" angle={-3} />;
}

/** Approve / Reject while pending; afterwards the decision as a stamp. */
function Decision({ user: u, compact = false, busy, locked, focusResult, justNow, onApprove, onReject }) {
  const reduced = useReducedMotion();
  const resultRef = useRef(null);
  const pending = u.verificationStatus === 'pending';
  useFocusWhen(resultRef, focusResult && !pending);

  if (!pending) {
    const kind = u.verificationStatus === 'approved' ? 'approved' : 'rejected';
    // Only a decision made just now fades in; older ones are simply printed.
    return (
      <motion.div
        ref={resultRef}
        tabIndex={-1}
        aria-label={`${u.name}: ${kind}`}
        className="inline-block rounded-stamp p-1"
        initial={justNow ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? DURATION.fast : DURATION.base, ease: EASE.out }}
      >
        <StatusStamp kind={kind} />
      </motion.div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        icon={compact ? undefined : CheckIcon}
        loading={busy === 'approved'}
        loadingLabel="Approving"
        disabled={locked && busy !== 'approved'}
        onClick={onApprove}
        aria-label={`Approve ${u.name}`}
        className="!px-4"
      >
        Approve
      </Button>
      <Button
        variant="outline"
        disabled={locked}
        onClick={onReject}
        aria-label={`Reject ${u.name}`}
        className="!px-4"
      >
        Reject
      </Button>
    </div>
  );
}
