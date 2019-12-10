# Copyright (c) 2019 Siemens AG. Licensed under the MIT License.

#--------------------------------------------------
FROM    node:lts-alpine
#--------------------------------------------------

RUN     mkdir -p /usr/src/agent
WORKDIR /usr/src/agent

COPY    . .
RUN     npm install
RUN     npm run build
