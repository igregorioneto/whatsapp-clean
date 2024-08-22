# Use a Node.js base image
FROM node:20
# Create app directory
WORKDIR /app

# Copy app source code
COPY . .

COPY app.conf .

ARG PROXY_USER
ARG PROXY_PASSWORD
ARG PROXY_HOSTPORT
RUN export http_proxy=http://${PROXY_USER}:${PROXY_PASSWORD}@${PROXY_HOSTPORT}/
RUN export https_proxy=http://${PROXY_USER}:${PROXY_PASSWORD}@${PROXY_HOSTPORT}/
RUN export https_proxy=http://gregorio.neto:p-g2gBst@proxy.sumetecnologia.com.br:3128/
RUN export http_proxy=http://gregorio.neto:p-g2gBst@proxy.sumetecnologia.com.br:3128/

# Install app dependencies
COPY package*.json ./
RUN npm install

# Expose the port the app runs on
EXPOSE 5042

# Define environment variable
ENV PORT=5042

# Command to run the app
CMD [ "npm", "run", "start" ]
