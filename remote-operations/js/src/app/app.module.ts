/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { NgModule } from "@angular/core";
import { BrowserModule, HAMMER_GESTURE_CONFIG } from "@angular/platform-browser";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

// [HACK] Workaround for sliding issue with certain Material components in lazy
// loaded modules (see https://github.com/angular/material2/issues/4595). 
//
// This bug will be fixed in a near version (as of 2019-04-12). You should then
// remove this import and the HAMMER_GESTURE_CONFIG provider in the module
// definition below.
import { GestureConfig } from '@angular/material';

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";

/**
 * Defines Angular specific configuration metadata of the app.
 */
@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        HttpClientModule,
    ],
    providers: [
        { provide: HAMMER_GESTURE_CONFIG, useClass: GestureConfig },
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
