FROM node:24-slim

# System dependencies:
#   python3, make, g++  — node-pty native compilation
#   curl, ca-certificates — opencode install
#   git — opencode runtime (version control operations)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ curl ca-certificates git \
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

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

WORKDIR /app

# Copy pre-built production dist from local
COPY dist ./

# Install production Node dependencies (uses BuildKit cache mount for pnpm store)
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod

# Entrypoint supports optional migration on startup
COPY devops/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/api/server.js"]
