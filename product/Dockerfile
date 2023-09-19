FROM --platform=linux/amd64 node:19-slim 
WORKDIR /usr/src/app
COPY ./src/* ./
RUN npm install
EXPOSE 80
CMD [ "node", "app.js" ]
