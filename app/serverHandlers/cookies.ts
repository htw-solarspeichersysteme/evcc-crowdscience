import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { z } from "zod";

export const fetchCookie = createServerFn()
  .validator(z.string())
  .handler(({ data }) => getCookie(data));
