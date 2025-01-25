import { useRef } from "react";
import type uPlot from "uplot";

import "uplot/dist/uPlot.min.css";

import {
  UplotReact,
  type UplotReactProps,
} from "~/components/u-plot/u-plot-react";
import { containerResizeObserver } from "~/hooks/container-size";
import { cn } from "~/lib/utils";

export type ResponsiveUplotProps = Omit<
  UplotReactProps,
  "options" | "uplotRef" | "sizeRef"
> & {
  options: Omit<uPlot.Options, "height" | "width">;
} & {
  supposedAspectRatio?: number;
  className?: string;
  heightConfig?:
    | {
        min?: number;
        max?: number;
        fixed?: undefined;
      }
    | {
        fixed: number;
        min?: undefined;
        max?: undefined;
      };
};

const adjustToSpace = ({
  uplot,
  container,
  initialAspectRatio,
  heightConfig,
  chartSizeRef,
}: {
  uplot: uPlot;
  container: HTMLDivElement;
  initialAspectRatio: number;
  heightConfig?: ResponsiveUplotProps["heightConfig"];
  chartSizeRef: React.RefObject<{
    width: number;
    height: number;
  }>;
}) => {
  requestAnimationFrame(() => {
    const rect = container.getBoundingClientRect();
    const legendHeight = uplot.root.querySelector(".u-legend")?.clientHeight;
    const possibleHeightForCanvas = rect.height - (legendHeight ?? 0);
    let height = heightConfig?.fixed ?? possibleHeightForCanvas;

    if (heightConfig?.min && height < heightConfig.min) {
      height = heightConfig.min;
      container.style.aspectRatio = `${rect.width} / ${height + (legendHeight ?? 0)}`;
      container.dataset.squished = "true";
    } else if (heightConfig?.max && height > heightConfig.max) {
      height = heightConfig.max;
      container.style.aspectRatio = `${rect.width} / ${height}`;
      container.dataset.squished = "true";
    } else if (
      container.dataset.squished === "true" &&
      height >= (heightConfig?.max ?? Infinity)
    ) {
      container.dataset.squished = "false";
      container.style.aspectRatio = initialAspectRatio.toString();
    }

    uplot.setSize({
      width: rect.width,
      height,
    });
    chartSizeRef.current = {
      width: rect.width,
      height,
    };
  });
};

export function ResponsiveUplot({
  supposedAspectRatio,
  className,
  heightConfig,
  ...uplotProps
}: ResponsiveUplotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot>(null);
  const chartSizeRef = useRef({
    width: 0,
    height:
      // if fixed and in browser, calculate height
      // if min height is provided, use it
      heightConfig?.fixed && typeof window !== "undefined"
        ? heightConfig.fixed * window.devicePixelRatio
        : (heightConfig?.min ?? 0),
  });

  containerResizeObserver(containerRef, () => {
    if (!uplotRef.current) return;
    adjustToSpace({
      uplot: uplotRef.current,
      container: containerRef.current!,
      initialAspectRatio: supposedAspectRatio ?? 1,
      heightConfig,
      chartSizeRef,
    });
  });

  return (
    <div
      className={cn("flex", className)}
      style={
        heightConfig?.fixed
          ? undefined
          : {
              aspectRatio: supposedAspectRatio,
            }
      }
      ref={(node) => {
        if (!node) return;
        containerRef.current = node;
        adjustToSpace({
          uplot: uplotRef.current!,
          container: node,
          initialAspectRatio: supposedAspectRatio ?? 1,
          heightConfig,
          chartSizeRef,
        });
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
