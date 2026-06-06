# Development stage
FROM node:20-alpine as development

WORKDIR /app

# Install build essentials
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY server/ ./server/
COPY shared/ ./shared/
COPY tsconfig.json ./

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Production build stage
FROM node:20-alpine as production-build

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --only=production

COPY server/ ./server/
COPY shared/ ./shared/
COPY tsconfig.json ./

# Compile TypeScript
RUN npm run typecheck:api || true

# Production stage
FROM node:20-alpine as production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy only necessary files from build stage
COPY --from=production-build /app/node_modules ./node_modules
COPY --from=production-build /app/server ./server
COPY --from=production-build /app/shared ./shared
COPY --from=production-build /app/tsconfig.json ./

# Create directories
RUN mkdir -p server/uploads/generated

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/sbin/dumb-init", "--"]

# Start the application
CMD ["node", "--loader", "tsx", "server/src/index.ts"]
