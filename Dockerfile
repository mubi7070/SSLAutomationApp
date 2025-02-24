#Base Image

FROM node:18-alpine

# Install Java (for keytool)
RUN apk add --no-cache openjdk17
RUN apk add --no-cache openssl

# Set JAVA_HOME for OpenJDK 17
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Working Dir

WORKDIR /app

# Copy the dependencies files
COPY package.json package-lock.json ./

# Install the dependencies
RUN npm install

# Copy Stuff Files

COPY . .

#Install Dependencies
RUN npm run build

# Environment variables

ENV CERTS_DIR=./Certs
ENV FILES_DIR=./Files

# Make sure that the folders exists
RUN mkdir -p ${CERTS_DIR} ${FILES_DIR}

#Running Port
EXPOSE 3000

#Command to Run
CMD ["npm","run","start"]
