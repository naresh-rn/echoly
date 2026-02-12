# 1. Use Node.js base image
FROM node:20-slim

# 2. Install system dependencies (ffmpeg and python3 for yt-dlp)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 3. Set the working directory
WORKDIR /app

# 4. Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# 5. Copy the rest of your server code
COPY . .

# 6. Set the Port to 5000
ENV PORT=5000
EXPOSE 5000

# 7. Start the application
CMD ["node", "index.js"]