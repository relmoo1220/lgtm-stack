# ====================
# Builder Stage
# ====================
FROM node:20-alpine AS builder

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build the app
RUN npm run build

# ====================
# Runner Stage
# ====================
FROM node:20-alpine AS runner

# Set environment variables
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# If you have other assets, copy them too
# COPY --from=builder /app/assets ./assets

# Expose the port NestJS runs on (default: 3000)
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
