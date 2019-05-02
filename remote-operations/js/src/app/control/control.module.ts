/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { NgModule } from "@angular/core";

import { SharedModule } from "../shared/shared.module";
import { CodeViewerBottomSheetComponent } from "./code-viewer-bottom-sheet.component";
import { ControlComponent } from "./control.component";
import { ControlRoutingModule } from "./control-routing.module";

/**
 * Defines Angular specific configuration metadata of the lazy-loaded control
 * feature module.
 */
@NgModule({
    declarations: [
        CodeViewerBottomSheetComponent,
        ControlComponent,
    ],
    entryComponents: [
        CodeViewerBottomSheetComponent,
    ],
    imports: [
        SharedModule,
        ControlRoutingModule
    ],
})
export class ControlModule { }
