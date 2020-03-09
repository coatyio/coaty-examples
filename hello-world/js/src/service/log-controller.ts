/*! Copyright (c) 2018 Siemens AG. Licensed under the MIT License. */

import { filter } from "rxjs/operators";

import { AdvertiseEvent, Controller, Log, RetrieveEvent } from "@coaty/core";
import { DbContext } from "@coaty/core/db";

import { Db } from "../shared/db";
import { DatabaseChange, modelTypes } from "../shared/models";

/**
 * Observes advertised Log objects, stores them in the database and
 * advertises a corresponding DatabaseChange object.
 * Provides a query event interface exposing the saved log objects for 
 * analysis and visualization (see monitor component).
 */
export class LogController extends Controller {

    private _dbCtx: DbContext;

    onInit() {
        super.onInit();
        this._dbCtx = new DbContext(this.runtime.databaseOptions["db"]);
    }

    onCommunicationManagerStarting() {
        super.onCommunicationManagerStarting();
        this._observeQueryLog();
        this._observeAdvertiseLog();
    }

    private _observeAdvertiseLog() {
        return this.communicationManager
            .observeAdvertiseWithCoreType("Log")
            .subscribe(event => {
                const log = event.data.object as Log;
                this._dbCtx.insertObjects(Db.COLLECTION_LOG, log, true)
                    .then(() => this._advertiseDatabaseChange());
            });
    }

    private _observeQueryLog() {
        this.communicationManager
            .observeQuery()
            .pipe(
                filter(event => event.data.isCoreTypeCompatible("Log")),
            )
            .subscribe(event => {
                this._dbCtx
                    .findObjects<Log>(Db.COLLECTION_LOG, event.data.objectFilter)
                    .then(iterator => iterator.forBatch(batch => {
                        event.retrieve(RetrieveEvent.withObjects(batch));
                    }))
                    .catch(error => {
                        // In case of retrieval error, do not respond with a 
                        // Retrieve event. The sender of the query should 
                        // implement proper error handling by using a timeout 
                        // operator that triggers in case no response 
                        // is received after a certain period of time.
                    });
            });
    }

    private _advertiseDatabaseChange() {
        const change: DatabaseChange = {
            name: "Db log change",
            objectId: this.runtime.newUuid(),
            objectType: modelTypes.OBJECT_TYPE_DATABASE_CHANGE,
            coreType: "CoatyObject",
            hasLogChanged: true,
            hasTaskChanged: false,
        };
        this.communicationManager.publishAdvertise(AdvertiseEvent.withObject(change));
    }
}
