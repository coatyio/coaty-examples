/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

// Environment configuration for hosting on GitHub Pages with public HiveMQ MQTT
// broker.
export const environment = {
    production: true,

    // Connect to the public HiveMQ MQTT broker.
    brokerUrl: "mqtts://foo:bar@broker.hivemq.com:8000",
};
