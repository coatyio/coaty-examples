/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { ControlComponent } from "./control.component";

const routes: Routes = [
    { path: "", component: ControlComponent }
];

/**
 * Module definition for configuring the routes of the control module.
 */
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ControlRoutingModule { }
