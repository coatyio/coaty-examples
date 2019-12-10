# Coaty Template Project for Node.js

[![Powered by Coaty](https://img.shields.io/badge/Powered%20by-Coaty-FF8C00.svg)](https://coaty.io)
[![TypeScript](https://img.shields.io/badge/Source%20code-TypeScript-007ACC.svg)](http://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

This project provides a ready-to-use template for a Coaty agent running in
Node.js and programmed in TypeScript. Copy and use it as a blueprint for your
own Coaty agent projects.

The template project includes:

* a complete build system based on npm run scripts and gulp,
* the template sources for setting up a bare Coaty agent,
* support for running the project in a local Node.js runtime or in Docker.

> **Note**: This template project does not provide any application-specific
> business logic and usage examples of Coaty communication patterns.
> Such examples can be found in the adjacent projects.

## Prerequisites

To begin with, make sure that the `Node.js` JavaScript runtime is globally
installed on your target machine. We recommend to use the latest LTS version,
but at least version 8. Download and installation details can be found
[here](http://nodejs.org/).

The agent software uses the node package dependency manager `npm` to download
dependent libraries. npm comes with `Node.js` so you need to install it first.
The agent project can be build and executed using npm run scripts.

If you are within a corporate network, you may need to specify HTTP/HTTPS
proxies so that npm can download dependent libraries from the public npm
repository. The easiest way is to create an `.npmrc` file in your home folder
and add two lines like this:

```txt
proxy=http://193.100.0.3:9800/
https-proxy=http://193.100.0.3:9800/
```

To program Coaty applications, we recommend to use [Visual Studio
Code](https://code.visualstudio.com/), a free, open source IDE that runs
everywhere. Install the VS Code extension "TSLint" to enable TypeScript linting
within the IDE.

If you are new to Coaty and want to know how to learn and use the Coaty
framework, take a look at the [Coaty website](https://coaty.io).

If you want to run the Coaty agent with Docker, install the latest
[Docker](https://www.docker.com/) version for your platform.

## Installation

Install project dependencies and build the project as follows:

```sh
npm install
npm run build
```

## Start up with Node.js runtime

Ensure an MQTT broker is set up and running. If you are not running an external
broker, you can start the Coaty broker:

```sh
npm run broker
```

Alternatively, you can start the Coaty broker in debugging mode, where all MQTT
publications and subscriptions are logged on the console:

```sh
npm run broker:verbose
```

Next, adjust the environment variables provided in the project's `.env` file to
your environment.

Then, start a Coaty agent:

```sh
npm run start
```

## Start up with Docker

The project can be run with Docker:

```sh
npm run docker:up
```

Ensure that the environment variables provided in the project's `.env` file are
adjusted to your environment.

To rebuild the Docker images:

```sh
npm run docker:build
```

If you are within a corporate network, ensure to set the `http_proxy`
environment variable when building the Docker images like this:

```txt
http_proxy=http://193.100.0.3:9800/
```

---
Copyright (c) 2019 Siemens AG. This work is licensed under a
[Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).
