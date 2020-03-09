/*! Copyright (c) 2018 Siemens AG. Licensed under the MIT License. */

import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";

import { Container } from "@coaty/core";
import { provideComponents } from "@coaty/core/runtime-angular";

import { components, configuration } from "./app/agent.config";
import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";

const container = Container.resolve(components, configuration);

if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic(provideComponents(container)).bootstrapModule(AppModule)
    .catch(err => console.log(err));

