/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import {
    AfterContentInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
    ViewChild,
    ElementRef,
} from "@angular/core";
import { ActivatedRoute } from '@angular/router';
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { MatButtonToggleChange } from "@angular/material/button-toggle";
import { MatSlideToggleChange } from "@angular/material/slide-toggle";
import { MatSliderChange } from "@angular/material/slider";
import { Observable, Subject } from "rxjs";
import { filter, map } from "rxjs/operators";

import {
    CommunicationState,
    CallEventData,
    Container,
    ContextFilter,
    filterOp,
    ObjectFilterCondition,
    ObjectFilterConditions,
    ObjectFilterOperator,
    Uuid,
} from "@coaty/core";

import { AgentService } from "../agent.service";
import { AppContextService } from "../app-context.service";
import { ColorRgba, LightContextRanges } from "../shared/light.model";
import { ActiveAgentsInfo, ControlController, EventLogEntry } from "./control.controller";
import { CodeViewerBottomSheetComponent } from "./code-viewer-bottom-sheet.component";

interface WindowLayout {
    screenLeft: number;
    screenTop: number;
    outerWidth: number;
    outerHeight: number;
    availTop: number;
    availLeft: number;
    availWidth: number;
    availHeight: number;
}

@Component({
    selector: "app-control",
    templateUrl: "control.component.html",
    styleUrls: ["control.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,

    // Allow Material styles to be overriden in component style.
    // Needed for custom theming of color slider.
    encapsulation: ViewEncapsulation.None,
})
export class ControlComponent implements AfterContentInit, OnDestroy, OnInit {

    @ViewChild("controlCard", { read: ElementRef, static: true }) cardElementRef: ElementRef;

    /** The container of the Coaty light control agent. */
    controlContainer: Container;

    brokerConnectionInfo$: Observable<any>;

    selectedBuildings: number[];
    selectedFloors: number[];
    selectedRooms: number[];
    selectedLightId: Uuid;
    selectedLightUrl: string;

    availableBuildings: number[];
    availableFloors: number[];
    availableRooms: number[];

    autoSwitch = false;

    // ngModel bindings for operation parameters.
    onOff: boolean;
    luminosityPercent: number;            // 0..100
    primaryColorPosition: number;         // 0..<primaryColorPositionMax> or -1
    customColors: Array<{ name: string, rgba: ColorRgba }>;
    selectedCustomColor: { name: string, rgba: ColorRgba };
    switchTime: number;

    readonly primaryColorPositionMax = 1000;

    /** Call-Return event log emitted by an observable. */
    eventLog$: Observable<Array<EventLogEntry>>;

    /** Active agent info emitted by an observable */
    activeAgentsInfo$: Observable<ActiveAgentsInfo>;

    readonly currentClock$ = new Subject<number>();
    isClockStopped: boolean;

    private currentLightWindowLayout: WindowLayout;

    constructor(
        private appContext: AppContextService,
        private bottomSheet: MatBottomSheet,
        private changeRef: ChangeDetectorRef,
        private route: ActivatedRoute,
        agentService: AgentService
    ) {
        this.appContext.setContext("Light Control");
        this.startClock();
        this.connectControlController(agentService);
    }

    /* Event handler */

    ngOnInit() {
        // Capture the query param 'light_id' if available to set the light context filter.
        this.route
            .queryParamMap
            .pipe(
                map(params => params.get("light_id")),
                filter(value => !!value)
            )
            .subscribe(lightId => {
                setTimeout(() => {
                    this.selectedLightId = lightId;
                    this.selectedLightUrl = window.location.href;
                });
            });
    }

    ngAfterContentInit() {
        // The native slider element is available in the DOM not until the next
        // macrotask.
        setTimeout(() => {
            this.updateColorSliderThumb(this.primaryColorPosition);
        });
    }

    ngOnDestroy() {
        this.stopClock();
        if (this.controlContainer) {
            this.controlContainer.shutdown();
        }
    }

    onOnOffToggle(event: MatSlideToggleChange) {
        if (this.autoSwitch) {
            this.switchLights();
        }
    }

    onLuminosityChange(event: MatSliderChange) {
        if (this.autoSwitch) {
            this.switchLights();
        }
    }

    primaryColorThumbDisplayer(position: number) {
        // Suppress slider thumb label.
        return "";
    }

    onPrimaryColorDrag(event: MatSliderChange) {
        this.updateColorSliderThumb(event.value);
        this.selectedCustomColor = undefined;
    }

    onPrimaryColorChange(event: MatSliderChange) {
        if (this.autoSwitch) {
            this.switchLights();
        }
    }

    onCustomColorChange(event: MatButtonToggleChange) {
        if (event.source.checked) {
            this.updateColorSliderThumb(-1);
            if (this.autoSwitch) {
                this.switchLights();
            }
        }
    }

    onSwitchTimeChange(event: MatButtonToggleChange) {
        if (this.autoSwitch) {
            this.switchLights();
        }
    }

    onQrCodeDragOver(event: DragEvent) {
        if (event.dataTransfer.types.includes("text/qrcode")) {
            event.preventDefault();
        }
    }

    onQrCodeDrop(event: DragEvent) {
        const url = event.dataTransfer.getData("text/qrcode");
        const queryIndex = url.lastIndexOf("?light_id=");
        if (queryIndex !== -1) {
            this.selectedLightId = url.substr(queryIndex + 10);
            this.selectedLightUrl = url;
        }
        event.preventDefault();
    }

    onQrCodeClear(event: MouseEvent) {
        this.selectedLightId = undefined;
        this.selectedLightUrl = undefined;
    }

    /* Actions */

    /**
     * Publish a Call event to wwitch on/off lights with the selected parameters
     * matching the selected context filter.
     */
    switchLights() {
        const ctrl = this.controlContainer.getController<ControlController>("ControlController");
        ctrl.switchLights(this.createContextFilter(), this.onOff, this.luminosity, this.effectiveColor, this.switchTime);
    }

    /**
     * View the JS code of the remote operation call for the selected filter and
     * parameters.
     */
    openCodeViewer() {
        this.bottomSheet.open(CodeViewerBottomSheetComponent, {
            data: this.getFormattedEventData(this.onOff, this.luminosity, this.effectiveColor, this.switchTime, this.createContextFilter()),
        });
    }

    /**
     * Create a new light view that opens in a separate browser popup window.
     *
     * Newly created light popups are tiled on the screen starting at the upper
     * left corner.
     */
    openLightApp() {
        this.openLightAppInPopup();
    }

    viewCallEventData(data: CallEventData) {
        console.log(data.filter);
        this.bottomSheet.open(CodeViewerBottomSheetComponent, {
            data: this.getFormattedEventData(
                data.getParameterByName("on") as boolean,
                data.getParameterByName("luminosity") as number,
                data.getParameterByName("color") as ColorRgba,
                data.getParameterByName("switchTime") as number,
                data.filter),
        });
    }

    /**
     * Clear all entries in the event log view.
     */
    clearEventLog() {
        (this.controlContainer.getController("ControlController") as ControlController).clearEventLog();
    }

    /* Public getters */

    get luminosity() {
        return this.luminosityPercent / 100;
    }

    get effectiveColor() {
        if (this.selectedCustomColor) {
            return this.selectedCustomColor.rgba;
        }
        const primary = this.colorPositionToRgba(this.primaryColorPosition);
        // Provide a semitransparent color so that the light bulb's interior
        // remains visible :-).
        primary[3] = 0.75;
        return primary;
    }

    colorRgbaToCssRgba(color: ColorRgba) {
        return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
    }

    getReturnEventsCount(log: Array<EventLogEntry>) {
        return log.reduce((prev, e) => prev + e.returnEvents.length, 0);
    }

    trackByEventLogEntries(index: number, entry: EventLogEntry): string {
        return entry.correlationId;
    }

    /* Clock management */

    private startClock() {
        let currentTime = Date.now();
        this.currentClock$.next(currentTime);
        this.isClockStopped = false;
        const clockLoop = () => {
            if (this.isClockStopped) {
                return;
            }
            requestAnimationFrame(() => {
                const now = Date.now();
                if (now - currentTime >= 1000) {
                    this.currentClock$.next(currentTime = now);
                }
                clockLoop();
            });
        };
        clockLoop();
    }

    private stopClock() {
        this.isClockStopped = true;
    }

    /* Context filter */

    private initContextFilterBindings(ranges: LightContextRanges, options: any) {
        const range = (min: number, max: number): number[] => {
            return Array.from({ length: max - min + 1 }, (x, i) => i + min);
        };

        this.availableBuildings = range(ranges.building.min, ranges.building.max);
        this.availableFloors = range(ranges.floor.min, ranges.floor.max);
        this.availableRooms = range(ranges.room.min, ranges.room.max);

        this.selectedBuildings = options.initialContextFilterBuildings;
        this.selectedFloors = options.initialContextFilterFloors;
        this.selectedRooms = options.initialContextFilterRooms;
    }

    private createContextFilter(): ContextFilter {
        if (this.selectedLightId) {
            return {
                conditions: ["lightId", filterOp.equals(this.selectedLightId)],
            };
        }
        return {
            conditions: {
                and: [
                    ["building", filterOp.in(this.selectedBuildings)],
                    ["floor", filterOp.in(this.selectedFloors)],
                    ["room", filterOp.in(this.selectedRooms)],
                ],
            },
        };
    }

    /* Operation Parameters */

    private initOperationParams(options: any) {
        this.onOff = options.initialOpParamOnOff;
        this.luminosityPercent = options.initialOpParamLuminosity * 100;
        this.primaryColorPosition = this.rgbaToColorPosition(options.initialOpParamPrimaryColor);
        this.customColors = options.customColors;
        this.switchTime = options.initialSwitchTime;
    }

    /* Controller connection */

    private connectControlController(agentService: AgentService) {
        // Create and start up a Coaty container with the control controller.
        // Then connect the control assets provided by the controller to
        // corresponding data bindings of this view component.
        agentService.resolveContainer("LightControlAgent", "ControlController", ControlController)
            .then(container => {
                this.controlContainer = container;
                const controlController: ControlController = container.getController("ControlController");

                this.initBrokerConnectionInfo(controlController.options);
                this.initContextFilterBindings(container.runtime.commonOptions.extra.lightContextRanges, controlController.options);
                this.initOperationParams(controlController.options);
                this.eventLog$ = controlController.eventLog$;
                this.activeAgentsInfo$ = controlController.activeAgentsInfo$;
                this.changeRef.detectChanges();

                // Provide the app context with the container's identity ID to
                // be displayed in the title of the HTML document.
                this.appContext.setContext(`Light Control #${container.identity.objectId}`);
            })
            .catch(error => {
                throw new Error(`Agent container for ControlComponent couldn't be resolved: ${error}`);
            });
    }

    /* Broker Connection Info */

    private initBrokerConnectionInfo(options: any) {
        this.brokerConnectionInfo$ = this.controlContainer.communicationManager.observeCommunicationState()
            .pipe(map(state => {
                return {
                    state,
                    isOnline: state === CommunicationState.Online,
                    brokerHost: this.controlContainer.communicationManager.options.brokerUrl
                };
            }));
    }

    /* Open Light */

    private openLightAppInPopup() {
        const opts = this.controlContainer.getController<ControlController>("ControlController").options;
        const lw = opts.lightWindowWidth;
        const lh = opts.lightWindowHeight;
        const newWindow = window.open("./light", "_blank",
            `toolbar=no,resizable=no,status=no,location=no,menubar=no,titlebar=no,width=${lw},height=${lh}`);
        const newWindowLayout = {
            screenLeft: newWindow.screenLeft,
            screenTop: newWindow.screenTop,
            outerWidth: newWindow.outerWidth,
            outerHeight: newWindow.outerHeight,
            // tslint:disable-next-line: no-string-literal
            availTop: newWindow.screen["availTop"] || 0,
            // tslint:disable-next-line: no-string-literal
            availLeft: newWindow.screen["availLeft"] || 0,
            availWidth: newWindow.screen.availWidth,
            availHeight: newWindow.screen.availHeight,
        };
        let nx: number;
        let ny: number;
        if (this.currentLightWindowLayout) {
            const cx = this.currentLightWindowLayout.screenLeft;
            const cy = this.currentLightWindowLayout.screenTop;
            const cw = this.currentLightWindowLayout.outerWidth;
            const ch = this.currentLightWindowLayout.outerHeight;
            const st = this.currentLightWindowLayout.availTop;
            const sl = this.currentLightWindowLayout.availLeft;
            const sw = this.currentLightWindowLayout.availWidth;
            const sh = this.currentLightWindowLayout.availHeight;
            nx = cx;
            ny = cy + ch;
            if (ny + ch >= st + sh) {
                nx += cw;
                ny = st;
                if (nx + cw >= sl + sw) {
                    nx = sl;
                    ny = st;
                }
            }
        } else {
            nx = newWindowLayout.availLeft;
            ny = newWindowLayout.availTop;
        }
        newWindow.moveTo(nx, ny);
        newWindowLayout.screenLeft = newWindow.screenLeft;
        newWindowLayout.screenTop = newWindow.screenTop;
        this.currentLightWindowLayout = newWindowLayout;
    }

    /* Color manipulation */

    private updateColorSliderThumb(position: number) {
        // If position is invalid, use transparent white to make thumb
        // invisible.
        const color = this.colorPositionToRgba(position) || [255, 255, 255, 0] as ColorRgba;
        const cardElem = this.cardElementRef.nativeElement as HTMLElement;
        const sliderThumbLabel = cardElem.querySelector(".control-color-slider .mat-slider-thumb-label") as HTMLElement;
        if (sliderThumbLabel) {
            sliderThumbLabel.style.backgroundColor = this.colorRgbaToCssRgba(color);
        }
    }

    /**
     * Converts an rgba tuple to the color position of the slider, if possible.
     * For colors which are not part of the slider's color gradient, -1 is
     * returned.
     *
     * The following color stops are used, as defined in the linear color
     * gradient of the .control-color-slider style in control.component.scss.
     *
     * [255, 0, 0],
     * [255, 255, 0],
     * [0, 255, 0],
     * [0, 255, 255],
     * [0, 0, 255],
     * [255, 0, 255],
     * [255, 0, 0]
     */
    private rgbaToColorPosition(rgba: ColorRgba): number {
        const [r, g, b, a] = rgba;
        const d = 1 / 6;
        let v: number;

        if (r === 255 && b === 0) {
            v = d * g / 255;
        } else if (g === 255 && b === 0) {
            v = d + ((255 - d * r) / 255);
        } else if (r === 0 && g === 255) {
            v = 2 * d + (d * b / 255);
        } else if (r === 0 && b === 255) {
            v = 3 * d + ((255 - d * g) / 255);
        } else if (g === 0 && b === 255) {
            v = 4 * d + (d * r / 255);
        } else if (r === 255 && g === 0) {
            v = 5 * d + ((255 - d * b) / 255);
        } else {
            return -1;
        }

        return v * this.primaryColorPositionMax;
    }

    /**
     * Converts a color slider position to the corresponding color RGBA tuple.
     * If -1 is passed in (a color not part of the slider's color gradient),
     * undefined is returned (see method rgbaToColorPosition).
     */
    private colorPositionToRgba(position: number): ColorRgba {
        if (position === -1) {
            return undefined;
        }

        let r = 0;
        let g = 0;
        let b = 0;
        const pos = position / this.primaryColorPositionMax;
        const d = 1 / 6;

        if (pos <= d) {
            r = 255;
            g = 255 * pos / d;
            b = 0;
        } else if (pos <= 2 * d) {
            r = 255 - (255 * (pos - d) / d);
            g = 255;
            b = 0;
        } else if (pos <= 3 * d) {
            r = 0;
            g = 255;
            b = (255 * (pos - 2 * d) / d);
        } else if (pos <= 4 * d) {
            r = 0;
            g = 255 - (255 * (pos - 3 * d) / d);
            b = 255;
        } else if (pos <= 5 * d) {
            r = (255 * (pos - 4 * d) / d);
            g = 0;
            b = 255;
        } else {
            r = 255;
            g = 0;
            b = 255 - (255 * (pos - 5 * d) / d);
        }

        return [Math.round(r), Math.round(g), Math.round(b), 1] as ColorRgba;
    }

    /* Code formatting */

    /**
     * Gets pretty printed code for JavaScript objects representing the
     * currently selected context filter and operation parameters.
     *
     * Returns an object hash containing the properties `contextFilter`,
     * `operationParameters`, and `operation` with formatted content strings.
     *
     * Note: the formatting algorithm is not generic, but specific to the
     * formatting content. Do not use in other contexts.
     */
    private getFormattedEventData(on: boolean, luminosity: number, color: ColorRgba, switchTime: number, contextFilter: ContextFilter) {
        const arrayFormat = (v: Array<any>) => {
            return JSON.stringify(v).replace(/,/g, ", ");
        };
        const replacer = (k, v) => {
            // Format arrays that contain no other arrays as elements in a
            // single line.
            if (Array.isArray(v) && v.every((e => !Array.isArray(e)))) {
                return arrayFormat(v);
            }
            return v;
        };
        const fixer = (v: string) => {
            return v.replace(/\\/g, "")
                .replace(/\"\[/g, "[")
                .replace(/\]\"/g, "]")
                .replace(/\"\{/g, "{")
                .replace(/\}\"/g, "}");
        };
        const formatter = (v: any) => {
            return fixer(JSON.stringify(v, replacer, 2));
        };
        const filterConverter = (f: ContextFilter) => {
            if (Array.isArray(f.conditions)) {
                const cond = f.conditions as ObjectFilterCondition;
                cond[1] = `filterOp.${ObjectFilterOperator[cond[1][0]]}(${JSON.stringify(cond[1][1])})` as any;
                return f;
            }
            (f.conditions as ObjectFilterConditions).and.forEach(cond =>
                cond[1] = `filterOp.${ObjectFilterOperator[cond[1][0]]}(${arrayFormat(cond[1][1])})` as any);
            return f;
        };
        const filterFixer = (f: string) => {
            return f.replace(/\"filterOp/g, "filterOp").replace(/\)\"/g, ")");
        };

        return {
            operation: formatter(this.controlContainer.runtime.commonOptions.extra.lightControlOperation),
            operationParameters: formatter({
                on,
                luminosity,
                color,
                switchTime,
            }),
            contextFilter: filterFixer(formatter(filterConverter(contextFilter))),
        };
    }

}
