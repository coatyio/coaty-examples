/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { QRCodeModule } from 'angularx-qrcode';

// Angular Material Modules
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Used by MatOptionSelectAllComponent
import { MatPseudoCheckboxModule } from "@angular/material";
import { MatOptionSelectAllComponent } from "./mat-option-select-all.component";

import { DateNowPipe } from "./date-now.pipe";

/**
 * A shared module that is imported by the lazy-loaded feature modules `light`
 * and `control`.
 */
@NgModule({
    declarations: [
        DateNowPipe,
        MatOptionSelectAllComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        QRCodeModule,

        // Used by MatOptionSelectAllComponent
        MatPseudoCheckboxModule,

        MatBottomSheetModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatCheckboxModule,
        MatDividerModule,
        MatExpansionModule,
        MatIconModule,
        MatListModule,
        MatToolbarModule,
        MatTooltipModule,
        MatSelectModule,
        MatSliderModule,
        MatSlideToggleModule,
    ],
    exports: [
        CommonModule,
        FormsModule,
        QRCodeModule,
        DateNowPipe,

        // Used by MatOptionSelectAllComponent
        MatPseudoCheckboxModule,
        MatOptionSelectAllComponent,

        MatBottomSheetModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatCheckboxModule,
        MatDividerModule,
        MatExpansionModule,
        MatIconModule,
        MatListModule,
        MatToolbarModule,
        MatTooltipModule,
        MatSelectModule,
        MatSliderModule,
        MatSlideToggleModule,

    ]
})
export class SharedModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: SharedModule,
            providers: []
        };
    }
}
