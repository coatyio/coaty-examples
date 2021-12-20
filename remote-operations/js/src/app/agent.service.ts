/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { Injectable } from "@angular/core";
import { Location } from '@angular/common';
import { HttpClient } from "@angular/common/http";
import { catchError, map } from "rxjs/operators";

import { Components, Configuration, Container, mergeConfigurations } from "@coaty/core";

import { agentInfo } from "./agent.info";
import { environment } from './../environments/environment';

/**
 * An app-wide service that provides a Coaty agent container for a specific
 * feature module, i.e. light or control module.
 */
@Injectable({
    providedIn: "root",
})
export class AgentService {

    constructor(private http: HttpClient, private location: Location) { }

    /**
     * Gets the Coaty agent container for the given module controller. Returns a
     * promise that resolves to the created container.
     *
     * @returns a promise resolving to a container for the given controller.
     */
    resolveContainer(agentName: string, controllerName: string, controllerType: any) {
        const controllers = {};
        controllers[controllerName] = controllerType;
        const components: Components = {
            controllers,
        };
        const defaultConfiguration: Configuration = {
            common: {
                agentInfo,
                agentIdentity: {
                    name: agentName,
                },
            },
            communication: {
                // Retrieve broker url from active Angular environment configuration.
                brokerUrl: environment.brokerUrl,
                namespace: "coaty.examples.remoteops",
                shouldAutoStart: true,
            },
        };

        console.log(`Running build configuration: ${defaultConfiguration.common.agentInfo.buildInfo.buildMode}`);

        return this.getAgentConfig()
            .pipe(
                catchError(error => {
                    console.error("Could not retrieve agent.config.json from host: ", error);
                    throw new Error(error.toString());
                }),
                map((config: Configuration) => {
                    if (environment.acceptUnauthorizedServerCertificate) {
                        config.communication.mqttClientOptions.rejectUnauthorized = false;
                    }
                    const configuration = mergeConfigurations(config, defaultConfiguration);
                    return Container.resolve(components, configuration);
                })
            ).toPromise();
    }

    /**
     * Retrieves the agent container configuration from the hosting server.
     *
     * @returns an observable that emits the configuration as a JSON object.
     */
    private getAgentConfig() {
        // Auto-prefix the resource URL path by base href to yield a host
        // specific external URL.
        const url = this.location.prepareExternalUrl(`/assets/config/agent.config.json`);
        return this.http.get(url);
    }
}
