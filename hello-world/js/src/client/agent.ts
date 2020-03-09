/*! Copyright (c) 2018 Siemens AG. Licensed under the MIT License. */

import { Components, Configuration, Container, CoreTypes, mergeConfigurations, Runtime, User } from "@coaty/core";
import { NodeUtils } from "@coaty/core/runtime-node";

import { clientConfig } from "../shared/config";

import { agentInfo } from "./agent.info";
import { TaskController } from "./task-controller";

const components: Components = {
    controllers: {
        TaskController,
    },
};

const configuration: Configuration = mergeConfigurations(
    clientConfig(agentInfo),
    {
        common: {
            extra: {
                // Associate a distinct user with each client agent.
                clientUser: {
                    objectId: Runtime.newUuid(),
                    objectType: CoreTypes.OBJECT_TYPE_USER,
                    coreType: "User",
                    name: "Client User",
                    names: {
                        givenName: "",
                        familyName: "ClientUser",
                    },
                } as User,
            },
        },
        controllers: {
            TaskController: {

                // Minimum amount of time in milliseconds until an offer is sent
                minTaskOfferDelay: 2000,

                // Minimum amount of time in milliseconds until a task is completed
                minTaskDuration: 5000,

                queryTimeoutMillis: 5000,

            },
        },
    });

// First, create the Coaty container with the specified components.
const container = Container.resolve(components, configuration);

// Log broker connection state changes (online/offline) to the console.
NodeUtils.logCommunicationState(container);
