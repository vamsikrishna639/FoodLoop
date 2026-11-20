// A list read from the server that stays fresh while the page is open.
//
//   const runs = useLiveList(async () => (await mine()).pickups);
//   runs.items          null until the first load, then the list
//   runs.error          why the last load failed (pages show it only while
//                       there is nothing to show yet)
//   runs.load()         read the list again (after a refusal, on Retry)
//   runs.upsert(item)   put a saved item in the list (new ones first)
//   runs.updatedAt      when the list was last read (a Date), for "Updated 9:18 PM"
//
// It loads when the page opens and again on every live beat (every 20
// seconds while the tab is visible, see context/LiveContext.jsx).
//
// Two guards keep the list right when a refresh and an action overlap:
//   - only the reply to the newest load is used;
//   - a reply to a load that started before this page changed an item
//     (upsert) is dropped, because it may hold the item as it was before.
//     The next beat brings the up-to-date list.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveBeat } from '../context/LiveContext';

export default function useLiveList(fetchItems) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const latestLoad = useRef(0);
  const changes = useRef(0);

  const load = useCallback(async () => {
    const id = ++latestLoad.current;
    const startedAt = changes.current;
    try {
      const list = await fetchItems();
      if (id !== latestLoad.current || startedAt !== changes.current) return;
      setItems(list);
      setUpdatedAt(new Date());
      setError(null);
    } catch (err) {
      if (id === latestLoad.current) setError(err.message);
    }
  }, [fetchItems]);

  useEffect(() => {
    load();
  }, [load]);

  useLiveBeat(load);

  const upsert = useCallback((item) => {
    changes.current += 1;
    setItems((current) => {
      if (!current) return [item];
      const exists = current.some((x) => x.id === item.id);
      return exists ? current.map((x) => (x.id === item.id ? item : x)) : [item, ...current];
    });
  }, []);

  return { items, error, load, upsert, updatedAt };
}
