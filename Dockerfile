# syntax=docker/dockerfile:1

# Base stage to define the working directory
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies (including dev) for building the TypeScript project
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build stage compiles the TypeScript sources to JavaScript in dist/
FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

# Production image with only runtime dependencies
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled application
COPY --from=build /app/dist ./dist

# Ensure non-root execution and allow log file writes
RUN addgroup -g 1001 appgroup \
  && adduser -D -G appgroup -u 1001 appuser \
  && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000
CMD ["node", "dist/index.js"]
