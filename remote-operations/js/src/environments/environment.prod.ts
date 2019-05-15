/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

// Environment configuration for a production build.
export const environment = {
    production: true,

    // The broker URL of your production broker must be configured BEFORE
    // building the app with "npm run build:prod". 
    brokerUrl: "mqtt://localhost:9883",
};
