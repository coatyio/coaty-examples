/*! Copyright (c) 2018 Siemens AG. Licensed under the MIT License. */

import { Components, Configuration, Container, CoreTypes, mergeConfigurations, Runtime, User } from "@coaty/core";
import { NodeUtils } from "@coaty/core/runtime-node";

import { serviceConfig } from "../shared/config";
import { Db } from "../shared/db";

import { AgentLifecycleController } from "./agent-lifecycle-controller";
import { agentInfo } from "./agent.info";
import { LogController } from "./log-controller";
import { TaskController } from "./task-controller";
import { TaskSnapshotController } from "./task-snapshot-controller";

const components: Components = {
    controllers: {
        AgentLifecycleController,
        LogController,
        TaskController,
        TaskSnapshotController,     // Extends HistorianController with logging side effects
    },
};

const configuration: Configuration = mergeConfigurations(
    serviceConfig(agentInfo, "Service"),
    {
        common: {
            extra: {
                // The service user that acts as creator for task requests.
                serviceUser: {
                    objectId: Runtime.newUuid(),
                    objectType: CoreTypes.OBJECT_TYPE_USER,
                    coreType: "User",
                    name: "Service User",
                    names: {
                        givenName: "",
                        familyName: "ServiceUser",
                    },
                } as User,
            },
        },
        controllers: {
            TaskController: {
                // Interval in milliseconds after which a new task request is generated
                requestGenerationInterval: 10000,
            },

            // Extends HistorianController with logging side effects
            TaskSnapshotController: {
                shouldAdvertiseSnapshots: false,
                shouldPersistLocalSnapshots: true,
                shouldPersistObservedSnapshots: false,
                shouldReplyToQueries: true,
                database: {
                    key: "db",
                    collection: "historian",
                },
            },
        },
    });


NodeUtils.handleProcessTermination();

// Register database adapters before resolving a Coaty container so that
// controllers can create database contexts on initialization.
Db.initDatabaseAdapters();

// First, initialize the database
Db.initDatabase(configuration.databases)
    .then(() => {
        // Then, create the Coaty container with the specified components and
        // autostart the communication manager.
        const container = Container.resolve(components, configuration);

        // Log broker connection state changes (online/offline) to the console.
        NodeUtils.logCommunicationState(container);
    })
    .catch(error => NodeUtils.logError(error, "Failed to initialize database."));

