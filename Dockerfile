# Base Image (Updated to Debian 12 'Bookworm' for better repository stability)
FROM node:18-bookworm

# Clean cache, fix network pipelining issues, and install dependencies
RUN apt-get clean && rm -rf /var/lib/apt/lists/* && \
    apt-get update -o Acquire::http::Pipeline-Depth=0 -o Acquire::http::No-Cache=true --fix-missing && \
    apt-get install -y openjdk-17-jdk openssl tar && \
    rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME for OpenJDK 17
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Copy and Install RAR (Offline)
COPY utils/rarlinux-x64-621.tar.gz /tmp/

RUN cd /tmp && \
    tar -xzf rarlinux-x64-621.tar.gz && \
    cd rar && \
    chmod +x rar unrar && \
    mv rar unrar /usr/local/bin/ && \
    cd / && rm -rf /tmp/rar /tmp/rarlinux-x64-621.tar.gz

# Working Dir
WORKDIR /app

# Copy the dependencies files
COPY package.json package-lock.json ./

# Install the dependencies
RUN npm install

# Copy Stuff Files
COPY . .

# Install Dependencies
RUN npm run build

# Environment variables
ENV CERTS_DIR=./Certs
ENV FILES_DIR=./Files

# Make sure that the folders exists
RUN mkdir -p ${CERTS_DIR} ${FILES_DIR}

# Running Port
EXPOSE 3000

# Command to Run
CMD ["npm","run","start"]