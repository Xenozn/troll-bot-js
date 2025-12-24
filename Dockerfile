FROM node:lts-alpine3.23
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du projet
COPY . .

# Lancer le bot
CMD ["node", "index.js"]
