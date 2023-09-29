FROM node:lts

WORKDIR /app/auth

COPY . .

RUN npm install
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]