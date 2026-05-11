FROM node:24-slim

LABEL com.docker.compose.project="techseeding"

# Enable pnpm (version is pinned via the "packageManager" field in package.json)
RUN corepack enable

ENV NODE_ENV=production

WORKDIR /app

# Install production Node dependencies first so source-only changes don't bust
# this layer. Corepack reads "packageManager" from package.json and activates
# that exact pnpm version.
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
