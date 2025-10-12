# LLM Service Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose port 3002
EXPOSE 3002

# Start the LLM service
CMD ["npm", "start"]