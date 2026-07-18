import { useEffect, useState } from 'react';

// Touch-primary devices (phones, tablets, iPad) report no hover capability
// and a coarse pointer. Desktops with a mouse match neither. We watch the
// media query live so a device that gains/loses a pointer (e.g. iPad with a
// trackpad attached) flips at runtime.
const QUERY = '(hover: none) and (pointer: coarse)';

export default function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.(QUERY).matches
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(QUERY);
    const onChange = (e) => setIsTouch(e.matches);
    setIsTouch(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isTouch;
}
