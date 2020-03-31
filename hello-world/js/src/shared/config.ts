/*! Copyright (c) 2018 Siemens AG. Licensed under the MIT License. */

import { AgentInfo, Configuration } from "@coaty/core";
import { NodeUtils } from "@coaty/core/runtime-node";

import { Db } from "./db";

NodeUtils.logInfo(`BROKER_URL=${process.env.BROKER_URL}`);

if (!process.env.BROKER_URL) {
    NodeUtils.logError(new Error("Missing Broker URL"), "Environment variable BROKER_URL not specified.");
    process.exit(1);
}

/**
 * Gets common Configuration object for Hello World service and monitor
 * components.
 *
 * @param agentInfo the component's agent info
 */
export function serviceConfig(agentInfo: AgentInfo, agentName: string): Configuration {
    return {
        common: {
            agentInfo,
            agentIdentity: { name: agentName },
        },
        communication: {
            brokerUrl: process.env.BROKER_URL,
            namespace: "com.helloworld",
            shouldAutoStart: true,
        },
        databases: {
            db: {
                adapter: "PostgresAdapter",
                connectionString: Db.getConnectionString(),
            },
            admindb: {
                adapter: "PostgresAdapter",
                connectionString: Db.getAdminConnectionString(),
            },
        },
    };
}

/**
 * Gets a common Configuration object for Hello World clients.
 * 
 * @param agentInfo the client's agent info
 */
export function clientConfig(agentInfo: AgentInfo): Configuration {
    return {
        common: {
            agentInfo,
            agentIdentity: { name: "Client" },
        },
        communication: {
            brokerUrl: process.env.BROKER_URL,
            namespace: "com.helloworld",
            shouldAutoStart: true,
        },
    };
}
