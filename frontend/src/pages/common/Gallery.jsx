// The component gallery (/gallery): every signature component of the
// Canteen Token design system on one page, with made-up sample data, so the
// design can be checked in both themes without signing in.
// Nothing here talks to the API.
import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowClockwiseIcon, PlusIcon } from '@phosphor-icons/react';
import useValidatedForm from '../../hooks/useValidatedForm';
import BrandMark from '../../components/BrandMark';
import Button from '../../components/Button';
import Chalkboard, { ChalkItem } from '../../components/Chalkboard';
import DeadlineClock from '../../components/DeadlineClock';
import EmptyState, { ErrorState } from '../../components/EmptyState';
import { PasswordField, TextField } from '../../components/Field';
import ImpactNumber from '../../components/ImpactNumber';
import PortionMeter from '../../components/PortionMeter';
import ReceiptTimeline from '../../components/ReceiptTimeline';
import SkeletonToken from '../../components/SkeletonToken';
import StampDrop from '../../components/StampDrop';
import StatusStamp, { STAMPS } from '../../components/StatusStamp';
import ThemeSwitch from '../../components/ThemeSwitch';
import TokenCard from '../../components/TokenCard';
import VegMarker from '../../components/VegMarker';
import { useSlip } from '../../context/ToastContext';
import { loginRules } from '../../validation/loginRules';

const inMinutes = (m) => new Date(Date.now() + m * 60000).toISOString();

// Sample tokens covering every state the card has to handle.
const SAMPLES = [
  {
    stamp: 'available',
    listing: {
      title: 'Chicken Biryani',
      donorName: 'Main Block Canteen',
      tokenNumber: 'FL-0003',
      quantity: 20,
      reservedQuantity: 8,
      unit: 'boxes',
      foodType: 'non-veg',
      pickupDeadline: inMinutes(240),
    },
  },
  {
    stamp: 'available',
    listing: {
      title: 'Veg Pulao with Raita',
      donorName: 'Main Block Canteen',
      tokenNumber: 'FL-0007',
      quantity: 10,
      reservedQuantity: 3,
      unit: 'plates',
      foodType: 'veg',
      pickupDeadline: inMinutes(42),
    },
  },
  {
    stamp: 'reserved',
    listing: {
      title: 'Idli and Sambar breakfast packs, a very long dish name that wraps',
      donorName: 'Hostel B Mess Kitchen',
      tokenNumber: 'FL-0012',
      quantity: 6,
      reservedQuantity: 6,
      unit: 'packets',
      foodType: 'mixed',
      pickupDeadline: inMinutes(9),
    },
  },
  {
    stamp: 'expired',
    listing: {
      title: 'Rajma Chawal',
      donorName: 'Main Block Canteen',
      tokenNumber: 'FL-0001',
      quantity: 12,
      reservedQuantity: 4,
      unit: 'kg',
      foodType: 'veg',
      pickupDeadline: inMinutes(-30),
    },
  },
];

function Section({ title, note, children }) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="t-headline-md text-ink">{title}</h2>
      {note && <p className="mt-1 max-w-[65ch] text-ink-soft t-body">{note}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function Gallery() {
  const showSlip = useSlip();
  const [selected, setSelected] = useState(0);
  const [dropKey, setDropKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const {
    field,
    handleSubmit,
    formState: { errors },
  } = useValidatedForm();

  return (
    <main id="main" className="px-4 pb-16 pt-6 tablet:px-6 desktop:px-10">
      <div className="max-w-[1200px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/home" aria-label="FoodLoop home">
            <BrandMark size={28} />
          </Link>
          <div className="w-full max-w-[340px]">
            <ThemeSwitch />
          </div>
        </div>

        <h1 className="mt-10 t-display-sm text-ink desktop:t-display-md">Component gallery</h1>
        <p className="mt-2 max-w-[65ch] text-ink-soft t-body-lg">
          Every piece of the Canteen Token design system with sample data. Switch to chalkboard mode above to check the
          dark theme.
        </p>

        <div className="mt-10 space-y-12">
          <Section title="Token cards" note="Tap a slip to select it. Notches are a CSS mask; the outline follows them.">
            <div className="grid gap-5 tablet:grid-cols-2">
              {SAMPLES.map((s, i) => (
                <TokenCard
                  key={s.listing.tokenNumber}
                  listing={s.listing}
                  stamp={s.stamp}
                  selected={selected === i}
                  onOpen={() => setSelected(i)}
                />
              ))}
              <SkeletonToken />
            </div>
          </Section>

          <Section title="Status stamps" note="Every status is a word. DELIVERED has a double border; EXPIRED is crossed out.">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-5">
              {Object.keys(STAMPS).map((kind) => (
                <StatusStamp key={kind} kind={kind} />
              ))}
              <StatusStamp label="Donor" ink="text-chilli-deep" />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <div className="grid h-24 w-48 place-items-center rounded-slip border border-line bg-surface">
                <StampDrop key={dropKey} play={dropKey > 0}>
                  <StatusStamp kind="approved" size="lg" />
                </StampDrop>
              </div>
              <Button variant="outline" icon={ArrowClockwiseIcon} onClick={() => setDropKey((k) => k + 1)}>
                Play the stamp drop
              </Button>
            </div>
            <p className="mt-3 max-w-[65ch] text-ink-soft t-body-sm">
              The drop is reserved for a donor approving a request. With reduced motion turned on in the system, it fades in
              at rest instead.
            </p>
          </Section>

          <Section title="Portions, deadlines and markers">
            <div className="flex flex-wrap items-start gap-10">
              <PortionMeter total={8} reserved={3} unit="plates" />
              <PortionMeter total={10} reserved={6} unit="boxes" />
              <PortionMeter total={40} reserved={25} unit="packets" />
              <PortionMeter total={15} reserved={5} unit="kg" />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-10">
              <DeadlineClock deadline={inMinutes(300)} />
              <DeadlineClock deadline={inMinutes(45)} />
              <DeadlineClock deadline={inMinutes(10)} />
              <DeadlineClock deadline={inMinutes(-5)} />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-8">
              <VegMarker type="veg" showLabel />
              <VegMarker type="non-veg" showLabel />
              <VegMarker type="mixed" showLabel />
            </div>
          </Section>

          <Section title="Receipt and chalkboard">
            <div className="grid items-start gap-8 desktop:grid-cols-2">
              <ReceiptTimeline
                title="Chicken Biryani, 5 boxes"
                heading="Request receipt"
                reference="#FL-0003"
                stamp={<StatusStamp kind="approved" />}
                entries={[
                  { label: 'Requested', value: '12:40 PM' },
                  { label: 'Approved', value: '12:52 PM' },
                  { label: 'Volunteer', value: 'Kiran Kumar' },
                  { label: 'Picked up', value: null, emphasis: true },
                  { label: 'Delivered', value: null },
                ]}
                footer="Thank you for collecting"
              />
              <Chalkboard
                title="Today's Surplus"
                caption="Fri 20 Nov, 3 tokens on the counter"
                trailing={
                  <Button variant="chalk" icon={PlusIcon}>
                    Post food
                  </Button>
                }
              >
                <ChalkItem name="Chicken Biryani" note="Closes 4:30 PM" trailing="12 boxes" />
                <ChalkItem name="Veg Pulao with Raita" note="Closes 5:00 PM" trailing="7 plates" />
                <ChalkItem name="Samosa" note="Closes 6:15 PM" trailing="30 packets" />
              </Chalkboard>
            </div>
          </Section>

          <Section title="Impact number" note="Counts up the first time it appears in a session.">
            <ImpactNumber value={1240} caption="portions delivered so far" />
          </Section>

          <Section title="Buttons">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="accent">Request food</Button>
              <Button>Approve</Button>
              <Button variant="outline">Turn down</Button>
              <Button variant="text">Skip</Button>
              <Button disabled>Not yet</Button>
              <Button
                variant="accent"
                loading={loading}
                loadingLabel="Sending"
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 2000);
                }}
              >
                Show loading
              </Button>
            </div>
          </Section>

          <Section title="Form fields and messages" note="Leave a field to check it; errors print under the field with an icon.">
            <form noValidate onSubmit={handleSubmit(() => showSlip('Form is valid'))} className="max-w-[440px]">
              <TextField label="Email" type="email" error={errors.email} {...field('email', loginRules.email)} />
              <PasswordField helper="At least 6 characters" error={errors.password} {...field('password', loginRules.password)} />
              <div className="flex flex-wrap gap-3">
                <Button type="submit">Check</Button>
                <Button variant="outline" onClick={() => showSlip('Request sent to the canteen')}>
                  Slip: done
                </Button>
                <Button variant="outline" onClick={() => showSlip('Only 3 boxes left', { kind: 'error' })}>
                  Slip: error
                </Button>
                <Button variant="outline" onClick={() => showSlip('Still in the queue', { kind: 'note' })}>
                  Slip: note
                </Button>
              </div>
            </form>
          </Section>

          <Section title="Empty and error states">
            <div className="grid gap-10 desktop:grid-cols-2">
              <EmptyState
                art="counter"
                title="The counter's clear"
                message="Check back after lunch service. New tokens appear here as soon as the canteen posts them."
              />
              <ErrorState message="Could not reach the FoodLoop server. Check that it is running." onRetry={() => {}} />
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}
