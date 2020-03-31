/*! Copyright (c) 2018 Siemens AG. Licensed under the MIT License. */

import { Components, Configuration, Container } from "@coaty/core";
import { NodeUtils } from "@coaty/core/runtime-node";

import * as prompts from "prompts";
import { agentInfo } from "./agent.info";
import { SensorThingsController } from "./sensor-things-controller";

NodeUtils.logInfo(`BROKER_URL=${process.env.BROKER_URL}`);

if (!process.env.BROKER_URL) {
    NodeUtils.logError(new Error("Missing Broker URL"), "Environment variable BROKER_URL not specified.");
    process.exit(1);
}

prompts([
    {
        type: "text",
        name: "deviceName",
        message: "What is the name of your thing?",
        validate: input => input.length > 0,
    },
    {
        type: "text",
        name: "roomName",
        message: "In which room is your thing located?",
        validate: input => input.length > 0,
    },
    {
        type: "multiselect",
        name: "metrics",
        message: "Select sensor metrics you want to monitor",
        choices: [
            {
                title: "Load average",
                value: "load-average",
            },
            {
                title: "Free memory",
                value: "free-memory",
            },
            {
                title: "Uptime",
                value: "uptime",
            },
        ],
        min: 1,
    },
]).then(answers => {

    NodeUtils.handleProcessTermination();

    /**
     * Inline configuration to have an easier access to answers
     */
    const configuration: Configuration = {
        common: {
            agentInfo,
            agentIdentity: { name: `Sensor service ${answers.deviceName}` },
        },
        communication: {
            brokerUrl: process.env.BROKER_URL,
            namespace: "coaty.examples.sensorthings",
            shouldAutoStart: true,
        },
        controllers: {
            SensorThingsController: {
                answers: {
                    metrics: answers.metrics,
                    deviceName: answers.deviceName,
                    roomName: answers.roomName,
                },
                monitoringInterval: 5000, // send metrics every 5 seconds
            },
        },
    };
    const components: Components = {
        controllers: {
            SensorThingsController,
        },
    };

    // Create the Coaty container with the specified components and autostart
    // the communication manager.
    const container = Container.resolve(components, configuration);

    // Log broker connection state changes (online/offline) to the console.
    NodeUtils.logCommunicationState(container);
});


