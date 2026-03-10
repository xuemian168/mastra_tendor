FROM node:22-slim

WORKDIR /app

# Install dependencies first (cache layer)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

EXPOSE 4111

CMD ["npx", "mastra", "dev"]
