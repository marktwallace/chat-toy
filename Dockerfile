# Use the official Node.js image as a base image
FROM node:20

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the server files into the container
COPY server .

# Expose the port that your application will run on
EXPOSE 6784

# Command to run your server
CMD ["node", "server.js"]
