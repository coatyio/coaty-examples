/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

// Environment configuration for Docker hosting.
export const environment = {
    production: true,

    // DO NOT EDIT THIS PROPERTY.
    // This placeholder will be replaced by the specific broker url on
    // "docker-compose up" using the default value specified in
    // docker-compose.yml or the overridden value from BROKER_URL env variable.
    brokerUrl: "@BROKER_URL_PLACEHOLDER@",

    // DO NOT CHANGE THIS SETTING IN PRODUCTION MODE.
    acceptUnauthorizedServerCertificate: false,
};
