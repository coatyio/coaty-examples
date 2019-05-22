/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { BehaviorSubject, merge, Observable, Subject, Subscription } from 'rxjs';
import { filter, map } from "rxjs/operators";

import { CallEvent, DiscoverEvent, ReturnEvent } from 'coaty/com';
import { Controller } from "coaty/controller";
import { Component, ContextFilter, Uuid } from "coaty/model";

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
export class ControlController extends Controller {

    private _correlationIndex: number;
    private _eventLog: Array<EventLogEntry>;
    private _eventLogSubject: BehaviorSubject<Array<EventLogEntry>>;
    private _eventLog$: Observable<Array<EventLogEntry>>;
    private _activeAgentsInfoSubject: Subject<ActiveAgentsInfo>;
    private _activeAgentsInfo$: Observable<ActiveAgentsInfo>;
    private _activeAgentsInfoSubscription: Subscription;
    private _inactiveAgentsInfoSubscription: Subscription;
    private _activeAgents: { activeLights: Set<Uuid>, activeControls: Set<Uuid> };

    onInit() {
        super.onInit();

        this._eventLog = [];
        this._eventLogSubject = new BehaviorSubject<Array<EventLogEntry>>(this._eventLog);
        this._eventLog$ = this._eventLogSubject.asObservable();
        this._activeAgents = { activeLights: new Set<Uuid>(), activeControls: new Set<Uuid>() };
        this._activeAgentsInfoSubject = new Subject<ActiveAgentsInfo>();
        this._activeAgentsInfo$ = this._activeAgentsInfoSubject.asObservable();
    }

    onCommunicationManagerStarting() {
        // Observe and keep track of all light agents and light control agents
        // in the system (including myself).
        this._activeAgentsInfoSubscription = this.observeActiveAgents();
        this._inactiveAgentsInfoSubscription = this.observeInactiveAgents();
    }

    onCommunicationManagerStopping() {
        if (this._activeAgentsInfoSubscription) {
            this._activeAgentsInfoSubscription.unsubscribe();
        }
        if (this._inactiveAgentsInfoSubscription) {
            this._inactiveAgentsInfoSubscription.unsubscribe();
        }
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
            .subscribe(returnEvent => {
                this.addReturnToEventLog(returnEvent, correlationId);
            });
    }

    private observeActiveAgents() {
        const discoveredTasks = this.communicationManager
            // Note that this Discover event will also resolve the identity of
            // this agent's communication manager itself!
            .publishDiscover(DiscoverEvent.withCoreTypes(this.identity, ["Component"]))
            .pipe(
                map(event => event.eventData.object as Component),
            );

        const advertisedTasks = this.communicationManager
            .observeAdvertiseWithCoreType(this.identity, "Component")
            .pipe(
                map(event => event.eventData.object as Component),
            );

        return merge(discoveredTasks, advertisedTasks)
            .pipe(
                // Check if emitted discovered or advertised identity component
                // represents a light or light control agent.
                filter(comp => comp !== undefined && (comp.name === "LightAgent" || comp.name === "LightControlAgent"))
            )
            .subscribe(comp => {
                this._updateActiveAgentsInfo(comp.objectId, comp.name === "LightAgent", true);
            });
    }

    private observeInactiveAgents() {
        return this.communicationManager
            .observeDeadvertise(this.identity)
            .pipe(map(event => event.eventData.objectIds))
            .subscribe(objectIds => {
                // Check if object id relates to a light or control agent and
                // update active agents accordingly.
                objectIds.forEach(objectId => this._updateActiveAgentsInfo(objectId, undefined, false));
            });
    }

    private _updateActiveAgentsInfo(agentId: Uuid, isLightAgent: boolean, isActive: boolean) {
        if (isActive) {
            if (isLightAgent) {
                this._activeAgents.activeLights.add(agentId);
            } else {
                this._activeAgents.activeControls.add(agentId);
            }
        } else {
<<<<<<< HEAD
            console.log("Deadvertise event processed for agent id", agentId);
=======
>>>>>>> ef46b234e7f4a40c1cb7f053f3b5be7a5bfe654e
            this._activeAgents.activeLights.delete(agentId);
            this._activeAgents.activeControls.delete(agentId);
        }
        this._activeAgentsInfoSubject.next({
            activeLights: this._activeAgents.activeLights.size,
            activeControls: this._activeAgents.activeControls.size,
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
