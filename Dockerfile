FROM node:18-alpine
LABEL maintainer=HouKunLin
ENV TZ Asia/Shanghai
WORKDIR /app
COPY ./dist/main.js ./
ENTRYPOINT ["node", "main.js"]
EXPOSE 80
