#Base Image

FROM node:18-alpine

# Working Dir

WORKDIR /app

COPY package.json package-lock.json ./

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
