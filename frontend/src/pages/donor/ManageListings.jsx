// Listings: every token a donor has printed, split into Open and Closed,
// with Edit and Delete under each. An admin sees the same page for every
// listing ("All listings").
import { useEffect, useRef, useState } from 'react';
import { PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import * as foods from '../../api/foods';
import Button from '../../components/Button';
import EmptyState, { ErrorState } from '../../components/EmptyState';
import FadeUp from '../../components/FadeUp';
import FilterTag from '../../components/FilterTag';
import Modal from '../../components/Modal';
import PageFrame from '../../components/PageFrame';
import SkeletonToken from '../../components/SkeletonToken';
import TokenCard from '../../components/TokenCard';
import { useAuth } from '../../context/AuthContext';
import { useSlip } from '../../context/ToastContext';
import useListings from '../../hooks/useListings';
import { quantity } from '../../lib/format';
import { isOpen, stampOf } from '../../lib/listing';
import ListingForm from './ListingForm';

export default function ManageListings() {
  const { user } = useAuth();
  const admin = user.role === 'admin';
  const listings = useListings({ all: admin });
  const showSlip = useSlip();
  const [showClosed, setShowClosed] = useState(false);
  const [form, setForm] = useState({ open: false, existing: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const animatedIn = useRef(false);

  const shown = showClosed ? listings.closed : listings.open;
  const animate = !animatedIn.current && listings.items !== null && shown.length > 0;
  useEffect(() => {
    if (listings.items?.length) animatedIn.current = true;
  }, [listings.items]);

  function saved(listing, message) {
    listings.upsert(listing);
    setForm({ open: false, existing: null });
    showSlip(message);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const data = await foods.remove(toDelete.id);
      listings.removeById(toDelete.id);
      showSlip(data.message);
    } catch (error) {
      // e.g. 409 "This listing has approved requests, so it cannot be deleted"
      showSlip(error.message, { kind: 'error' });
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  let body;
  if (listings.items === null && !listings.error) {
    body = (
      <div className="space-y-4">
        <SkeletonToken />
        <SkeletonToken />
      </div>
    );
  } else if (listings.items === null) {
    body = <ErrorState message={listings.error} onRetry={listings.load} />;
  } else if (shown.length === 0) {
    body = showClosed ? (
      <EmptyState
        art="clock"
        title="Nothing closed yet"
        message="Tokens move here once they are collected or their pickup time passes."
      />
    ) : (
      <EmptyState
        art="slip"
        title="No tokens on the counter"
        message={
          admin
            ? 'No canteen has food on offer right now.'
            : 'Post what is left after service and it will be listed here.'
        }
        actionLabel={admin ? undefined : 'Post food'}
        onAction={admin ? undefined : () => setForm({ open: true, existing: null })}
      />
    );
  } else {
    body = (
      <ul className="space-y-6">
        {shown.map((l, i) => (
          <li key={l.id}>
            <FadeUp index={i} animate={animate}>
              <ListingRow
                listing={l}
                onEdit={() => setForm({ open: true, existing: l })}
                onDelete={() => setToDelete(l)}
              />
            </FadeUp>
          </li>
        ))}
      </ul>
    );
  }

  const count = (list) => (listings.items === null ? '' : ` ${list.length}`);

  return (
    <PageFrame
      title={admin ? 'All listings' : 'Listings'}
      maxWidth="max-w-[600px]"
      caption={
        admin
          ? 'Every token from every canteen. Remove anything that should not be on the counter.'
          : 'Every token you have printed. Edit open ones; closed ones stay as a record.'
      }
    >
      {/* No "Post food" button here: the shell shows one on every screen size. */}
      <div className="-mt-2 mb-4 flex flex-wrap gap-x-2">
        <FilterTag label={`Open${count(listings.open)}`} selected={!showClosed} onClick={() => setShowClosed(false)} />
        <FilterTag label={`Closed${count(listings.closed)}`} selected={showClosed} onClick={() => setShowClosed(true)} />
      </div>
      {body}

      <ListingForm
        open={form.open}
        existing={form.existing}
        onClose={() => setForm({ open: false, existing: null })}
        onSaved={saved}
      />

      {/* Deleting cannot be undone, so it asks first. */}
      <Modal open={Boolean(toDelete)} onClose={() => !deleting && setToDelete(null)} labelledBy="delete-title">
        {toDelete && (
          <div className="px-4 pb-6 pt-3 tablet:px-6 tablet:pt-6">
            <h2 id="delete-title" className="t-headline-md text-ink">
              Delete #{toDelete.tokenNumber}?
            </h2>
            <p className="mt-2 text-ink t-body-lg">
              &ldquo;{toDelete.title}&rdquo; comes off the counter, and any requests still waiting for it are removed.
              This cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="accent" icon={TrashIcon} loading={deleting} loadingLabel="Deleting" onClick={confirmDelete}>
                Delete
              </Button>
              <Button variant="text" disabled={deleting} onClick={() => setToDelete(null)}>
                Keep it
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageFrame>
  );
}

/** A token with its actions printed underneath. */
function ListingRow({ listing: l, onEdit, onDelete }) {
  const reserved = l.reservedQuantity || 0;
  return (
    <article>
      <TokenCard as="div" listing={l} stamp={stampOf(l)} headingLevel={2} />
      <div className="mt-1 flex flex-wrap gap-x-1">
        {/* Closed tokens are a record: they can be removed, not changed. */}
        {isOpen(l) && (
          <Button variant="text" icon={PencilSimpleIcon} onClick={onEdit} aria-label={`Edit ${l.title}`}>
            Edit
          </Button>
        )}
        {/* Reserved portions belong to approved requests, and the server
            refuses to delete those, so the button is not offered at all. */}
        {reserved === 0 && (
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${l.title}`}
            className="inline-flex min-h-12 items-center gap-2 rounded-control px-3 text-chilli-deep t-label-lg underline-offset-4 hover:underline"
          >
            <TrashIcon size={20} weight="bold" aria-hidden="true" />
            Delete
          </button>
        )}
      </div>
      {reserved > 0 && (
        <p className="px-1 text-ink-soft t-body-sm">
          {quantity(reserved, l.unit)} promised to approved requests, so it stays on record.
        </p>
      )}
    </article>
  );
}
