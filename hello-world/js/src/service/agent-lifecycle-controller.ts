/*! Copyright (c) 2018 Siemens AG. Licensed under the MIT License. */

import { Identity, ObjectLifecycleController } from "@coaty/core";

import { LogTags } from "../shared/log-tags";

/**
 * Tracks the distributed lifecycle of Hello World agents (service, client,
 * monitor) by using a lifecycle management method provided by the
 * `ObjectLifecycleController`. Whenever the lifecycle state of an agent
 * identity changes, a `Log` object describing the change is advertised.
 */
export class AgentLifecycleController extends ObjectLifecycleController {

    onCommunicationManagerStarting() {
        super.onCommunicationManagerStarting();
        this.observeObjectLifecycleInfoByCoreType("Identity")
            .subscribe(info => {
                // Called whenever tracked agent identities have changed,
                // including the one of this container itself.
                if (info.added !== undefined) {
                    info.added.forEach(ident => this._onIdentityRegistered(ident as Identity));
                }
                if (info.changed !== undefined) {
                    info.changed.forEach(ident => this._onIdentityRegistered(ident as Identity, true));
                }
                if (info.removed !== undefined) {
                    info.removed.forEach(ident => this._onIdentityDeregistered(ident as Identity));
                }
            });
    }

    private _onIdentityRegistered(ident: Identity, isReregistered = false) {
        // tslint:disable-next-line: max-line-length
        this.logInfo(`${ident.name} ${isReregistered ? "reregistered" : "registered"} with agent identity ID ${ident.objectId}`, LogTags.LOG_TAG_SERVICE);
    }

    private _onIdentityDeregistered(ident: Identity) {
        this.logInfo(`${ident.name} deregistered with agent identity ID ${ident.objectId}`, LogTags.LOG_TAG_SERVICE);
    }
}
