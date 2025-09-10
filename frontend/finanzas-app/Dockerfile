FROM node:18

RUN npm install -g pnpm

WORKDIR /app

COPY package*.json ./
RUN pnpm install

COPY . .

CMD ["pnpm", "start"]