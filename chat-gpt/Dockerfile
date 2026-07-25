FROM node:20-alpine AS client-builder

WORKDIR /app/client

COPY client/package*.json ./

RUN npm ci

COPY client/ ./

RUN npm run build

FROM node:20-alpine AS server-production

WORKDIR /app/server

ENV NODE_ENV=production

COPY server/package*.json ./

RUN npm ci --omit=dev

COPY server/ ./

COPY --from=client-builder /app/client/dist ./public

EXPOSE 5000

CMD ["npm", "run", "start"]
