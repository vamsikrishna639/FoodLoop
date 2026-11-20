// A loading placeholder in the exact shape of a TokenCard, so the page does
// not jump when real data arrives. Used instead of spinners. The pulse is a
// looping opacity change that stops under reduced motion (see .pulse).
export default function SkeletonToken() {
  const bar = 'rounded-stamp bg-line';
  return (
    <div role="status" aria-label="Loading food listing" className="slip">
      <div className="slip-paper pulse flex flex-col" aria-hidden="true">
        <div className="flex gap-3 p-4">
          <div className={`${bar} size-[68px] shrink-0`} />
          <div className="flex-1">
            <div className={`${bar} h-3 w-16`} />
            <div className={`${bar} mt-3 h-[22px] w-4/5`} />
            <div className={`${bar} mt-2 h-3 w-1/2`} />
          </div>
        </div>
        <div className="flex h-[var(--stub)] flex-col bg-sunken">
          <div className="perforation mx-[13px]" />
          <div className="flex flex-1 items-center px-4">
            <div className="flex-1">
              <div className={`${bar} h-[18px] w-24`} />
              <div className={`${bar} mt-2 h-3 w-36`} />
            </div>
            <div className="size-10 rounded-full border-4 border-line" />
          </div>
        </div>
      </div>
    </div>
  );
}
