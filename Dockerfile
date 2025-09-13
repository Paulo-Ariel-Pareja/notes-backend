# Multi-stage build for production optimization
FROM node:22-alpine3.21 AS builder

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set Yarn global directory and add it to PATH
ENV PATH="${PATH}:$(yarn global bin)"

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies and NestJS CLI
RUN yarn global add @nestjs/cli && \
    yarn install && \
    yarn cache clean

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage
FROM node:22-alpine3.21 AS production

# Create app directory
WORKDIR /app

# Install wget for healthcheck and create non-root user
RUN apk add --no-cache wget && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install only production dependencies
RUN yarn install --production --ignore-engines && yarn cache clean

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy any additional files needed at runtime
COPY --from=builder /app/node_modules ./node_modules

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "dist/main"]