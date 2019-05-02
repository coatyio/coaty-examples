/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { Injectable } from "@angular/core";
import { Location } from '@angular/common';
import { HttpClient } from "@angular/common/http";
import { catchError, map } from "rxjs/operators";

import { Components, Configuration, Container, mergeConfigurations } from "coaty/runtime";

import { agentInfo } from "./agent.info";

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
    resolveContainer(controllerName: string, controllerType: any) {
        const controllers = {};
        controllers[controllerName] = controllerType;
        const components: Components = {
            controllers,
        };
        const defaultConfiguration: Configuration = {
            common: { agentInfo },
            communication: {
                shouldAutoStart: true,
            },
        };

        return this.getAgentConfig()
            .pipe(
                catchError(error => {
                    console.error("Could not retrieve agent.config.json from host: ", error);
                    throw new Error(error.toString());
                }),
                map(config => {
                    const configuration = mergeConfigurations(config as Configuration, defaultConfiguration);
                    return Container.resolve(components, configuration);
                })
            ).toPromise();
    }

    /**
     * Retrieveds the agent container configuration for the hosting server.
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
