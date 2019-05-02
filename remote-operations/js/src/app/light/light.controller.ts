/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { Controller } from "coaty/controller";
import { RemoteCallErrorCode, RemoteCallErrorMessage, ReturnEvent } from "coaty/com";
import { Observable, BehaviorSubject } from "rxjs";

import {
    ColorRgba,
    isValidColorRgba,
    Light,
    LightContext,
    LightStatus,
    OBJECT_TYPE_LIGHT,
    OBJECT_TYPE_LIGHT_STATUS,
    OBJECT_TYPE_LIGHT_CONTEXT
} from "../shared/light.model";
import { timestamp } from 'rxjs/operators';

/** 
 * A Coaty controller that manages a single light with its context and observes
 * Call requests for remote operations to change the light's status.
 *
 * For communicating light status changes to the associated Angular
 * `LightComponent`, and to receive responses, the controller provides an
 * observable and a confirmation callback method.
 */
export class LightController extends Controller {

    private _light: Light;
    private _lightContext: LightContext;
    private _lightStatus: LightStatus;
    private _lightColorChangeSubject: BehaviorSubject<string>;
    private _lightColorChange$: Observable<string>;

    onInit() {
        super.onInit();

        this._light = this.createLight();

        // Create initial context properties from controller configuration.
        this._lightContext = this.createLightContext(this.options.building, this.options.floor, this.options.room);

        // Create initial status properties from controller configuration.
        this._lightStatus = this.createLightStatus(this.options.lightOn, this.options.lightColor, this.options.lightLuminosity);

        // Set initial color on the subject for emission when observers subscribe to it.
        this._lightColorChangeSubject = new BehaviorSubject<string>(this.convertLightStatusToColor());
        this._lightColorChange$ = this._lightColorChangeSubject.asObservable();

        // Finally start observing remote call operations for light status control.
        this.observeCallEvents();
    }

    /** 
     * Gets the light object this controller is managing. The instance returned
     * is considered immutable, i.e. it will never change.
     */
    get light() {
        return this._light;
    }

    /** 
     * Gets the light context object this controller is managing. The instance
     * returned is always the same, however, its properties will be modified
     * in-place by the `LightComponent` view on user interaction.
     */
    get lightContext() {
        return this._lightContext;
    }

    /**
     * Gets an observable on which change requests in light color are emitted by
     * this controller in response to light controlling remote operations or to
     * set the color for the initial light status.
     */
    get lightColorChange$() {
        return this._lightColorChange$;
    }

    private observeCallEvents() {
        return this.communicationManager.observeCall(
            this.identity,
            this.runtime.options.lightControlOperation,
            this._lightContext)
            .subscribe(event => {
                const on = event.eventData.getParameterByName("on");
                const color = event.eventData.getParameterByName("color");
                const luminosity = event.eventData.getParameterByName("luminosity");
                const switchTime = event.eventData.getParameterByName("switchTime");

                // Respond with an InvalidParams error if parameter validation
                // failed.
                if (!this.validateSwitchOpParams(on, color, luminosity, switchTime)) {
                    event.returnEvent(ReturnEvent.withError(
                        this.identity,
                        RemoteCallErrorCode.InvalidParameters,
                        RemoteCallErrorMessage.InvalidParameters,
                        { lightId: this._light.objectId, triggerTime: Date.now() }));
                    return;
                }

                setTimeout(() => {
                    // Respond with a custom error if the light is currently defect.
                    if (this.light.isDefect) {
                        event.returnEvent(ReturnEvent.withError(
                            this.identity,
                            1,
                            "Light is defect",
                            { lightId: this._light.objectId, triggerTime: Date.now() }));
                        return;
                    }

                    this.updateLightStatus(on, color, luminosity);

                    // Emit a light color change to trigger update of the LightComponent view.
                    this._lightColorChangeSubject.next(this.convertLightStatusToColor());

                    // Respond with a result indicating whether the light is in
                    // state on or off.
                    event.returnEvent(ReturnEvent.withResult(
                        this.identity,
                        this._lightStatus.on,
                        { lightId: this._light.objectId, triggerTime: Date.now() }));
                }, Math.max(0, switchTime === undefined ? 0 : switchTime));
            });
    }

    private createLight(): Light {
        const objectId = this.runtime.newUuid();
        return {
            coreType: "CoatyObject",
            objectType: OBJECT_TYPE_LIGHT,
            objectId,
            name: `Light`,
            isDefect: false,
        };
    }

    private createLightStatus(on: boolean, color: ColorRgba, luminosity: number): LightStatus {
        return {
            coreType: "CoatyObject",
            objectType: OBJECT_TYPE_LIGHT_STATUS,
            objectId: this.runtime.newUuid(),
            name: `LightStatus`,

            // Reference to light object
            parentObjectId: this._light.objectId,

            on: on,
            luminosity,
            color,
        };

    }

    private createLightContext(building: number, floor: number, room: number): LightContext {
        return {
            coreType: "CoatyObject",
            objectType: OBJECT_TYPE_LIGHT_CONTEXT,
            objectId: this.runtime.newUuid(),
            name: `LightContext`,

            // Reference to light object
            parentObjectId: this._light.objectId,
            lightId: this._light.objectId,

            building,
            floor,
            room,
        };
    }

    private validateSwitchOpParams(on?: boolean, color?: ColorRgba, luminosity?: number, switchTime?: number) {
        // Validate operation parameters, return undefined if validation fails.
        if ((on === undefined || typeof on === "boolean") &&
            (luminosity === undefined || (typeof luminosity === "number" && luminosity >= 0 && luminosity <= 1)) &&
            (switchTime === undefined || (typeof switchTime === "number")) &&
            isValidColorRgba(color) &&
            // For testing purposes, yield an error if color is black.
            !(color[0] === 0 && color[1] === 0 && color[2] === 0)) {
            return true;
        }
        return false;
    }

    private updateLightStatus(on?: boolean, color?: ColorRgba, luminosity?: number) {
        const { on: currentOn, color: currentColor, luminosity: currentLuminosity } = this._lightStatus;
        if (on === undefined || on === currentOn) {
            if (color === undefined || color === currentColor) {
                if (luminosity === undefined || luminosity === currentLuminosity) {
                    // Nothing changed
                } else {
                    this._lightStatus = this.createLightStatus(currentOn, currentColor, luminosity);
                }
            } else {
                if (luminosity === undefined || luminosity === currentLuminosity) {
                    this._lightStatus = this.createLightStatus(currentOn, color, currentLuminosity);
                } else {
                    this._lightStatus = this.createLightStatus(currentOn, color, luminosity);
                }
            }
        } else {
            if (color === undefined || color === currentColor) {
                if (luminosity === undefined || luminosity === currentLuminosity) {
                    this._lightStatus = this.createLightStatus(on, currentColor, currentLuminosity);
                } else {
                    this._lightStatus = this.createLightStatus(on, currentColor, luminosity);
                }
            } else {
                if (luminosity === undefined || luminosity === currentLuminosity) {
                    this._lightStatus = this.createLightStatus(on, color, currentLuminosity);
                } else {
                    this._lightStatus = this.createLightStatus(on, color, luminosity);
                }
            }
        }
    }

    /**
     * Convert the current light status object to a CSS rgb/rgba color string.
     */
    private convertLightStatusToColor(): string {
        const { on, color, luminosity } = this._lightStatus;
        if (!on || luminosity === 0) {
            return "transparent";
        }
        return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${(luminosity * color[3]).toFixed(2)})`;
    }

}
