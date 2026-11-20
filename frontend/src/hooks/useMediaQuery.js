// True while a CSS media query matches, e.g. useMediaQuery('(min-width: 900px)').
// Most responsive changes are plain CSS (Tailwind's tablet:/desktop:); this is
// only for screens whose structure differs, like the welcome slides.
import { useEffect, useState } from 'react';

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);

  return matches;
}
