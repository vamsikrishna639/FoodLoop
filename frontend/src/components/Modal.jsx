// A modal built on the browser's own <dialog> element, which gives focus
// trapping, Escape to close and an inert page behind it for free.
//
//   Phones (< 600px):  a bottom sheet that slides up from the bottom edge.
//   Wider:             a dialog in the middle of the screen.
//
// The entrance is a CSS transition with @starting-style (see .modal in
// styles/index.css): 280ms slide for the sheet, 200ms fade + slight scale
// for the dialog, opacity only under reduced motion. Closing is instant.
//
//   <Modal open={open} onClose={() => setOpen(false)} labelledBy="form-title">...</Modal>
import { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, labelledBy, closeOnBackdrop = true, children }) {
  const ref = useRef(null);

  // Open and close the real <dialog> when `open` changes.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      className="modal"
      // Escape fires "cancel". React state decides, so the dialog only
      // closes through onClose.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A click on the dim area outside the box lands on <dialog> itself.
      onClick={(e) => {
        if (closeOnBackdrop && e.target === ref.current) onClose();
      }}
    >
      {/* The grab bar only shows on phones, where this is a sheet. */}
      <div aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-perforation tablet:hidden" />
      {open && children}
    </dialog>
  );
}
