# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
# build context is the repo root, so the workspace lockfile can be used
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# install dependencies from the root lockfile. Every workspace package.json
# must be present for --frozen-lockfile to match.
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY apps/transporter/package.json ./apps/transporter/
RUN bun install --frozen-lockfile --filter ./apps/transporter

COPY . ./

RUN chown -R bun:bun /usr/src/app

WORKDIR /usr/src/app/apps/transporter

# run the app
USER bun
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://127.0.0.1:3000/healthcheck || exit 1
ENTRYPOINT [ "bun", "run", "index.ts" ]
