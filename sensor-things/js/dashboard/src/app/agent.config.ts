/*! Copyright (c) 2018 Siemens AG. Licensed under the MIT License. */

import { Components, Configuration } from "@coaty/core";
import { SensorObserverController, ThingObserverController } from "@coaty/core/sensor-things";

import { agentInfo } from "./agent.info";
import { environment } from "./../environments/environment";
import { SensorThingsController } from "./controller/sensor-things-controller";

export const components: Components = {
    controllers: {
        SensorThingsController,
        SensorObserverController,
        ThingObserverController
    }
};

export const configuration: Configuration = {
    common: {
        agentInfo,
        agentIdentity: { name: "Dashboard" },
    },
    communication: {
        // Retrieve broker url from active Angular environment configuration.
        brokerUrl: environment.brokerUrl,
        namespace: "coaty.examples.sensorthings",
        shouldAutoStart: false,
    }
};
