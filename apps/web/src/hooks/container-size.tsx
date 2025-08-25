import { useEffect } from "react";

export const containerResizeObserver = (
  refs: React.RefObject<HTMLElement | null>[],
  listenToWindow: boolean,
  callback: ResizeObserverCallback,
) => {
  useEffect(() => {
    const resizeObserver = new ResizeObserver(callback);
    refs.forEach((ref) => {
      if (!ref.current) return;
      resizeObserver.observe(ref.current);
    });

    if (listenToWindow) {
      resizeObserver.observe(document.body);
    }

    return () => resizeObserver.disconnect();
  }, [refs, listenToWindow]);
};
