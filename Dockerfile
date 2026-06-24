# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json from the backend directory
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Install compilers and runtimes for the supported languages
RUN apk add --no-cache python3 g++ openjdk11

# Copy the rest of the backend source code
COPY backend/ .

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "app.js"]
