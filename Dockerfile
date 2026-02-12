# Use Node 18 as base
FROM node:18

# Install FFmpeg and Python (Required for your audio/video dependencies)
RUN apt-get update && apt-get install -y ffmpeg python3 python3-pip

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the port
EXPOSE 5000

# Start the server
CMD [ "node", "server/index.js"]