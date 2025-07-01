# Gebruik Node.js 22 (LTS)
FROM node:22

# Optioneel: update npm naar laatste versie
RUN npm install -g npm@latest

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
