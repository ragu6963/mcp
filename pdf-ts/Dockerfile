FROM node:22-alpine AS builder

WORKDIR /app

COPY . /app

RUN --mount=type=cache,target=/root/.npm-production npm ci --ignore-scripts --omit-dev
RUN npm run build

FROM node:22-alpine AS release

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/resources ./resources

ENV NODE_ENV=production

RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts --omit=dev


ENTRYPOINT ["node", "dist/index.js"]