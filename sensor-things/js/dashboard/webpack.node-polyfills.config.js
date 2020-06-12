module.exports = {
    // These options configure whether to polyfill or mock certain Node.js globals and modules.
    // This allows code originally written for the Node.js environment to run in other environments
    // like the browser.
    //
    // Starting with Angular CLI 6, webpack doesn't configure these shims for Node.js global variables 
    // any more by default. But some of these (process, global, Buffer, etc.) are required by 
    // dependency modules of bindings (e.g. MQTT.js for MQTT binding, autobahn-js for WAMP binding)
	// when run in the browser.
    node: {
        // For MQTT.js
        console: false,
        global: true,
        process: true,
        __filename: "mock",
        __dirname: "mock",
        Buffer: true,
        setImmediate: true,

        // For autobahn-js
        fs: "empty",

        // See "Other node core libraries" for additional options: https://v4.webpack.js.org/configuration/node/
    }
};