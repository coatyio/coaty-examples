/*! Copyright (c) 2018 Siemens AG. Licensed under the MIT License. */

import { BehaviorSubject, Observable } from "rxjs";
import { filter, map, take, timeout } from "rxjs/operators";

import { Controller, filterOp, Log, LogLevel, ObjectFilter, QueryEvent } from "@coaty/core";

import { LogTags } from "../shared/log-tags";
import { DatabaseChange, modelTypes } from "../shared/models";

/**
 * Whenever a new Log object has been advertised query all log objects and
 * provide them to consumers.
 */
export class MonitorController extends Controller {

    private _logSubject: BehaviorSubject<Log[]>;

    onInit() {
        super.onInit();
        this._logSubject = new BehaviorSubject([]);
    }

    onCommunicationManagerStarting() {
        super.onCommunicationManagerStarting();
        this._observeAdvertiseLog();

        // Query log objects on startup
        this._queryLogs();
    }

    /**
     * Gets an observable that emits a new complete set of log entries
     * whenever new log data is available.
     */
    get log$(): Observable<Log[]> {
        return this._logSubject.asObservable();
    }

    private _observeAdvertiseLog() {
        this.communicationManager
            .observeAdvertiseWithObjectType(modelTypes.OBJECT_TYPE_DATABASE_CHANGE)
            .pipe(
                map(event => event.data.object as DatabaseChange),
                filter(dbChange => dbChange.hasLogChanged),
            )
            .subscribe(dbChange => this._queryLogs());
    }

    private _queryLogs() {
        // Query Log objects that have a log level greater than `Debug`. 
        // Return top 100 results ordered descendingly by log date, then ascendingly by log level.
        const objectFilter: ObjectFilter = {
            conditions: ["logLevel", filterOp.greaterThan(LogLevel.Debug)],
            take: 100,
            orderByProperties: [["logDate", "Desc"], ["logLevel", "Asc"]],
        };

        this.communicationManager
            .publishQuery(QueryEvent.withCoreTypes(["Log"], objectFilter))
            .pipe(
                // Unsubscribe automatically after first response event arrives.
                take(1),
                // Issue an Rx.TimeoutError if queryTimeoutMillis elapses without any emitted event.
                timeout(this.options["queryTimeoutMillis"]),
            )
            .subscribe(
                event => {
                    this._logSubject.next(event.data.objects as Log[]);
                },
                error => {
                    // No response has been received within the given period of time.
                    this.logError(error, "Failed to query log objects", LogTags.LOG_TAG_MONITOR);
                });
    }

}
