/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { LightComponent } from "./light.component";

const routes: Routes = [
    { path: "", component: LightComponent }
];

/**
 * Module definition for configuring the routes of the light module.
 */
@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class LightRoutingModule { }
