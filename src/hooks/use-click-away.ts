// useClickAway hook - Close dropdown on outside click or ESC

import { useEffect, RefObject } from 'react';

export function useClickAway(
  ref: RefObject<HTMLElement | null>,
  onClickAway: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClickAway();
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClickAway();
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [ref, onClickAway, enabled]);
}
