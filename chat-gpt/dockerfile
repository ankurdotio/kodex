FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY ./client/package*.json  ./

RUN npm install

COPY ./client/ ./

RUN npm run build


FROM node:22-alpine AS backend-builder

WORKDIR /app

COPY ./server/package*.json  ./

RUN npm install

COPY ./server/ ./

RUN npm run build


FROM node:22-alpine

WORKDIR /app

COPY ./server/package*.json  ./

RUN npm install

COPY --from=backend-builder /app/dist ./

COPY --from=frontend-builder /app/dist ./public


CMD ["node", "server.js"]