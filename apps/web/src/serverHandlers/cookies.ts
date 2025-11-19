import { createServerFn } from "@tanstack/react-start";
import { getCookies } from "@tanstack/react-start/server";
import * as z from "zod";

export const fetchCookie = createServerFn()
  .inputValidator(z.string())
  .handler(({ data }) => {
    return getCookies()[data];
  });
