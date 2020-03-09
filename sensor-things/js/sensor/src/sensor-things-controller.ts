/*! Copyright (c) 2018 Siemens AG. Licensed under the MIT License. */

import { freemem, hostname, loadavg, type as osType, uptime } from "os";

import { AdvertiseEvent, CoatyObject, ResolveEvent, TimeInterval, Uuid } from "@coaty/core";
import { NodeUtils } from "@coaty/core/runtime-node";
import {
    EncodingTypes,
    FeatureOfInterest,
    MockSensorIo,
    Observation,
    ObservationTypes,
    Sensor,
    SensorContainer,
    SensorEncodingTypes,
    SensorSourceController,
    SensorThingsTypes,
    Thing,
    UnitOfMeasurement,
} from "@coaty/core/sensor-things";

/**
 * Handles registration and discovery of sensor objects.
 */
export class SensorThingsController extends SensorSourceController {

    private _thing: Thing;
    private _sensorsArray: Sensor[] = [];
    private _featureOfInterest: FeatureOfInterest;

    /** 
     * Store all sensor things objects of the system.
     * All objects are stored in only one array to simplify object retrieval by discover.
     * Observations should not be stored in dataStore because they are not relevant once they have been sent
     */
    private _dataStore = new Map<Uuid, CoatyObject>();

    onCommunicationManagerStarting() {
        super.onCommunicationManagerStarting();
        this._createObjects(this.options.answers);

        NodeUtils.logInfo(`${this._thing.name} ID: ${this._thing.objectId}`);

        this._observeDiscover();
    }

    protected createObservation(
        container: SensorContainer,
        value: any,
        resultQuality?: string[],
        validTime?: TimeInterval,
        parameters?: { [key: string]: any; }): Observation {
        return super.createObservation(
            container,
            this._getMetricResult(container.sensor.objectId),
            resultQuality,
            validTime,
            parameters,
            this._featureOfInterest.objectId);
    }

    /**
     * Subscribe to discover events and resolve it if the discovered id is in the datastore.
     * 
     * There are two types of discover events that are considered. Discover event with an
     * objectId (to find any sensor things object) and the discover event for Things (used
     * by ThingsController to find all the things in the system).
     */
    private _observeDiscover() {
        this.communicationManager.observeDiscover()
            .subscribe(event => {
                if (event.data.isDiscoveringObjectId) {
                    if (this._dataStore.has(event.data.objectId)) {
                        event.resolve(ResolveEvent.withObject(this._dataStore.get(event.data.objectId)));
                    }
                } else if (event.data.isObjectTypeCompatible(SensorThingsTypes.OBJECT_TYPE_THING)) {
                    event.resolve(ResolveEvent.withObject(this._thing));
                }
            });
    }

    /**
     * Creates a single Thing and FeatureOfInterest, and a Sensor for each metric. 
     */
    private _createObjects(answers: { metrics: string[], deviceName: string, roomName: string }) {
        this._sensorsArray = [];
        this._thing = {
            name: "Thing " + answers.deviceName,
            objectId: this.runtime.newUuid(),
            objectType: SensorThingsTypes.OBJECT_TYPE_THING,
            coreType: "CoatyObject",
            description: "A device you can monitor (os.name: " + hostname() + ")",
        };
        this._dataStore.set(this._thing.objectId, this._thing);
        this.communicationManager.publishAdvertise(AdvertiseEvent.withObject(this._thing));

        this._featureOfInterest = {
            name: "Feature of Interest " + answers.roomName,
            objectId: this.runtime.newUuid(),
            objectType: SensorThingsTypes.OBJECT_TYPE_FEATURE_OF_INTEREST,
            coreType: "CoatyObject",
            description: "The location of your device (more relevant for real sensors)",
            encodingType: EncodingTypes.UNDEFINED,
            metadata: "Room " + hostname(),
        };
        this._dataStore.set(this._featureOfInterest.objectId, this._featureOfInterest);

        for (const metric of answers.metrics) {
            const sensor: Sensor = {
                name: "Sensor " + metric,
                objectId: this.runtime.newUuid(),
                objectType: SensorThingsTypes.OBJECT_TYPE_SENSOR,
                coreType: "CoatyObject",
                description: `Sensor measuring ${metric}`,
                unitOfMeasurement: this._getUnitOfMeasurement(metric),
                observationType: ObservationTypes.TRUTH,
                observedProperty: {
                    name: metric,
                    description: "Observed Property " + metric,
                    definition: "https://www.google.com/?q=" + metric, // not a valid definition
                },
                parentObjectId: this._thing.objectId,
                encodingType: SensorEncodingTypes.UNDEFINED,
                metadata: {},
            };
            this._dataStore.set(sensor.objectId, sensor);

            // Register Sensor with SensorSourceController.
            this._sensorsArray.push(sensor);
            this.registerSensor(sensor, new MockSensorIo(), "channel", this.options.monitoringInterval);
        }
    }

    /**
     * Returns a UnitOfMeasurement based on the given metric
     * @param metric string (load-average | free-memory | uptime)
     * @return UnitOfMeasurement
     */
    private _getUnitOfMeasurement(metric: string): UnitOfMeasurement {
        switch (metric) {
            case "load-average":
                return {
                    name: "Percentage",
                    symbol: "%",
                    definition: "http://www.qudt.org/qudt/owl/1.0.0/unit/Instances.html#Percent",
                };
            case "free-memory":
                return {
                    name: "Byte",
                    symbol: "B",
                    definition: "http://www.qudt.org/qudt/owl/1.0.0/unit/Instances.html#Byte",
                };
            case "uptime":
                return {
                    name: "Second",
                    symbol: "s",
                    definition: "http://www.qudt.org/qudt/owl/1.0.0/unit/Instances.html#SecondTime",
                };
            default:
                throw new TypeError("'load-average', 'free-memory' , 'uptime' expected. Got " + metric);
        }
    }

    private _getMetricResult(sensorId: string): number {
        const metricIndex = this._sensorsArray.findIndex(s => s.objectId === sensorId);
        switch (metricIndex) {
            case 0:
                // The load average is a UNIX-specific concept with no real equivalent on Windows platforms.
                // On Windows, the return value is always [0, 0, 0].
                return Math.round(osType().startsWith("Windows") ? Math.random() * 100 : loadavg()[0] * 100);
            case 1:
                return freemem();
            case 2:
                return uptime();
            default:
                throw new TypeError("There are only three metrics. Got index " + metricIndex);
        }
    }
}
