#Base Image

FROM node:18-bullseye

# Install Java, OpenSSL, wget, and rar
RUN sed -i '/deb http:\/\/deb.debian.org\/debian bullseye main/ s/$/ contrib non-free/' /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y openjdk-17-jdk openssl wget rar && \
    rm -rf /var/lib/apt/lists/*

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
