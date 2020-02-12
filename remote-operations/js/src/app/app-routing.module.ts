/*! Copyright (c) 2019 Siemens AG. Licensed under the MIT License. */

import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

/**
 * Defines the route configuration for the light and the control modules which
 * are lazy loaded.
 */
const routes: Routes = [
    { path: "", redirectTo: "/control", pathMatch: "full" },
    { path: "light", loadChildren: () => import('./light/light.module').then(m => m.LightModule) },
    { path: "control", loadChildren: () => import('./control/control.module').then(m => m.ControlModule) },
    { path: "**", redirectTo: "/control" },
];

/**
 * Module definition for configuring the app routes.
 */
@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
