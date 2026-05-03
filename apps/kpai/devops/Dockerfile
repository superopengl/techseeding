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
