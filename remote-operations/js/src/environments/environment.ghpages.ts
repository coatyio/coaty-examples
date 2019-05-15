/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

// Environment configuration for hosting on GitHub Pages with public HiveMQ MQTT
// broker.
export const environment = {
    production: true,

    // Connect to a public MQTT broker over secure websocket.
<<<<<<< HEAD
    brokerUrl: "wss://iot.eclipse.org:443/ws",
=======
    brokerUrl: "mqtts://test.mosquitto.org:8081",
>>>>>>> 8410e94be86c2545b83019e4e9747ec074081a93
};
