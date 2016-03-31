FROM nodesource/jessie:5.0.0

WORKDIR /
ADD ./ /herggubot
WORKDIR /herggubot/
RUN npm install

EXPOSE 3700

CMD ["node", "startHerggubot.js"]

