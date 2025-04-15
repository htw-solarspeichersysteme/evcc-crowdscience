import { createServerFn } from "@tanstack/react-start";
import { zodValidator } from "@tanstack/zod-adapter";
import {
  getCookie as getCookieFromVinxi,
  getHeaders as getHeadersFromVinxi,
} from "vinxi/http";
import { z } from "zod";

export const getHeaders = createServerFn().handler(() => {
  return getHeadersFromVinxi();
});

export const getCookie = createServerFn()
  .validator(zodValidator(z.string()))
  .handler(({ data }) => {
    return getCookieFromVinxi(data);
  });
