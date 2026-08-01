# ------------------------------------------------------------------------------
# 1) Builder Stage: builds TypeScript
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

# Copy only the manifest files first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . ./

# Build the TypeScript project
RUN npm run build
RUN npm prune --omit=dev

# ------------------------------------------------------------------------------
# 2) Production Stage: runs the app
# ------------------------------------------------------------------------------
FROM node:22-alpine
WORKDIR /app

# Copy the build output from the builder
COPY --from=builder /app/out ./out
COPY --from=builder /app/public ./public

# Reuse the native modules compiled in the builder stage.
COPY --from=builder /app/node_modules ./node_modules

# Expose is optional - Cloud Run ignores it, but good for local usage
EXPOSE 8080

# Start command
CMD ["node", "--max-http-header-size=32768", "out/index.js"]
