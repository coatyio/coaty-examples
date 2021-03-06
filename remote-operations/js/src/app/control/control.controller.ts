/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { CallEvent, ContextFilter, Uuid, ObjectLifecycleController, ReturnEvent } from "@coaty/core";

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
 * Maintains counts of currently active light and control agents in the system.
 */
export interface ActiveAgentsInfo {

    /** Number of active light agents. */
    activeLights: number;

    /** Number of active control agents. */
    activeControls: number;
}

/** 
 * A Coaty controller that invokes remote operations to control lights.
 */
export class ControlController extends ObjectLifecycleController {

    private _eventLog: Array<EventLogEntry>;
    private _eventLogSubject: BehaviorSubject<Array<EventLogEntry>>;
    private _eventLog$: Observable<Array<EventLogEntry>>;
    private _activeAgentsInfoSubject: Subject<ActiveAgentsInfo>;
    private _activeAgentsInfo$: Observable<ActiveAgentsInfo>;
    private _activeAgentsInfo: ActiveAgentsInfo;

    onInit() {
        super.onInit();

        this._eventLog = [];
        this._eventLogSubject = new BehaviorSubject<Array<EventLogEntry>>(this._eventLog);
        this._eventLog$ = this._eventLogSubject.asObservable();
        this._activeAgentsInfo = { activeLights: 0, activeControls: 0 };
        this._activeAgentsInfoSubject = new Subject<ActiveAgentsInfo>();
        this._activeAgentsInfo$ = this._activeAgentsInfoSubject.asObservable();
    }

    onCommunicationManagerStarting() {
        // Keep track of all light agents and light control agents in the system
        // (including my own light control agent). Note that the Coaty Swift app
        // integrates both a light agent and a control agent.
        this.observeObjectLifecycleInfoByCoreType(
            "Identity",
            comp => comp.name === "LightAgent" ||
                comp.name === "LightControlAgent" ||
                comp.name === "LightAgent & LightControlAgent")
            .subscribe(info => {
                if (info.added !== undefined) {
                    info.added.forEach(comp => this._updateActiveAgentsInfo(
                        comp.name.startsWith("LightAgent"),
                        comp.name.endsWith("LightControlAgent"),
                        true));
                }
                if (info.changed !== undefined) {
                    // Ignore agents with changed properties, since active agent
                    // count won't change.
                }
                if (info.removed !== undefined) {
                    info.removed.forEach(comp => this._updateActiveAgentsInfo(
                        comp.name.startsWith("LightAgent"),
                        comp.name.endsWith("LightControlAgent"),
                        false));
                }
            });
    }

    /**
     * Gets an observable on which event log changes are emitted by
     * this controller in response to light controlling remote operations.
     */
    get eventLog$() {
        return this._eventLog$;
    }

    /**
     * Gets an observable on which active agent info is being emitted whenever a
     * light agent or light control agent connects or disconnects.
     */
    get activeAgentsInfo$(): Observable<ActiveAgentsInfo> {
        return this._activeAgentsInfo$;
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
            this.runtime.commonOptions.extra.lightControlOperation,
            {
                on: onOff,
                color: rgba,
                luminosity,
                switchTime,
            },
            contextFilter);
        const correlationId = this.addCallToEventLog(callEvent);
        this.communicationManager.publishCall(callEvent)
            .subscribe(returnEvent => {
                this.addReturnToEventLog(returnEvent, correlationId);
            });
    }

    private _updateActiveAgentsInfo(isLightAgent: boolean, isControlAgent: boolean, isActive: boolean) {
        if (isActive) {
            if (isLightAgent) {
                this._activeAgentsInfo.activeLights++;
            }
            if (isControlAgent) {
                this._activeAgentsInfo.activeControls++;
            }
        } else {
            if (isLightAgent) {
                this._activeAgentsInfo.activeLights--;
            }
            if (isControlAgent) {
                this._activeAgentsInfo.activeControls--;
            }
        }
        this._activeAgentsInfoSubject.next({ ...this._activeAgentsInfo });
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
