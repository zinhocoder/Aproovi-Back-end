# Etapa 1: build da aplicação
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 8080

CMD ["node", "server.js"]
