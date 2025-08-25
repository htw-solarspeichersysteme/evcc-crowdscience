# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:alpine AS base
WORKDIR /usr/src/app

# install dependencies in builder stage
# this will cache them and speed up future builds
FROM base AS builder
COPY . ./
RUN bun install --frozen-lockfile
ENV NODE_ENV=production
RUN bun run build

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=builder /usr/src/app/dist ./

# run the app
USER bun
ENTRYPOINT [ "bun", "run", "index.js" ]