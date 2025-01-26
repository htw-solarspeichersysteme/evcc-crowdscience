import { useRef } from "react";
import type uPlot from "uplot";
import { type Hooks } from "uplot";

import { cn } from "~/lib/utils";

export type UPlotToolTipData = {
  seriesId: number | null;
  dataId: number | null;
};

export function UPlotTooltip({
  ref,
  className,
}: {
  ref: React.RefObject<HTMLDivElement | null>;
  className?: string;
}) {
  return (
    <div
      ref={ref}
      style={{
        display: "none",
      }}
      className={cn(
        "absolute bg-white border-2 border-black p-2 pointer-events-none z-30 whitespace-pre text-sm",
        className,
      )}
    ></div>
  );
}

export function tooltipPlugin({
  onclick,
  tooltipRef,
  formatTooltip,
}: {
  onclick?: (u: uPlot, seriesIdx: number, dataIdx: number) => void;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  formatTooltip: (u: uPlot, seriesIdx: number, dataIdx: number) => string;
}) {
  const dataRef = useRef<UPlotToolTipData>({
    seriesId: null,
    dataId: null,
  });

  function hideTooltip(u: uPlot) {
    if (tooltipRef.current != null) {
      tooltipRef.current.style.display = "none";
      u.over.style.cursor = "";
    }
  }

  function showTooltip(u: uPlot) {
    if (tooltipRef.current == null) return;

    if (onclick) u.over.style.cursor = "pointer";

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    tooltipRef.current.style.borderColor =
      // @ts-expect-error works well enough
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      u.series[dataRef.current.seriesId]._stroke;

    tooltipRef.current.innerHTML = formatTooltip(
      u,
      dataRef.current.seriesId!,
      dataRef.current.dataId!,
    );

    tooltipRef.current.style.display = "block";
  }

  function positionTooltip(u: uPlot) {
    if (tooltipRef.current == null) return;
    const { layerX, layerY } = u.cursor.event!;
    // @ts-expect-error works well enough
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const left = u.axes?.[0]?._size ?? 0;
    tooltipRef.current.style.top = layerY + "px";
    tooltipRef.current.style.left = layerX + left + "px";
  }

  function syncTooltip(u: uPlot) {
    if (tooltipRef.current == null) return;
    if (dataRef.current.seriesId == null || dataRef.current.dataId == null) {
      hideTooltip(u);
    } else {
      positionTooltip(u);
      showTooltip(u);
    }
  }

  return {
    hooks: {
      ready: (u) => {
        if (!onclick) return;
        let clientX = 0;
        let clientY = 0;

        u.over.addEventListener("mousedown", (e) => {
          clientX = e.clientX;
          clientY = e.clientY;
        });

        u.over.addEventListener("mouseup", (e) => {
          if (
            dataRef.current.seriesId != null &&
            dataRef.current.dataId != null &&
            e.clientX == clientX &&
            e.clientY == clientY
          ) {
            onclick(u, dataRef.current.seriesId, dataRef.current.dataId);
          }
        });
      },
      setSeries: (u, sidx) => {
        dataRef.current.seriesId = sidx;
        syncTooltip(u);
      },
      setCursor: (u) => {
        dataRef.current.dataId = u.cursor.idx ?? null;
        syncTooltip(u);
      },
    } satisfies Hooks.Defs,
  };
}

// <style>
//         {/* .u-tooltip {
//           font-size: 10pt;
//           position: absolute;
//           background: #fff;
//           display: none;
//           border: 2px solid black;
// 			padding: 4px;
//           pointer-events: none;
//           z-index: 100;
//           white-space: pre;
//           font-family: monospace;
//         } */}
//       </style>

// export function tooltipPlugin({
//   onclick,
//   commits,
//   isInterpolated,
//   shiftX = 10,
//   shiftY = 10,
// }: {
//   onclick: (u: uPlot, seriesIdx: number, dataIdx: number) => void;
//   commits: any;
//   isInterpolated: (idx: number) => boolean;
//   shiftX?: number;
//   shiftY?: number;
// }) {
//   let tooltipLeftOffset = 0;
//   let tooltipTopOffset = 0;

//   const tooltip = document.createElement("div");

//   tooltip.className =
//     "u-tooltip font-mono text-xs absolute bg-white border-2 border-black p-4 pointer-events-none z-100 whitespace-pre";

//   let seriesIdx = null;
//   let dataIdx = null;

//   const fmtDate = uPlot.fmtDate("{M}/{D}/{YY} {h}:{mm}:{ss} {AA}");

//   let tooltipVisible = false;

//   function showTooltip(u: uPlot) {
//     if (!tooltipVisible) {
//       tooltip.style.display = "block";
//       u.over.style.cursor = "pointer";
//       tooltipVisible = true;
//     }
//   }

//   function hideTooltip(u: uPlot) {
//     if (tooltipVisible) {
//       tooltip.style.display = "none";
//       u.over.style.cursor = null;
//       tooltipVisible = false;
//     }
//   }

//   function setTooltip(u: uPlot) {
//     showTooltip(u);

//     const top = u.valToPos(u.data[seriesIdx][dataIdx], "y");
//     const lft = u.valToPos(u.data[0][dataIdx], "x");

//     tooltip.style.top = tooltipTopOffset + top + shiftX + "px";
//     tooltip.style.left = tooltipLeftOffset + lft + shiftY + "px";

//     // tooltip.style.borderColor = isInterpolated(dataIdx)
//     //   ? interpolatedColor
//     //   : seriesColors[seriesIdx - 1];
//     tooltip.style.borderColor = "red";
//     // const pctSinceStart = (
//     //   ((u.data[seriesIdx][dataIdx] - u.data[seriesIdx][0]) /
//     //     u.data[seriesIdx][0]) *
//     //   100
//     // ).toFixed(2);
//     tooltip.textContent =
//       fmtDate(new Date(u.data[0][dataIdx] * 1e3)) +
//       " - " +
//       //   commits[dataIdx][1].slice(0, 10) +
//       "\n" +
//       uPlot.fmtNum(u.data[seriesIdx][dataIdx]);
//     //   " (" +
//     //   pctSinceStart +
//     //   "% since start)";
//   }

//   return {
//     hooks: {
//       ready: [
//         (u) => {
//           tooltipLeftOffset = parseFloat(u.over.style.left);
//           tooltipTopOffset = parseFloat(u.over.style.top);
//           u.root.querySelector(".u-wrap").appendChild(tooltip);

//           let clientX;
//           let clientY;

//           u.over.addEventListener("mousedown", (e) => {
//             clientX = e.clientX;
//             clientY = e.clientY;
//           });

//           u.over.addEventListener("mouseup", (e) => {
//             // clicked in-place
//             if (e.clientX == clientX && e.clientY == clientY) {
//               if (seriesIdx != null && dataIdx != null) {
//                 onclick(u, seriesIdx, dataIdx);
//               }
//             }
//           });
//         },
//       ],
//       setCursor: [
//         (u) => {
//           const c = u.cursor;

//           if (dataIdx != c.idx) {
//             dataIdx = c.idx;

//             if (seriesIdx != null) setTooltip(u);
//           }
//         },
//       ],
//       setSeries: [
//         (u, sidx) => {
//           if (seriesIdx != sidx) {
//             seriesIdx = sidx;

//             if (sidx == null) hideTooltip(u);
//             else if (dataIdx != null) setTooltip(u);
//           }
//         },
//       ],
//       //   drawAxes: [
//       //     (u) => {
//       //       const { ctx } = u;
//       //       const { left, top, width, height } = u.bbox;

//       //       const interpolatedColorWithAlpha = "#fcb0f17a";

//       //       ctx.save();

//       //       ctx.strokeStyle = interpolatedColorWithAlpha;
//       //       ctx.beginPath();

//       //       const [i0, i1] = u.series[0].idxs;

//       //       for (let j = i0; j <= i1; j++) {
//       //         const v = u.data[0][j];

//       //         if (isInterpolated(j)) {
//       //           const cx = Math.round(u.valToPos(v, "x", true));
//       //           ctx.moveTo(cx, top);
//       //           ctx.lineTo(cx, top + height);
//       //         }
//       //       }

//       //       ctx.closePath();
//       //       ctx.stroke();
//       //       ctx.restore();
//       //     },
//       //   ],
//     } satisfies Hooks.Arrays,
//   };
// }
