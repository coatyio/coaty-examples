/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { CoatyObject, Uuid } from "coaty/model";

/**
 * Defines a color tuple array with RGBA values.
 */
export interface ColorRgba extends Array<number> {
    1: number;  // Red 0..255
    2: number;  // Green 0..255
    3: number;  // Blue 0..255
    4: number;  // Alpha 0..1
}

export function isValidColorRgba(color: ColorRgba) {
    return Array.isArray(color) && color.length === 4 &&
        color[0] >= 0 && color[0] <= 255 &&
        color[1] >= 0 && color[1] <= 255 &&
        color[2] >= 0 && color[2] <= 255 &&
        color[3] >= 0 && color[3] <= 1;
}

/** Type literal of the object type of a Light. */
export type LightObjectTypeLiteral = "coaty.examples.remoteops.Light";

/** Object type constant of a Light. */
export const OBJECT_TYPE_LIGHT: LightObjectTypeLiteral = "coaty.examples.remoteops.Light";

/**
 * Models a lighting source which can change color and adjust luminosity as a
 * Coaty object type. The light source status is represented by a separate object type
 * `LightStatus`, which is associated with its light by the `parentObjectId`
 * relationship.
 */
export interface Light extends CoatyObject {
    coreType: "CoatyObject";
    objectType: LightObjectTypeLiteral;

    /** 
     * Determines whether the light is currently defect. The default value is
     * `false`.
     */
    isDefect: boolean;
}

/** Type literal of the object type of a LightStatus. */
export type LightStatusObjectTypeLiteral = "coaty.examples.remoteops.LightStatus";

/** * Object type constant of a LightStatus. */
export const OBJECT_TYPE_LIGHT_STATUS: LightStatusObjectTypeLiteral = "coaty.examples.remoteops.LightStatus";

/**
 * Models the current status of a light including on-off, color-change and
 * luminosity-adjust features as a Coaty object type. Its `parentObjectId`
 * property refers to the associated `Light` object.
 */
export interface LightStatus extends CoatyObject {
    coreType: "CoatyObject";
    objectType: LightStatusObjectTypeLiteral;

    /** 
     * Determines whether the light is currently switched on or off.
     */
    on: boolean;

    /** The current luminosity level of the light, a number between 0 (0%) and 1
     * (100%).
     */
    luminosity: number;

    /** 
     * The current color of the light as an rgba tuple.
     */
    color: ColorRgba;
}

/** Type literal of the object type of a LightContext. */
export type LightContextObjectTypeLiteral = "coaty.examples.remoteops.LightContext";

/** * Object type constant of a LightStatus. */
export const OBJECT_TYPE_LIGHT_CONTEXT: LightContextObjectTypeLiteral = "coaty.examples.remoteops.LightContext";

/**
 * A Coaty object type that represents the environmental context of a light. The
 * light context defines a building number, a floor number, and a room number
 * indicating where the light is physically located. To control an individual
 * light, the light's ID is also defined in the context.
 */
export interface LightContext extends CoatyObject {
    coreType: "CoatyObject";
    objectType: LightContextObjectTypeLiteral;

    // The object Id of the associated light.
    lightId: Uuid;

    // The number of the building in which this light is located.
    building: number;

    // The number of the floor on which the light is located.
    floor: number;

    // The number of the room on which the light is located.
    room: number;
}

/**
 * Defines the structure of the ranges of LightContext properties. To be used by
 * UI components for input validation and restriction.
 *
 * The concrete ranges are defined in 'assets/config/agent.config.json'.
 */
export interface LightContextRanges {
    building: { min: number, max: number, tickInterval: number };
    floor: { min: number, max: number, tickInterval: number };
    room: { min: number, max: number, tickInterval: number };
}

/**
 * Represents execution information returned with a remote light control
 * operation.
 */
export interface LightExecutionInfo {

    /** Object Id of the Light object that has been controlled. */
    lightId: Uuid;

    /** 
     * The timestamp in UTC milliseconds when the light control operation has
     * been triggered.
     */
    triggerTime: number;
}
