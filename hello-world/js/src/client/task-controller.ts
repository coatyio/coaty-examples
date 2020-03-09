/*! Copyright (c) 2018 Siemens AG. Licensed under the MIT License. */

import { filter, map, take, timeout } from "rxjs/operators";

import { AdvertiseEvent, Controller, filterOp, ObjectFilter, QueryEvent, Snapshot, TaskStatus, UpdateEvent } from "@coaty/core";
import { NodeUtils } from "@coaty/core/runtime-node";

import { LogTags } from "../shared/log-tags";
import { HelloWorldTask, HelloWorldTaskUrgency, modelTypes } from "../shared/models";

/**
 * Listens for task requests advertised by the service and carries out assigned tasks.
 */
export class TaskController extends Controller {

    private _isBusy: boolean;

    onInit() {
        this._isBusy = false;
    }

    onCommunicationManagerStarting() {
        super.onCommunicationManagerStarting();
        this._observeAdvertiseRequests();

        console.log(`# Client User ID: ${this.runtime.commonOptions.extra.clientUser.objectId}`);
    }

    private _observeAdvertiseRequests() {
        this.communicationManager
            .observeAdvertiseWithObjectType(modelTypes.OBJECT_TYPE_HELLO_WORLD_TASK)
            .pipe(
                map(event => event.data.object as HelloWorldTask),
                filter(request => request.status === TaskStatus.Request),
            )
            .subscribe(request => this._handleRequest(request));
    }

    private _handleRequest(request: HelloWorldTask) {
        const urgency = HelloWorldTaskUrgency[request.urgency];

        // Do not accept further requests while a task is being offered or carried out.
        if (this._isBusy) {
            this._logConsole(`Request ignored while busy: ${request.name}  [Urgency: ${urgency}]`, "ADVERTISE", "In");
            return;
        }

        this._isBusy = true;
        this._logConsole(`Request considered: ${request.name}  [Urgency: ${urgency}]`, "ADVERTISE", "In");

        // Simulate a random delay before making an offer for the incoming request.
        setTimeout(() => {
            this._logConsole(`Make an offer for request: ${request.name}`, "UPDATE", "Out");

            // Offer to accomplish task immediately
            request.dueTimestamp = Date.now();
            request.assigneeObjectId = this.runtime.commonOptions.extra.clientUser.objectId;

            this.communicationManager.publishUpdate(UpdateEvent.withObject(request))
                .pipe(
                    // Unsubscribe automatically after first response event arrives.
                    take(1),
                    map(event => event.data.object as HelloWorldTask),
                )
                .subscribe(task => {
                    // Check whether my offered task has been accepted, then start to accomplish the task
                    if (task.assigneeObjectId === this.runtime.commonOptions.extra.clientUser.objectId) {
                        this._logConsole(`Offer accepted for request: ${task.name}`, "COMPLETE", "In");
                        this._accomplishTask(task);
                    } else {
                        this._isBusy = false;
                        this._logConsole(`Offer rejected for request: ${task.name}`, "COMPLETE", "In");
                    }
                });
        }, (Math.random() + 1) * this.options["minTaskOfferDelay"]);
    }

    private _accomplishTask(task: HelloWorldTask) {
        task.status = TaskStatus.InProgress;
        task.lastModificationTimestamp = Date.now();

        this._logConsole(`Carrying out task: ${task.name}`);

        // Notify other components that task is now in progress
        this.communicationManager.publishAdvertise(AdvertiseEvent.withObject(task));

        setTimeout(() => {
            task.status = TaskStatus.Done;
            task.lastModificationTimestamp = task.doneTimestamp = Date.now();

            this._logConsole(`Completed task: ${task.name}`, "ADVERTISE", "Out");

            // Notify other components that task has been completed
            this.communicationManager.publishAdvertise(AdvertiseEvent.withObject(task));

            // Query available Snapshot objects for the just finished task
            const objectFilter: ObjectFilter = {
                conditions: ["parentObjectId", filterOp.equals(task.objectId)],
                orderByProperties: [["creationTimestamp", "Desc"]],
            };

            // Note that the queried snapshots may or may not include the latest
            // task snapshot with task status "Done", because the task snaphot
            // of the completed task may or may not have been stored in the
            // database before the query is executed. A proper implementation
            // should use an Update-Complete event to advertise task status
            // changes and await the response before querying snapshots.
            NodeUtils.logEvent(`Snapshots by parentObjectId: ${task.name}`, "QUERY", "Out");
            this.communicationManager
                .publishQuery(QueryEvent.withCoreTypes(["Snapshot"], objectFilter))
                .pipe(
                    // Unsubscribe automatically after first response event arrives.
                    take(1),
                    // Issue an Rx.TimeoutError if queryTimeoutMillis elapses without any emitted event.
                    timeout(this.options["queryTimeoutMillis"]),
                )
                .subscribe(
                    event => {
                        NodeUtils.logEvent(`Snapshots by parentObjectId: ${task.name}`, "RETRIEVE", "In");
                        this._logHistorian(event.data.objects as Snapshot[]);
                    },
                    error => {
                        // No response has been received within the given period of time.
                        this.logError(error, "Failed to retrieve snapshot objects", LogTags.LOG_TAG_CLIENT);
                    });

            // Now further incoming task requests can be handled again
            this._isBusy = false;

        }, (Math.random() + 1) * this.options["minTaskDuration"]);
    }

    private _logConsole(message: string, eventName?: string, eventDirection: "In" | "Out" = "In") {
        let output = eventName ? (eventDirection === "In" ? "-> " : "<- ") : "   ";
        output += ((eventName || "") + " ".repeat(11 - (eventName ? eventName.length : 0)));
        output += "| " + message;
        console.log(output);
    }

    private _logHistorian(snapshots: Snapshot[]) {
        console.log("#############################");
        console.log(`# Snapshots retrieved ${snapshots.length}`);
        snapshots.forEach(snapshot => {
            console.log(`# timestamp: ${snapshot.creationTimestamp}  `
                + `assigneeObjectId: ${(<HelloWorldTask>snapshot.object).assigneeObjectId ?? "-" + " ".repeat(35)}  `
                + `status: ${TaskStatus[(<HelloWorldTask>snapshot.object).status]}`);
        });
        console.log("#############################");
        console.log("");
    }
}
