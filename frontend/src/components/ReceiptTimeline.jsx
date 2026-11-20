// A history printed like a till receipt: torn zigzag top and bottom edges,
// mono text and dotted leaders between each label and its value.
//
//     Chicken Biryani                      [STAMP]
//     REQUEST RECEIPT  #FL-0003
//     - - - - - - - - - - - - - - - - - - - -
//     Requested ............. 12:40 PM
//     Approved .............. 12:52 PM
//     Picked up ................ --:--
//
// entries: [{ label, value, emphasis }]; a null value is a step that has not
// happened yet and prints "--:--" in soft ink.
export default function ReceiptTimeline({ title, heading, reference, entries, stamp, footer, className = '' }) {
  return (
    <div className={`receipt-edge ${className}`}>
      <div className="receipt px-4 pb-7 pt-7">
        {/* The title leads; the receipt type and number print under it. The
            stamp sits beside it, so a long title wraps instead of running
            underneath the stamp. */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="t-title-lg text-ink [overflow-wrap:anywhere]">{title}</h3>
            <p className="mt-1 text-ink-soft t-mono-sm">{[heading, reference].filter(Boolean).join('  ')}</p>
          </div>
          {stamp && <div className="shrink-0 pt-1.5">{stamp}</div>}
        </div>

        <div className="rule-dashed my-3" aria-hidden="true" />

        <dl>
          {entries.map((entry) => (
            <ReceiptRow key={entry.label} {...entry} />
          ))}
        </dl>

        {footer && (
          <>
            <div className="rule-dashed mb-3 mt-2" aria-hidden="true" />
            <p className="text-center text-ink-soft t-mono-sm">{footer}</p>
          </>
        )}
      </div>
    </div>
  );
}

function ReceiptRow({ label, value, emphasis = false }) {
  const done = value !== null && value !== undefined;
  const tone = `${done ? 'text-ink' : 'text-ink-soft'} ${emphasis ? 'font-bold' : ''}`;
  return (
    <div className={`flex items-end gap-1.5 py-[5px] t-mono ${tone}`}>
      <dt className="max-w-[40%] shrink-0">{label}</dt>
      {/* The leader fills the gap, so the value always ends at the right edge. */}
      <span className="leader mb-[5px] min-w-3 flex-1" aria-hidden="true" />
      <dd className="min-w-0 max-w-[60%] text-right [overflow-wrap:anywhere]">
        {done ? value : <span aria-label="not yet">--:--</span>}
      </dd>
    </div>
  );
}
