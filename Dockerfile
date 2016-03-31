FROM nodesource/jessie:5.0.0

WORKDIR /
ADD ./ /herggubot
WORKDIR /herggubot/
RUN npm install

EXPOSE 9090

CMD ["node", "startHerggubot.js"]

