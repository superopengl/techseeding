FROM node:24-slim

LABEL com.docker.compose.project="techseeding"

# System dependencies:
#   python3, make, g++  — node-pty native compilation
#   curl, ca-certificates — opencode install
#   git — opencode runtime (version control operations)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ curl ca-certificates git libdbus-1-3 ncurses-term \
    && rm -rf /var/lib/apt/lists/*

# Install opencode CLI
RUN curl -fsSL https://opencode.ai/install | bash
ENV PATH="/root/.opencode/bin:${PATH}"

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

# Enable pnpm (version is pinned via the "packageManager" field in package.json)
RUN corepack enable

WORKDIR /app

# Copy pre-built production dist from local
COPY dist ./

# Install production Node dependencies (uses BuildKit cache mount for pnpm store).
# Corepack reads "packageManager" from package.json and activates that exact pnpm version.
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod

# Entrypoint supports optional migration on startup
COPY devops/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/api/server.js"]
