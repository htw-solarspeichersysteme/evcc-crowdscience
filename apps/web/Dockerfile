# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:slim AS base
WORKDIR /usr/src/app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y curl

# install dependencies in builder stage
# this will cache them and speed up future builds
FROM base AS builder
COPY package.json ./
RUN bun install --frozen-lockfile
COPY . ./
RUN bun run build
RUN bun run build-migration-script

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=builder /usr/src/app/.output ./
COPY --from=builder /usr/src/app/drizzle ./drizzle

# run the app
USER bun
ENTRYPOINT [ "bun", "run", "server/index.mjs" ]