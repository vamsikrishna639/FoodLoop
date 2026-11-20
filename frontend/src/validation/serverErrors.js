// The frontend checks are never enough on their own: the server may still
// refuse (a used email, "Only 3 boxes left", a listing that just closed).
//
// handleServerError(error, { setError, fields, showSlip })
//   - 400/409 with field errors for fields on this form: each message is put
//     under its input with react-hook-form's setError(), and the first one
//     is focused.
//   - anything else (403, 404, 409 without a field, a network failure): the
//     message is shown as a printed slip.
export function handleServerError(error, { setError, fields = [], showSlip }) {
  const fieldErrors = error?.fieldErrors || {};
  const mine = Object.entries(fieldErrors).filter(([name]) => fields.includes(name));

  if (mine.length > 0) {
    mine.forEach(([name, message], index) => {
      setError(name, { type: 'server', message }, { shouldFocus: index === 0 });
    });
    return;
  }
  showSlip(error?.message || 'Something went wrong. Please try again.', { kind: 'error' });
}
