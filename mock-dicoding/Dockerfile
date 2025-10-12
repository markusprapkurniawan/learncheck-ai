# Mock Dicoding API Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose port 3001
EXPOSE 3001

# Start the mock API server
CMD ["npm", "start"]