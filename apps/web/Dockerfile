# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
# build context is the repo root, so the workspace lockfile can be used
FROM oven/bun:slim AS base
WORKDIR /usr/src/app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y curl

# install dependencies from the root lockfile. Every workspace package.json
# must be present for --frozen-lockfile to match.
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY apps/transporter/package.json ./apps/transporter/
RUN bun install --frozen-lockfile
COPY . ./

WORKDIR /usr/src/app/apps/web

# Added ENV placeholder variables for build to prevent errors related to missing environment variables during the build process
RUN bun run build
RUN bun run build-migration-script

# run the app
ENTRYPOINT [ "bun", "run", "server.ts" ]
