import { useEffect, useState, type RefObject } from 'react';

export type ElementSize = {
  width: number;
  height: number;
};

export function useElementSize<TElement extends HTMLElement>(
  elementRef: RefObject<TElement | null>,
  initialSize: ElementSize = { width: 0, height: 0 }
): ElementSize {
  const [size, setSize] = useState<ElementSize>(initialSize);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect;
      if (!next) {
        return;
      }

      setSize({
        width: next.width,
        height: next.height
      });
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [elementRef]);

  return size;
}

