FROM node:22-alpine

WORKDIR /data

RUN npm install -g json-server@0.17.4

COPY db.json .
COPY routes.json .

EXPOSE 3001

CMD ["json-server", "--watch", "db.json", "--routes", "routes.json", "--port", "3001", "--host", "0.0.0.0"]
