# Stage 1: Base image
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

# Stage 2: API Server (No heavy compilers needed)
FROM base AS api
EXPOSE 3000
CMD ["node", "app.js"]

# Stage 3: Worker (Includes docker-cli to spawn sandboxed containers)
FROM base AS worker
RUN apk add --no-cache docker-cli
CMD ["npm", "run", "worker"]
