# Multi-stage build for production
FROM node:24-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts and dependencies
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./
COPY --from=base /app/prisma ./prisma

# Expose API port
EXPOSE 3000

# Default command (can be overridden for worker)
CMD ["node", "dist/index.js"]
