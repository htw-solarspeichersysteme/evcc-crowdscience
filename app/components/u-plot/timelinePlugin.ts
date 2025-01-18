import uPlot from "uplot";

import { Quadtree } from "./quadtree";

function pointWithin(px, py, rlft, rtop, rrgt, rbtm) {
  return px >= rlft && px <= rrgt && py >= rtop && py <= rbtm;
}
const { round, min, max, ceil } = Math;
function roundDec(val, dec) {
  return Math.round(val * (dec = 10 ** dec)) / dec;
}

const SPACE_BETWEEN = 1;
const SPACE_AROUND = 2;
const SPACE_EVENLY = 3;

const coord = (i, offs, iwid, gap) => roundDec(offs + i * (iwid + gap), 6);

function distr(numItems, sizeFactor, justify, onlyIdx, each) {
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

export function timelinePlugin(opts) {
  const { mode, count, fill, stroke } = opts;

  const pxRatio = typeof window !== "undefined" ? window.devicePixelRatio : 1;

  const laneWidth = 0.9;
  const laneDistr = SPACE_BETWEEN;

  const font = round(14 * pxRatio) + "px Arial";

  function walk(yIdx, count, dim, draw) {
    distr(count, laneWidth, laneDistr, yIdx, (i, offPct, dimPct) => {
      const laneOffPx = dim * offPct;
      const laneWidPx = dim * dimPct;

      draw(i, laneOffPx, laneWidPx);
    });
  }

  const size = opts.size ?? [0.6, Infinity];
  const align = opts.align ?? 0;

  const gapFactor = 1 - size[0];
  const maxWidth = (size[1] ?? inf) * pxRatio;

  const fillPaths = new Map();
  const strokePaths = new Map();

  function drawBoxes(ctx) {
    fillPaths.forEach((fillPath, fillStyle) => {
      ctx.fillStyle = fillStyle;
      ctx.fill(fillPath);
    });

    strokePaths.forEach((strokePath, strokeStyle) => {
      ctx.strokeStyle = strokeStyle;
      ctx.stroke(strokePath);
    });

    fillPaths.clear();
    strokePaths.clear();
  }

  function putBox(
    ctx,
    rect,
    xOff,
    yOff,
    lft,
    top,
    wid,
    hgt,
    strokeWidth,
    iy,
    ix,
    value,
  ) {
    const fillStyle = fill(iy + 1, ix, value);
    let fillPath = fillPaths.get(fillStyle);

    if (fillPath == null) fillPaths.set(fillStyle, (fillPath = new Path2D()));

    rect(fillPath, lft, top, wid, hgt);

    if (strokeWidth) {
      const strokeStyle = stroke(iy + 1, ix, value);
      let strokePath = strokePaths.get(strokeStyle);

      if (strokePath == null)
        strokePaths.set(strokeStyle, (strokePath = new Path2D()));

      rect(
        strokePath,
        lft + strokeWidth / 2,
        top + strokeWidth / 2,
        wid - strokeWidth,
        hgt - strokeWidth,
      );
    }

    qt.add({
      x: round(lft - xOff),
      y: round(top - yOff),
      w: wid,
      h: hgt,
      sidx: iy + 1,
      didx: ix,
    });
  }

  function drawPaths(u, sidx, idx0, idx1) {
    uPlot.orient(
      u,
      sidx,
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

        u.ctx.save();
        rect(u.ctx, u.bbox.left, u.bbox.top, u.bbox.width, u.bbox.height);
        u.ctx.clip();

        walk(sidx - 1, count, yDim, (iy, y0, hgt) => {
          // draw spans
          if (mode == 1) {
            for (let ix = 0; ix < dataY.length; ix++) {
              if (dataY[ix] != null) {
                const lft = round(valToPosX(dataX[ix], scaleX, xDim, xOff));

                let nextIx = ix;
                while (
                  dataY[++nextIx] === undefined &&
                  nextIx < dataY.length
                ) {}

                // to now (not to end of chart)
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
                  dataY[ix],
                );

                ix = nextIx - 1;
              }
            }
          }
          // draw matrix
          else {
            const colWid =
              valToPosX(dataX[1], scaleX, xDim, xOff) -
              valToPosX(dataX[0], scaleX, xDim, xOff);
            const gapWid = colWid * gapFactor;
            const barWid = round(min(maxWidth, colWid - gapWid) - strokeWidth);
            const xShift = align == 1 ? 0 : align == -1 ? barWid : barWid / 2;

            for (let ix = idx0; ix <= idx1; ix++) {
              if (dataY[ix] != null) {
                // TODO: all xPos can be pre-computed once for all series in aligned set
                const lft = valToPosX(dataX[ix], scaleX, xDim, xOff);

                putBox(
                  u.ctx,
                  rect,
                  xOff,
                  yOff,
                  round(lft - xShift),
                  round(yOff + y0),
                  barWid,
                  round(hgt),
                  strokeWidth,
                  iy,
                  ix,
                  dataY[ix],
                );
              }
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

  function drawPoints(u, sidx, i0, i1) {
    u.ctx.save();
    u.ctx.rect(u.bbox.left, u.bbox.top, u.bbox.width, u.bbox.height);
    u.ctx.clip();

    u.ctx.font = font;
    u.ctx.fillStyle = "black";
    u.ctx.textAlign = mode == 1 ? "left" : "center";
    u.ctx.textBaseline = "middle";

    uPlot.orient(
      u,
      sidx,
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
        const textOffset = mode == 1 ? strokeWidth + 2 : 0;

        const y = round(yOff + yMids[sidx - 1]);

        // for (let ix = 0; ix < dataY.length; ix++) {
        //   if (dataY[ix] != null) {
        //     const x = valToPosX(dataX[ix], scaleX, xDim, xOff) + textOffset;
        //     u.ctx.fillText(dataY[ix], x, y);
        //   }
        // }
      },
    );

    u.ctx.restore();

    return false;
  }

  let qt;
  const hovered = Array(count).fill(null);

  const yMids = Array(count).fill(0);
  const ySplits = Array(count).fill(0);

  const fmtDate = uPlot.fmtDate("{YYYY}-{MM}-{DD} {HH}:{mm}:{ss}");
  let legendTimeValueEl = null;

  return {
    hooks: {
      init: (u) => {
        legendTimeValueEl = u.root.querySelector(
          ".u-series:first-child .u-value",
        );
      },
      drawClear: (u) => {
        qt = qt || new Quadtree(0, 0, u.bbox.width, u.bbox.height);

        qt.clear();

        // force-clear the path cache to cause drawBars() to rebuild new quadtree
        u.series.forEach((s) => {
          s._paths = null;
        });
      },
      setCursor: (u) => {
        if (mode == 1) {
          const val = u.posToVal(u.cursor.left, "x");
          legendTimeValueEl.textContent = u.scales.x.time
            ? fmtDate(new Date(val * 1e3))
            : val.toFixed(2);
        }
      },
    },
    opts: (u, opts) => {
      uPlot.assign(opts, {
        cursor: {
          // x: false,
          y: false,
          points: { show: false },
          dataIdx: (u, seriesIdx, closestIdx, xValue) => {
            if (seriesIdx == 0) return closestIdx;

            const cx = round(u.cursor.left * pxRatio);

            if (cx >= 0) {
              const cy = yMids[seriesIdx - 1];

              hovered[seriesIdx - 1] = null;

              qt.get(cx, cy, 1, 1, (o) => {
                if (pointWithin(cx, cy, o.x, o.y, o.x + o.w, o.y + o.h))
                  hovered[seriesIdx - 1] = o;
              });
            }

            return hovered[seriesIdx - 1]?.didx;
          },
          // points: {
          //   fill: "rgba(0,0,0,0.3)",
          //   bbox: (u, seriesIdx) => {
          //     const hRect = hovered[seriesIdx - 1];

          //     return {
          //       left: hRect ? round(hRect.x / devicePixelRatio) : -10,
          //       top: hRect ? round(hRect.y / devicePixelRatio) : -10,
          //       width: hRect ? round(hRect.w / devicePixelRatio) : 0,
          //       height: hRect ? round(hRect.h / devicePixelRatio) : 0,
          //     };
          //   },
          // },
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
            yMids[iy] = round(y0 + hgt / 2);
            ySplits[iy] = u.posToVal(yMids[iy] / pxRatio, "y");
          });

          return ySplits;
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
function makeChart(o, d) {
  const opts = {
    width: 1920,
    height: 300,
    title: o.title ?? "Timeline / Discrete",
    drawOrder: ["series", "axes"],
    scales: {
      x: {
        time: o.time ?? true,
      },
    },
    axes: [{}, {}],
    legend: {
      //	live: false,
      markers: {
        width: 0,
      },
    },
    padding: [null, 0, null, 0],
    series: [
      {
        label: "Time",
      },
      {
        label: "Device A",
        fill: "#33BB55",
        stroke: "darkgreen",
        width: 4,
        value: (u, v) => v,
      },
      {
        label: "Device B",
        fill: "#B56FAB",
        stroke: "purple",
        width: 4,
        value: (u, v) => v,
      },
      {
        label: "Device C",
        fill: "cyan",
        stroke: "#008080",
        width: 4,
        value: (u, v) => v,
      },
    ],
    plugins: [
      timelinePlugin({
        count: d.length - 1,
        ...o,
      }),
    ],
  };

  const u = new uPlot(opts, d, document.body);
}

const statesDisplay = [
  {},
  {
    0: { stroke: "red", fill: "rgba(255, 0, 0, 0.2)" },
    1: { stroke: "green", fill: "rgba(0, 255, 0, 0.2)" },
    2: { stroke: "blue", fill: "rgba(0, 0, 255, 0.2)" },
    3: { stroke: "cyan", fill: "rgba(0, 255, 255, 0.2)" },
  },
  {
    0: { stroke: "red", fill: "rgba(255, 0, 0, 0.2)" },
    4: { stroke: "orange", fill: "rgba(255, 165, 0, 0.4)" },
    5: { stroke: "yellow", fill: "rgba(255, 255, 0, 0.3)" },
  },
  {
    0: { stroke: "red", fill: "rgba(255, 0, 0, 0.2)" },
    4: { stroke: "orange", fill: "rgba(255, 165, 0, 0.4)" },
    5: { stroke: "yellow", fill: "rgba(255, 255, 0, 0.3)" },
  },
];
