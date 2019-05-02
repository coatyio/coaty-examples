/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { BehaviorSubject, Observable } from 'rxjs';

import { CallEvent, ReturnEvent } from 'coaty/com';
import { Controller } from "coaty/controller";
import { ContextFilter, Uuid } from "coaty/model";

import { ColorRgba } from '../shared/light.model';

/**
 * Represents a data structure that holds a Call event and its correlated Return
 * events together with event timestamps for logging purposes.
 */
export interface EventLogEntry {

    /** ID that correlates Return events with its associated Call event. */
    correlationId: Uuid;

    /** The Call event */
    callEvent: CallEvent;

    /** The timestamp the Call event was published. */
    callEventTime: number;

    /**
     * An array of Return events with associated received timestamps ordered
     * descendingly by timestamp.
     */
    returnEvents: Array<{ eventTime: number; event: ReturnEvent }>;
}

/** 
 * A Coaty controller that invokes remote operations to control lights.
 */
export class ControlController extends Controller {

    private _correlationIndex: number;
    private _eventLog: Array<EventLogEntry>;
    private _eventLogSubject: BehaviorSubject<Array<EventLogEntry>>;
    private _eventLog$: Observable<Array<EventLogEntry>>;

    onInit() {
        super.onInit();

        this._eventLog = [];
        this._eventLogSubject = new BehaviorSubject<Array<EventLogEntry>>(this._eventLog);
        this._eventLog$ = this._eventLogSubject.asObservable();
    }

    /**
     * Gets an observable on which event log changes are emitted by
     * this controller in response to light controlling remote operations.
     */
    get eventLog$() {
        return this._eventLog$;
    }

    /**
     * Clear all entries in the event log.
     */
    clearEventLog() {
        this._eventLog = [];
        this._eventLogSubject.next(this._eventLog);
    }

    switchLights(contextFilter: ContextFilter, onOff: boolean, luminosity: number, rgba: ColorRgba, switchTime: number) {
        const callEvent = CallEvent.with(
            this.identity,
            this.runtime.options.lightControlOperation,
            {
                on: onOff,
                color: rgba,
                luminosity: luminosity,
                switchTime: switchTime,
            },
            contextFilter);
        const correlationId = this.addCallToEventLog(callEvent);
        this.communicationManager.publishCall(callEvent)
            .subscribe(event => {
                this.addReturnToEventLog(event, correlationId);
            });
    }

    private addCallToEventLog(event: CallEvent) {
        const correlationId = this.runtime.newUuid();
        this._eventLog.unshift({
            correlationId,
            callEvent: event,
            callEventTime: Date.now(),
            returnEvents: [],
        });
        this._eventLogSubject.next(this._eventLog);
        return correlationId;
    }

    private addReturnToEventLog(event: ReturnEvent, correlationId: Uuid) {
        const entry = this._eventLog.find(e => e.correlationId === correlationId);
        if (!entry) {
            return;
        }
        entry.returnEvents.push({
            event,
            eventTime: Date.now(),
        });
        this._eventLogSubject.next(this._eventLog);
    }

}
