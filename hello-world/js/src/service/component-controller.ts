/*! Copyright (c) 2018 Siemens AG. Licensed under the MIT License. */

import { Subscription } from "rxjs";

import { ObjectLifecycleController } from "coaty/controller";
import { Component } from "coaty/model";

import { LogTags } from "../shared/log-tags";

/**
 * Tracks the distributed lifecycle of Hello World components (service, client,
 * monitor) by using a lifecycle management method provided by the
 * `ObjectLifecycleController`. Whenever the lifecycle state of a Component
 * object changes, it is advertised as a `Log` object.
 */
export class ComponentController extends ObjectLifecycleController {

    private _lifecycleSubscription: Subscription;

    onCommunicationManagerStarting() {
        super.onCommunicationManagerStarting();
        this._lifecycleSubscription = this.observeObjectLifecycleInfoByCoreType("Component")
            .subscribe(info => {
                // Called whenever tracked identity components have changed.
                if (info.added !== undefined) {
                    info.added.forEach(comp => this._onComponentRegistered(comp as Component));
                }
                if (info.changed !== undefined) {
                    info.changed.forEach(comp => this._onComponentRegistered(comp as Component, true));
                }
                if (info.removed !== undefined) {
                    info.removed.forEach(comp => this._onComponentDeregistered(comp as Component));
                }
            });
    }

    onCommunicationManagerStopping() {
        super.onCommunicationManagerStopping();
        this._lifecycleSubscription && this._lifecycleSubscription.unsubscribe();
    }

    private _onComponentRegistered(comp: Component, isReregistered = false) {
        const compId = comp.assigneeUserId ? `Client User ID ${comp.assigneeUserId}` : `ID ${comp.objectId}`;
        const parentId = comp.parentObjectId ? `, PARENT ID ${comp.parentObjectId}` : "";
        // tslint:disable-next-line: max-line-length
        this.logInfo(`Component ${isReregistered ? "reregistered" : "registered"}: ${comp.name}, ${compId}${parentId}`, LogTags.LOG_TAG_SERVICE);
    }

    private _onComponentDeregistered(comp: Component) {
        const compId = comp.assigneeUserId ? `Client User ID ${comp.assigneeUserId}` : `ID ${comp.objectId}`;
        const parentId = comp.parentObjectId ? `, PARENT ID ${comp.parentObjectId}` : "";
        this.logInfo(`Component deregistered: ${comp.name}, ${compId}${parentId}`, LogTags.LOG_TAG_SERVICE);
    }
}
