import { useRef } from "react";
import type uPlot from "uplot";

import "uplot/dist/uPlot.min.css";

import {
  UplotReact,
  type UplotReactProps,
} from "~/components/u-plot/u-plot-react";
import { containerResizeObserver } from "~/hooks/container-size";
import { cn } from "~/lib/utils";

type ResponsiveUplotProps = Omit<
  UplotReactProps,
  "options" | "uplotRef" | "sizeRef"
> & {
  options: Omit<uPlot.Options, "height" | "width">;
} & {
  className?: string;
  aspectRatio: number;
};

const adjustToSpace = (uplot: uPlot, rect: DOMRect) => {
  const legendHeight = uplot.root.querySelector(".u-legend")?.clientHeight;
  const size = {
    width: rect.width,
    height: rect.height - (legendHeight ?? 0),
  };
  uplot.setSize(size);
  return size;
};

export function ResponsiveUplot({
  aspectRatio,
  className,
  ...uplotProps
}: ResponsiveUplotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot>(null);
  const chartSizeRef = useRef({
    width: 0,
    height: 0,
  });

  containerResizeObserver(containerRef, (rect) => {
    if (!uplotRef.current) return;
    chartSizeRef.current = adjustToSpace(uplotRef.current, rect);
  });

  return (
    <div
      className={cn("flex", className)}
      style={{
        aspectRatio,
      }}
      ref={(node) => {
        if (!node) return;
        containerRef.current = node;
        adjustToSpace(uplotRef.current!, node.getBoundingClientRect());
      }}
    >
      <UplotReact
        {...uplotProps}
        sizeRef={chartSizeRef}
        uplotRef={uplotRef}
        options={{
          ...uplotProps.options,
        }}
        className="w-0"
      />
    </div>
  );
}
