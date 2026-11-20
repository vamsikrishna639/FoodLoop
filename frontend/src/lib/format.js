// Date, time and quantity formatting used across the app, in one place.

const timeFormat = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const numberFormat = new Intl.NumberFormat('en-IN'); // Indian grouping: 1,24,000

/** "4:30 pm" -> "4:30 PM" */
export function time(date) {
  return timeFormat.format(new Date(date)).toUpperCase();
}

/** "Today", "Tomorrow", "Yesterday" or "Sat 14 Nov". */
export function day(date) {
  const d = new Date(date);
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(d) - startOf(new Date())) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return dayFormat.format(d).replace(',', '');
}

/** "Today, 4:30 PM" */
export function dayTime(date) {
  return `${day(date)}, ${time(date)}`;
}

/** "just now", "8 min ago", "2 h ago", then "Yesterday, 4:30 PM". */
export function ago(date) {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 12 * 60) return `${Math.floor(minutes / 60)} h ago`;
  return dayTime(date);
}

const SINGULAR = { boxes: 'box', plates: 'plate', packets: 'packet', kg: 'kg' };

/** "12 boxes", "1 box", "1 kg". Same rules as the backend's amount(). */
export function quantity(n, unit) {
  return n === 1 ? `1 ${SINGULAR[unit] || unit}` : `${n} ${unit}`;
}

/** 124000 -> "1,24,000" */
export function number(n) {
  return numberFormat.format(n);
}

/** "Ananya Rao" -> "AR", "Rohit" -> "R". Used in the user chip. */
export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "Chicken Biryani" -> "CB", "Samosa" -> "SA". Printed on a token. */
export function dishInitials(title = '') {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'FL';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
