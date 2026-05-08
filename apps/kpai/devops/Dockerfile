FROM node:24-slim

LABEL com.docker.compose.project="techseeding"

# System dependencies:
#   python3, make, g++  — node-pty native compilation
#   curl, ca-certificates — nono release download
#   git — opencode runtime (version control operations)
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ curl ca-certificates git libdbus-1-3 ncurses-term

# Enable pnpm (version is pinned via the "packageManager" field in package.json)
RUN corepack enable

# Install opencode CLI globally via pnpm, locked to a known-good version.
# No store cache mount here: pnpm hard-links global package files from the
# store, and a cache mount would discard those files after the layer is built.
ENV PNPM_HOME="/root/.local/share/pnpm" \
    PATH="/root/.local/share/pnpm/bin:/root/.local/share/pnpm:${PATH}"
RUN pnpm add -g opencode-ai@1.14.41

# Install nono (kernel-enforced sandbox for AI agent processes)
RUN NONO_VERSION=$(curl -sI https://github.com/always-further/nono/releases/latest | grep -i location | grep -oP 'v\K[0-9.]+') && \
    ARCH=$(dpkg --print-architecture) && \
    curl -fsSL -o /tmp/nono.deb "https://github.com/always-further/nono/releases/download/v${NONO_VERSION}/nono-cli_${NONO_VERSION}_${ARCH}.deb" && \
    dpkg -i /tmp/nono.deb && \
    rm /tmp/nono.deb

# Pre-create XDG directories for opencode (nono sandbox blocks mkdir on parent paths)
RUN mkdir -p /root/.local/share/opencode /root/.local/share/opentui \
    /root/.config/opencode /root/.cache/opencode /root/.local/state/opencode

# Copy opencode user-level config (model, permissions, TUI settings)
COPY devops/opencode-config/ /root/.config/opencode/

ENV NODE_ENV=production

WORKDIR /app

# Install production Node dependencies first so source-only changes don't bust
# this layer (node-pty native compilation is the slowest step in the build).
# Corepack reads "packageManager" from package.json and activates that exact pnpm version.
COPY dist/package.json dist/pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod

# Copy the rest of the pre-built production dist
COPY dist ./

# Entrypoint supports optional migration on startup
COPY --chmod=755 devops/docker-entrypoint.sh /usr/local/bin/

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/api/server.js"]
