/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { Components, Configuration, Container } from "@coaty/core";
import { NodeUtils } from "@coaty/core/runtime-node";

import { agentInfo } from "./agent.info";
import { FooController } from "./controller/foo-controller";

NodeUtils.logInfo(`BROKER_URL=${process.env.BROKER_URL}`);

if (!process.env.BROKER_URL) {
    NodeUtils.logError(new Error("Missing Broker URL"), "Environment variable BROKER_URL not specified.");
    process.exit(1);
}

const components: Components = {
    controllers: {
        FooController,
    },
};

const configuration: Configuration = {
    common: {
        agentInfo,
        agentIdentity: { name: "template agent" },
    },
    communication: {
        brokerUrl: process.env.BROKER_URL,
        shouldAutoStart: true,
    },
    controllers: {
        FooController: {
            // Options for FooController
        },
    },
};

// Bootstrap a Coaty container with the specified components and autostart its
// communication manager.
const container = Container.resolve(components, configuration);

NodeUtils.logCommunicationState(container);
