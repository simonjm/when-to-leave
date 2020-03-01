FROM arm32v7/node:lts-alpine AS base
# FROM node:lts-alpine AS base

RUN apk update && apk upgrade

RUN mkdir /app
WORKDIR /app

COPY package-lock.json ./
COPY package.json ./

FROM base AS deps

RUN npm ci
RUN npm prune --production

FROM base AS final

COPY --from=deps /app/node_modules ./node_modules
COPY *.js ./

ENV NODE_ENV=production
ENV TZ=America/Chicago
EXPOSE 3000

CMD node ./index.js