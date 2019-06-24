/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

// Environment configuration for hosting on GitHub Pages with public HiveMQ MQTT
// broker.
export const environment = {
    production: true,

    // Connect to a public MQTT broker over secure websocket.
    brokerUrl: "mqtts://test.mosquitto.org:8081",

};
