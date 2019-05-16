# Copyright (c) 2019 Siemens AG. Licensed under the MIT License. 

#--------------------------------------------------
FROM    node:lts-alpine as install-base
#--------------------------------------------------
#  install and build application

WORKDIR /opt/coaty-examples-remote-operations

COPY    . .

EXPOSE  1883 9883

RUN     rm -rf node_modules package-lock.json \ 
    &&  npm install

#--------------------------------------------------
FROM    node:lts-alpine as builder
#--------------------------------------------------

WORKDIR /opt/coaty-examples-remote-operations

COPY   --from=install-base /opt/coaty-examples-remote-operations/ .
RUN    npm run build:docker

#--------------------------------------------------
FROM   nginx:stable-alpine as webui-server
#--------------------------------------------------

COPY   --from=builder /opt/coaty-examples-remote-operations/dist /usr/share/nginx/html

EXPOSE 80

# Routed Angular apps must fallback to index.html
RUN    sed -i '/location \/ {/a\        try_files $uri $uri\/ \/index.html;' /etc/nginx/conf.d/default.conf