import uPlot from "uplot";

import { Quadtree } from "./quadtree";

// Type definitions
type JustifyMode =
  | typeof SPACE_BETWEEN
  | typeof SPACE_AROUND
  | typeof SPACE_EVENLY;
type TimelineMode = 1 | 2; // 1 = spans, 2 = matrix

interface TimelinePluginOptions {
  mode: TimelineMode;
  size: [number, number]; // [sizeFactor, maxWidth]
  count: number;
  fill: (seriesIdx: number, dataIdx: number, value: number) => string;
  stroke: (seriesIdx: number, dataIdx: number, value: number) => string;
  width: number;
  align?: -1 | 0 | 1;
}

// Helper functions with proper types
function pointWithin(
  px: number,
  py: number,
  rlft: number,
  rtop: number,
  rrgt: number,
  rbtm: number,
): boolean {
  return px >= rlft && px <= rrgt && py >= rtop && py <= rbtm;
}

const { round, min, max, ceil } = Math;

function roundDec(val: number, dec: number): number {
  return Math.round(val * (dec = 10 ** dec)) / dec;
}

// Constants
const SPACE_BETWEEN = 1;
const SPACE_AROUND = 2;
const SPACE_EVENLY = 3;

const coord = (i: number, offs: number, iwid: number, gap: number): number =>
  roundDec(offs + i * (iwid + gap), 6);

function distr(
  numItems: number,
  sizeFactor: number,
  justify: JustifyMode,
  onlyIdx: number | null,
  each: (index: number, offset: number, width: number) => void,
): void {
  const space = 1 - sizeFactor;

  let gap =
    justify == SPACE_BETWEEN
      ? space / (numItems - 1)
      : justify == SPACE_AROUND
        ? space / numItems
        : justify == SPACE_EVENLY
          ? space / (numItems + 1)
          : 0;

  if (isNaN(gap) || gap == Infinity) gap = 0;

  const offs =
    justify == SPACE_BETWEEN
      ? 0
      : justify == SPACE_AROUND
        ? gap / 2
        : justify == SPACE_EVENLY
          ? gap
          : 0;

  const iwid = sizeFactor / numItems;
  const _iwid = roundDec(iwid, 6);

  if (onlyIdx == null) {
    for (let i = 0; i < numItems; i++)
      each(i, coord(i, offs, iwid, gap), _iwid);
  } else each(onlyIdx, coord(onlyIdx, offs, iwid, gap), _iwid);
}

interface DrawContext {
  ctx: CanvasRenderingContext2D;
  bbox: uPlot.BBox;
}

interface PathCache {
  fillPaths: Map<string, Path2D>;
  strokePaths: Map<string, Path2D>;
}

export function timelinePlugin(opts: TimelinePluginOptions): uPlot.Plugin {
  const { mode, count, fill, stroke } = opts;
  const pxRatio = typeof window !== "undefined" ? window.devicePixelRatio : 1;

  const laneWidth = 0.9;
  const laneDistr = SPACE_BETWEEN;
  const font = `${round(14 * pxRatio)}px Arial`;

  const size = opts.size ?? [0.6, Infinity];
  const align = opts.align ?? 0;
  const gapFactor = 1 - size[0];
  const maxWidth = (size[1] ?? Infinity) * pxRatio;

  // Initialize state variables
  let quadtree: Quadtree | null = null;
  const hoveredStates = Array(count).fill(null);
  const yMidpoints = Array(count).fill(0);
  const ySplitPoints = Array(count).fill(0);
  let legendTimeValueElement: HTMLElement | null = null;

  const pathCache: PathCache = {
    fillPaths: new Map(),
    strokePaths: new Map(),
  };

  function putBox(
    ctx: CanvasRenderingContext2D,
    rect: (path: Path2D, x: number, y: number, w: number, h: number) => void,
    xOff: number,
    yOff: number,
    left: number,
    top: number,
    width: number,
    height: number,
    strokeWidth: number,
    seriesIdx: number,
    dataIdx: number,
    value: number,
  ): void {
    const fillStyle = fill(seriesIdx + 1, dataIdx, value);
    let fillPath = pathCache.fillPaths.get(fillStyle);

    if (!fillPath) {
      fillPath = new Path2D();
      pathCache.fillPaths.set(fillStyle, fillPath);
    }

    rect(fillPath, left, top, width, height);

    if (strokeWidth) {
      const strokeStyle = stroke(seriesIdx + 1, dataIdx, value);
      let strokePath = pathCache.strokePaths.get(strokeStyle);

      if (!strokePath) {
        strokePath = new Path2D();
        pathCache.strokePaths.set(strokeStyle, strokePath);
      }

      rect(
        strokePath,
        left + strokeWidth / 2,
        top + strokeWidth / 2,
        width - strokeWidth,
        height - strokeWidth,
      );
    }

    if (quadtree) {
      quadtree.add({
        x: round(left - xOff),
        y: round(top - yOff),
        w: width,
        h: height,
        sidx: seriesIdx + 1,
        didx: dataIdx,
      });
    }
  }

  function walk(
    yIdx: number | null,
    count: number,
    dim: number,
    draw: (index: number, offset: number, width: number) => void,
  ): void {
    distr(count, laneWidth, laneDistr, yIdx, (i, offPct, dimPct) => {
      const laneOffPx = dim * offPct;
      const laneWidPx = dim * dimPct;
      draw(i, laneOffPx, laneWidPx);
    });
  }

  function drawBoxes(ctx: CanvasRenderingContext2D): void {
    pathCache.fillPaths.forEach((fillPath, fillStyle) => {
      ctx.fillStyle = fillStyle;
      ctx.fill(fillPath);
    });

    pathCache.strokePaths.forEach((strokePath, strokeStyle) => {
      ctx.strokeStyle = strokeStyle;
      ctx.stroke(strokePath);
    });

    pathCache.fillPaths.clear();
    pathCache.strokePaths.clear();
  }

  function drawPaths(
    u: uPlot,
    seriesIdx: number,
    idx0: number,
    idx1: number,
  ): null {
    uPlot.orient(
      u,
      seriesIdx,
      (
        series,
        dataX,
        dataY,
        scaleX,
        scaleY,
        valToPosX,
        valToPosY,
        xOff,
        yOff,
        xDim,
        yDim,
        moveTo,
        lineTo,
        rect,
      ) => {
        const strokeWidth = round((series.width ?? 0) * pxRatio);

        u.ctx.save();
        rect(u.ctx, u.bbox.left, u.bbox.top, u.bbox.width, u.bbox.height);
        u.ctx.clip();

        walk(seriesIdx - 1, count, yDim, (iy, y0, hgt) => {
          // draw spans
          if (mode == 1) {
            for (let ix = 0; ix < dataY.length; ix++) {
              if (dataY[ix] == null) continue;
              const lft = round(valToPosX(dataX[ix], scaleX, xDim, xOff));

              let nextIx = ix;
              while (dataY[++nextIx] === undefined && nextIx < dataY.length) {}

              const rgt =
                nextIx == dataY.length
                  ? xOff + xDim + strokeWidth
                  : round(valToPosX(dataX[nextIx], scaleX, xDim, xOff));

              putBox(
                u.ctx,
                rect,
                xOff,
                yOff,
                lft,
                round(yOff + y0),
                rgt - lft,
                round(hgt),
                strokeWidth,
                iy,
                ix,
                dataY[ix]!,
              );

              ix = nextIx - 1;
            }
          }
          // draw matrix
          else {
            const colWidth =
              valToPosX(dataX[1], scaleX, xDim, xOff) -
              valToPosX(dataX[0], scaleX, xDim, xOff);
            const gapWidth = colWidth * gapFactor;
            const barWidth = round(
              min(maxWidth, colWidth - gapWidth) - strokeWidth,
            );
            const xShift =
              align == 1 ? 0 : align == -1 ? barWidth : barWidth / 2;

            for (let ix = idx0; ix <= idx1; ix++) {
              if (dataY[ix] == null) continue;
              const lft = valToPosX(dataX[ix], scaleX, xDim, xOff);

              putBox(
                u.ctx,
                rect,
                xOff,
                yOff,
                round(lft - xShift),
                round(yOff + y0),
                barWidth,
                round(hgt),
                strokeWidth,
                iy,
                ix,
                dataY[ix]!,
              );
            }
          }
        });

        u.ctx.lineWidth = strokeWidth;
        drawBoxes(u.ctx);
        u.ctx.restore();
      },
    );

    return null;
  }

  function drawPoints(
    u: uPlot,
    seriesIdx: number,
    idx0: number,
    idx1: number,
  ): false {
    u.ctx.save();
    u.ctx.rect(u.bbox.left, u.bbox.top, u.bbox.width, u.bbox.height);
    u.ctx.clip();

    u.ctx.font = font;
    u.ctx.fillStyle = "black";
    u.ctx.textAlign = mode == 1 ? "left" : "center";
    u.ctx.textBaseline = "middle";

    uPlot.orient(
      u,
      seriesIdx,
      (
        series,
        dataX,
        dataY,
        scaleX,
        scaleY,
        valToPosX,
        valToPosY,
        xOff,
        yOff,
        xDim,
        yDim,
        moveTo,
        lineTo,
        rect,
      ) => {
        const strokeWidth = round((series.width || 0) * pxRatio);
        const y = round(yMidpoints[seriesIdx - 1]);
      },
    );

    u.ctx.restore();
    return false;
  }

  const fmtDate = uPlot.fmtDate("{YYYY}-{MM}-{DD} {HH}:{mm}:{ss}");

  return {
    hooks: {
      init: (u: uPlot) => {
        legendTimeValueElement = u.root.querySelector(
          ".u-series:first-child .u-value",
        )!;
      },
      drawClear: (u: uPlot) => {
        // Initialize or reset quadtree before each draw
        quadtree = new Quadtree(0, 0, u.bbox.width, u.bbox.height);

        // Force-clear the path cache
        u.series.forEach((s) => {
          s._paths = null;
        });
      },
      setCursor: (u) => {
        if (mode == 1) {
          const val = u.posToVal(u.cursor.left, "x");
          legendTimeValueElement.textContent = u.scales.x.time
            ? fmtDate(new Date(val * 1e3))
            : val.toFixed(2);
        }
      },
    },
    opts: (u: uPlot, opts: uPlot.Options) => {
      uPlot.assign(opts, {
        cursor: {
          y: false,
          dataIdx: (u: uPlot, seriesIdx: number, closestIdx: number) => {
            if (seriesIdx == 0) return closestIdx;

            const cx = round(u.cursor.left * pxRatio);

            if (cx >= 0) {
              const cy = yMidpoints[seriesIdx - 1];
              hoveredStates[seriesIdx - 1] = null;

              quadtree?.get(cx, cy, 1, 1, (o) => {
                if (pointWithin(cx, cy, o.x, o.y, o.x + o.w, o.y + o.h))
                  hoveredStates[seriesIdx - 1] = o;
              });
            }

            return hoveredStates[seriesIdx - 1]?.didx;
          },
          points: {
            fill: "rgba(0,0,0,0.3)",
            show: false,
            bbox: (u: uPlot, seriesIdx: number) => {
              const hoverRect = hoveredStates[seriesIdx - 1];

              return {
                left: hoverRect ? round(hoverRect.x / pxRatio) : -10,
                top: hoverRect ? round(hoverRect.y / pxRatio) : -10,
                width: hoverRect ? round(hoverRect.w / pxRatio) : 0,
                height: hoverRect ? round(hoverRect.h / pxRatio) : 0,
              };
            },
            size: 0,
            width: 0,
            stroke: "transparent",
            scale: 1,
          },
        },
        scales: {
          x: {
            range(u, min, max) {
              if (mode == 2) {
                const colWid = u.data[0][1] - u.data[0][0];
                const scalePad = colWid / 2;

                if (min <= u.data[0][0]) min = u.data[0][0] - scalePad;

                const lastIdx = u.data[0].length - 1;

                if (max >= u.data[0][lastIdx])
                  max = u.data[0][lastIdx] + scalePad;
              }

              return [min, max];
            },
          },
          y: {
            range: [0, 1],
          },
        },
      });

      uPlot.assign(opts.axes[0], {
        splits:
          mode == 2
            ? (u, axisIdx, scaleMin, scaleMax, foundIncr, foundSpace) => {
                const splits = [];

                const dataIncr = u.data[0][1] - u.data[0][0];
                const skipFactor = ceil(foundIncr / dataIncr);

                for (let i = 0; i < u.data[0].length; i += skipFactor) {
                  const v = u.data[0][i];

                  if (v >= scaleMin && v <= scaleMax) splits.push(v);
                }

                return splits;
              }
            : null,
        grid: {
          show: mode != 2,
        },
      });

      uPlot.assign(opts.axes[1], {
        splits: (u, axisIdx) => {
          walk(null, count, u.bbox.height, (iy, y0, hgt) => {
            // vertical midpoints of each series' timeline (stored relative to .u-over)
            yMidpoints[iy] = round(y0 + hgt / 2);
            ySplitPoints[iy] = u.posToVal(yMidpoints[iy] / pxRatio, "y");
          });

          return ySplitPoints;
        },
        values: () => {
          return Array(count)
            .fill(null)
            .map((v, i) => u.series[i + 1].label);
        },
        gap: 15,
        size: 70,
        grid: { show: false },
        ticks: { show: false },

        side: 3,
      });

      opts.series.forEach((s, i) => {
        if (i > 0) {
          uPlot.assign(s, {
            //	width: 0,
            //	pxAlign: false,
            //	stroke: "rgba(255,0,0,0.5)",
            paths: drawPaths,
            points: {
              show: drawPoints,
            },
          });
        }
      });
    },
  };
}
