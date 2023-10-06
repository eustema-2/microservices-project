FROM node:lts

RUN apt-get update && apt-get install -y libreoffice

WORKDIR /app/converter

COPY . .

RUN npm install

EXPOSE 3002

CMD ["npm", "run", "dev"]