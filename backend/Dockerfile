FROM node:18-alpine
WORKDIR /app

# Instalar postgresql-client para pg_dump
RUN apk add --no-cache postgresql-client

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/src/main.js"]