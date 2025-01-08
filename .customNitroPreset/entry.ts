/**
 * This is a modified version of the default Nitro preset for Bun.
 * it can be removed, when this issue is fixed:
 * https://github.com/oven-sh/bun/issues/15320
 * original: node_modules/nitropack/dist/presets/bun/runtime/bun.mjs
 */
/* eslint-disable */
// @ts-nocheck

import "#nitro-internal-pollyfills";

import wsAdapter from "crossws/adapters/bun";
import { useNitroApp } from "nitropack/runtime";
import { startScheduleRunner } from "nitropack/runtime/internal";

const nitroApp = useNitroApp();
const ws = import.meta._websocket
  ? wsAdapter(nitroApp.h3App.websocket)
  : void 0;
const server = Bun.serve({
  port: process.env.NITRO_PORT || process.env.PORT || 3e3,
  websocket: import.meta._websocket ? ws.websocket : void 0,
  async fetch(req, server2) {
    if (import.meta._websocket && req.headers.get("upgrade") === "websocket") {
      return ws.handleUpgrade(req, server2);
    }
    const url = new URL(req.url);
    let body;
    if (req.body) {
      body = await req.arrayBuffer();
    }
    const res = await nitroApp.localFetch(url.pathname + url.search, {
      host: url.hostname,
      protocol: url.protocol,
      headers: req.headers,
      method: req.method,
      redirect: req.redirect,
      body,
    });

    if (res.status === 307) {
      return new globalThis.Response(null, {
        ok: res.ok,
        url: res.url,
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
        redirected: res.redirected,
        bodyUsed: res.bodyUsed,
      });
    }
    return res;
  },
});
console.log(`Listening on http://localhost:${server.port}...)`);
if (import.meta._tasks) {
  startScheduleRunner();
}
