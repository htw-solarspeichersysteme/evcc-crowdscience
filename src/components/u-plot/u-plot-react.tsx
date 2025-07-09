/**
 * This code is modified from: https://github.com/skalinichev/uplot-wrappers/blob/master/react/uplot-react.tsx
 */

import { useCallback, useEffect, useRef } from "react";
import { deepEqual } from "@tanstack/react-router";
import uPlot from "uplot";

export type UplotReactProps = {
  uplotRef: React.RefObject<uPlot | null>;
  options: Omit<uPlot.Options, "height" | "width">;
  sizeRef: React.RefObject<{ width: number; height: number }>;
  data: uPlot.AlignedData;
  onDelete?: (chart: uPlot) => void;
  onCreate?: (chart: uPlot) => void;
  resetScales?: boolean;
  className?: string;
};

export function UplotReact({
  uplotRef,
  sizeRef,
  options,
  data,
  onDelete,
  onCreate,
  resetScales = true,
  className,
}: UplotReactProps) {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const propOptionsRef = useRef(options);
  const propDataRef = useRef(data);

  const destroy = useCallback(
    (chart: uPlot | null) => {
      if (chart) {
        onDelete?.(chart);
        chart.destroy();
        uplotRef.current = null;
      }
    },
    [onDelete],
  );

  const create = useCallback(() => {
    const newChart = new uPlot(
      {
        ...propOptionsRef.current,
        width: sizeRef.current.width,
        height: sizeRef.current.height,
      },
      propDataRef.current,
      targetRef.current!,
    );
    uplotRef.current = newChart;
    onCreate?.(newChart);
  }, [onCreate]);

  // check whether options changed
  useEffect(() => {
    const optionsChanged = !deepEqual(propOptionsRef.current, options);
    propOptionsRef.current = options;
    if (optionsChanged && uplotRef.current) {
      destroy(uplotRef.current);
      create();
    }
  }, [options, create, destroy]);

  // check whether data changed
  useEffect(() => {
    const dataChanged = !deepEqual(propDataRef.current, data);
    propDataRef.current = data;

    if (dataChanged && uplotRef.current) {
      uplotRef.current.setData(data, resetScales);
      if (!resetScales) uplotRef.current.redraw();
    }
  }, [data, resetScales, create]);

  return (
    <div
      ref={(node) => {
        targetRef.current = node;
        if (!uplotRef.current) create();
      }}
      className={className}
    />
  );
}
