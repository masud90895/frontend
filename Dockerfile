# Docker image for build frontend as a service
FROM node:22

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"


# setup docker in docker
RUN apt-get -y update \
    && apt-get -y autoremove \
    && apt-get clean \
    && apt-get install -y curl \
    zip \
    unzip 

COPY . /app

RUN mkdir /app/dist

WORKDIR /app

RUN npm i --global pnpm@9.15.4
RUN pnpm install --config.fetch-timeout=100000

ENV MFOX_WORKING_DIR=/app
