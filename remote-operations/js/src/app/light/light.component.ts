/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { ChangeDetectionStrategy, Component, OnDestroy } from "@angular/core";
import { Location } from "@angular/common";
import { Observable } from "rxjs";
import { map, skip } from "rxjs/operators";

import { CommunicationState, Container } from "@coaty/core";

import { AgentService } from '../agent.service';
import { AppContextService } from "../app-context.service";
import { Light, LightContext, LightContextRanges } from "../shared/light.model";
import { LightController } from './light.controller';

/**
 * An Angular component that provides a view of a single light with its current
 * light status and light context. The light context properties can be changed
 * interactively by the user.
 */
@Component({
    selector: "app-light",
    templateUrl: "light.component.html",
    styleUrls: ["light.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LightComponent implements OnDestroy {

    /** The Light object. */
    light: Light;

    /** Light color changes emitted by an observable. */
    lightColor$: Observable<string>;

    /** Real light switch changes emitted by an observable, but the initial color change is not emitted. */
    lastSwitched$: Observable<string>;

    /** The current light context. */
    lightContext: LightContext;

    /** Ranges for light context parameters. */
    lightContextRanges: LightContextRanges;

    /** The container of the Coaty light agent.  */
    lightContainer: Container;

    /** Observable that emits broker connection info on connection state changes. */
    brokerConnectionInfo$: Observable<any>;

    /** Absolute URL pointing to light control UI with lightId query param. */
    qrCodeUrl: string;

    constructor(public appContext: AppContextService, private location: Location, agentService: AgentService) {
        this.appContext.setContext("Light");
        this.initNgModelBindings();
        this.connectLightController(agentService);
    }

    ngOnDestroy() {
        if (this.lightContainer) {
            this.lightContainer.shutdown();
        }
    }

    onQrCodeClick(event: MouseEvent) {
        // Open a new light control UI with the context filter preset to this light.
        window.open(this.qrCodeUrl, "_blank");
    }

    onQrCodeDrag(event: DragEvent, tooltip) {
        tooltip.hide();
        event.dataTransfer.setData("text/plain", this.qrCodeUrl);
        event.dataTransfer.setData("text/qrcode", this.qrCodeUrl);
    }

    /**
     * Get absolute URL pointing to light control UI with lightId query param set.
     */
    private getQrCodeUrl() {
        const urlPath = this.location.prepareExternalUrl(`/control?light_id=${this.light ? this.light.objectId : ""}`);
        return window.location.protocol + "//" + window.location.host + urlPath;
    }

    private initNgModelBindings() {
        // Initialize a default context as long as real context is not yet emitted
        // so that ngModel bindings do not throw error initially.
        this.lightContext = { building: 0, floor: 0, room: 0 } as LightContext;
        this.lightContextRanges = {
            building: { min: 0, max: 0, tickInterval: 1 },
            floor: { min: 0, max: 0, tickInterval: 1 },
            room: { min: 0, max: 0, tickInterval: 1 }
        };
    }

    private connectLightController(agentService: AgentService) {
        // Create and start up a Coaty container with the light controller. Then
        // connect the light assets provided by the controller to corresponding
        // data bindings of this view component.
        agentService.resolveContainer("LightAgent", "LightController", LightController)
            .then(container => {
                this.lightContainer = container;

                const lightController: LightController = container.getController<LightController>("LightController");
                this.lightContextRanges = container.runtime.commonOptions.extra.lightContextRanges;
                this.light = lightController.light;
                this.lightContext = lightController.lightContext;
                this.lightColor$ = lightController.lightColorChange$;
                this.lastSwitched$ = lightController.lightColorChange$.pipe(skip(1));
                this.qrCodeUrl = this.getQrCodeUrl();
                this.initBrokerConnectionInfo(lightController.options);

                // Provide the app context with the light ID to be displayed in
                // the title of the HTML document.
                this.appContext.setContext(`Light #${this.light.objectId}`);
            })
            .catch(error => {
                throw new Error(`Agent container for LightComponent couldn't be resolved: ${error}`);
            });
    }

    private initBrokerConnectionInfo(options: any) {
        this.brokerConnectionInfo$ = this.lightContainer.communicationManager.observeCommunicationState()
            .pipe(map(state => {
                return {
                    state,
                    isOnline: state === CommunicationState.Online,
                    brokerHost: this.lightContainer.communicationManager.options.brokerUrl
                };
            }));
    }

}
