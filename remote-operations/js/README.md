# Coaty - Remote Operations Example

[![Powered by Coaty](https://img.shields.io/badge/Powered%20by-Coaty-FF8C00.svg)](https://coaty.io)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

This example demonstrates how remote operations in Coaty can be used to switch
multiple distributed light sources by decentralized lighting control units.
Remote light switching operations are context-filtered to enable control of
individual lights or groups of lights in the same room, on the same floor, or in
the same building.

This example provides deployments

* to run it from a public Github Pages host,
* to run it on your local machine,
* to run it with Docker.

## User Interface

After opening the light control UI, create several lights by clicking the "NEW
LIGHT" button in the action bar. Each light is opened in its own popup window.
Using the sliders, you can configure a light's context, which indicates where
the light should be physically located (i.e. building, floor, and room).

> **Tip**: If your browser has popups disabled, you can launch a new light UI in
> a new browser tab by clicking the "NEW LIGHT AS TAB" button in the action bar.

Now, you can control a specific set of lights or individual lights in the light
control UI by

* selecting appropriate context filter settings that define matching lights,
* selecting operation parameters for the matching lights (i.e. on/off state,
  luminosity, color, switch time).

Perform the selected operation with the selected filter by clicking the "SWITCH
LIGHTS" button.

> **TIP**: To execute the remote operation automatically whenever you change an
> operation parameter, check the checkbox next to the "SWITCH LIGHTS" button.

Click the code fab button "< >" to view the Call event data for the currently
selected parameters and context filter.

The expandable event log view provides details on the published Call events and
the results and execution info received by Return events. Click a code fab
button "< >" to view the Call event data for a specific operation.

To force errors to be returned by a remote operation, turn on the "Light defect"
switch in the light UI or select the invalid "black" color from the color
palette in the light control UI.

> **Tip**: You can also control an individual light by dragging the QR Code
> displayed in the light UI and dropping it onto the corresponding area in the
> context filter panel. Now, the operation context is limited to the selected
> light. Building, floor, and room filters are disabled and ignored. To enable
> these filters again, remove the QR Code from the context filter by clicking
> the "clear" button.
> 
> **Tip**: Alternatively, you can limit the context filter to a specific light
> by clicking on the light's QR Code or by scanning the QR Code (with your
> mobile device). On both cases, a new light control UI is opened with the
> corresponding operation context.
>
> **Tip**: You can also start several light control UIs simultaneously to
> demonstrate a decentralized lighting control system by clicking the "NEW LIGHT
> CONTROL" button in the action bar.
>
> **Tip**: The number of currently active Coaty agents for light UIs and light
> control UIs is displayed in the footer bar.

## Run example from GitHub Pages

For convenience, this project has been deployed to GitHub Pages.

To open a **light UI**, just scan this QR Code with your mobile device or click
it:

[![Light UI
URL](./qr-code-github-pages-light-url.png)](https://coatyio.github.io/coaty-examples/remote-operations/light)

To open a **light control UI** on your tablet, just scan this QR Code with your
mobile device or click it:

[![Light Control UI
URL](./qr-code-github-pages-control-url.png)](https://coatyio.github.io/coaty-examples/remote-operations/)

> **Note**: This deployment uses a [public MQTT
> broker](https://iot.eclipse.org/getting-started/#sandboxes). This implies that
> every participant who is opening light or light control UI apps served from
> GitHub Pages is taking part in a shared light switching experience. You can
> see the current number of active Coaty agents in the footer bar of the light
> control UI.

## Run example locally

To begin with, make sure that the `Node.js` JavaScript runtime (version 8 or
higher) is globally installed on your target machine. Download and installation
details can be found [here](http://nodejs.org/).

Then, checkout the example sources from
[here](https://github.com/coatyio/coaty-examples/tree/master/remote-operations/js)
and install dependencies by `npm install`.

Perform these steps in separate console windows:

1. `npm run broker` - to start the Coaty broker,
2. `npm run start` - to open a browser with the light control UI on
   `http://localhost:4200/`.

> **Tip**: For debugging and introspection, you can start the Coaty broker in
> verbose mode (`npm run broker:verbose`), so that all message subscriptions and
> published messages are traced in the console window.

## Run example with Docker

This example also comes with a Dockerfile and a Docker Compose file to run it
inside Docker containers that host the web app on an Nginx web server and
the Coaty broker, respectively.

Use `npm run docker:up` to build (only once), start, and attach the containers.

Then, open a browser with the light control UI on `http://<dockerhost>:8080`.

If you want to open the example web app not only on your local Docker machine,
you have to configure the broker URL. Since the broker is also running inside a
Docker container, set the environment variable `BROKER_URL` to
`mqtt://<dockerhost>:9883` before running `npm run docker:up`.

If you want to use the dockerized example with a public broker, set the
environment variable accordingly, e.g. to `wss://iot.eclipse.org:443/ws`.

## Deploy example on Github Pages

After you make changes or contributions to this example, the code should be
rebuild and deployed on Github Pages.

Run `npm run build:ghpages` to build the Angular app for GitHub Pages. Then,
commit your changes and push or create a merge request.

You can see your deployed page at
[https://coatyio.github.io/coaty-examples/remote-operations/](https://coatyio.github.io/coaty-examples/remote-operations/).

## Deploy example on web server

For deployment on a production server, build the project in production mode `npm
run build:prod`. The build artifacts will be stored in the `dist/` output
folder.

Copy *everything* within the output folder to a folder on your web server.

Make sure that you adjust the `brokerUrl` property in the configuration file
`environments/environment.prod.ts` to specify the location where your production
broker is running.

Configure the server to redirect requests for missing files to `index.html`.
Configure HTML `base href` tag if you want to serve the app from a server
subfolder. Detailed instructions can be found
[here](https://angular.io/guide/deployment#production-servers).

## Project structure

This project is a single-page web application that was generated with [Angular
CLI](https://github.com/angular/angular-cli). To get more help on the Angular
CLI use `npm run ng help` or check out the [Angular CLI
README](https://github.com/angular/angular-cli/blob/master/README.md).

Here is the folder structure of the Angular singe-page web app. To keep it
readable, only important files are displayed:

```
|── docker/
|   └── docker-compose.yaml           - Docker Compose file to start web server and Coaty broker
|── src/
│   |── app/                          - Angular web app
|   |   ├── control/                  - Angular module for light control UI
|   |   |   ├── control.component.ts|.scss|.html  - Angular light control view component
|   |   |   └── control.controller.ts             - Coaty controller for light control UI
|   |   ├── light/                    - Angular module for light UI
|   |   |   ├── light.component.ts|.scss|.html  - Angular light view component
|   |   |   └── light.controller.ts             - Coaty controller for light UI
|   |   ├── shared/                   - Angular module with components shared by control and light modules
|   |   |   └── light.model.ts        - Coaty object model definitions
|   |   ├── agent.info.ts             - Coaty agent info auto-generated by build script
|   |   ├── agent.service.ts          - Angular service that resolves Coaty containers for light and control UI
│   |   └── app.component.ts|.html|.scss - Angular root component
|   |── assets/                       - assets used by web app
|   |   ├── config/
|   |   |   └── agent.config.json     - Coaty agent configuration for containers
|   |   └── images/                   - image resources for web app
|   ├── index.html                    - Angular index HTML file
|   ├── main.ts                       - Angular bootstrap file
|   ├── polyfills.ts                  - Angular browser polyfills
|   └── styles.scss                   - Angular global CSS styles
|── angular.json                      - Angular project file
|── Dockerfile                        - Dockerfile for dockerized build
|── package.json                      - project package definition
├── README.md                         - this document
|── tsconfig.json                     - TypeScript compiler options
|── tslint.json                       - TypeScript linter options
└── webpack.node-polyfills.config.js  - polyfills for Node.js globals
```

The Angular single-page web app consists of two separate lazy loaded Angular
modules representing either a single light UI or a light control UI. These pages
are accessible on separate routes (`/light`, and `/control` (default)). When the
app starts up, depending on the given route, only the associated module is
loaded.

### Coaty agents and controllers

Each light UI is associated with its own Coaty agent, running a separate Coaty
container with a `LightController`. This controller is responsible for observing
and executing remote operations named `coaty.example.remoteops.switchLights`.

Each light control UI is also associated with its own Coaty agent, running in a
separate Coaty container with a `ControlController`. This controller is
responsible for publishing remote operations named
`coaty.example.remoteops.switchLights` and maintaining the received results in
an event log data structure.

Note that operation parameters for Call-Return events should always be validated
by the receiving parties (CallEvent data by the `LightController` and
ReturnEvent data by the `ControlController`).

The local communication flow between a controller and its corresponding
Angular view component (`LightComponent`, `ControlComponent`) is modelled using
RxJS observables. Observables can be efficiently handled inside Angular view
templates using the `async` pipe.

Agent configuration parameters are contained in a central config file named
`agent.config.json` located in the `src/assets/config/` folder of the project.
This configuration also contains common options to be used by the light UI and
the control UI views, and commmunication options such as the URL of the Coaty
broker.

Each Coaty container is resolved by an Angular service class called
`AgentService` when the corresponding Angular view component is instantiated.
The configuration of a container is retrieved via a REST/HTTP GET request from
the web server hosting the app (see file `agent.service.ts`). This way, the
hostname/IP address for establishing a connection to the Coaty broker need not
be hardcoded into the source code of the web app.

---
Copyright (c) 2019 Siemens AG. This work is licensed under a [Creative Commons
Attribution-ShareAlike 4.0 International
License](http://creativecommons.org/licenses/by-sa/4.0/).
