/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

// Environment configuration for hosting on GitHub Pages with public HiveMQ MQTT
// broker.
export const environment = {
    production: true,

    // Connect to a public MQTT broker over secure websocket.
    brokerUrl: "wss://test.mosquitto.org:8081",

    // DO NOT USE THIS SETTING IN PRODUCTION MODE.
    //
    // It is only used to enable connection to the public mosquitto MQTT broker
    // over WebSocket with TLS which often provides an expired server
    // certificate.
    acceptUnauthorizedServerCertificate: true,
};
