import { useEffect } from "react";

export const containerResizeObserver = (
  ref: React.RefObject<HTMLElement | null>,
  callback: (rect: DOMRect) => void,
) => {
  useEffect(() => {
    if (!ref.current) return;
    const resizeObserver = new ResizeObserver(() => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      callback(box);
    });
    resizeObserver.observe(ref.current);

    return () => resizeObserver.disconnect();
  }, [ref.current]);
};
