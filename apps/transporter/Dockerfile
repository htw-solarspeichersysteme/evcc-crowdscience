# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

COPY package.json ./
RUN bun install

COPY . ./

RUN chown -R bun:bun /usr/src/app

# run the app
USER bun
ENTRYPOINT [ "bun", "run", "index.ts" ]