# CoatySwift - Remote Operations Example

[![Powered by Coaty](https://img.shields.io/badge/Powered%20by-Coaty-FF8C00.svg)](https://coaty.io)
[![Swift](https://img.shields.io/badge/Source%20code-Swift%205-FF4029.svg)](https://developer.apple.com/swift/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

This example demonstrates how remote operations in
[CoatySwift](https://github.com/coatyio/coaty-swift) can be used to switch
multiple distributed light sources by decentralized lighting control units.

## Table of Contents

* [Introduction](#introduction)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Start-up](#start-up)

## Introduction

For an overview of the example scenario, take a look at the [Coaty JavaScript
Remote Operations](https://github.com/coatyio/coaty-examples/tree/master/remote-operations/js)
project.

In this scenario, the CoatySwift Remote Operations example application realizes
the functionality of a **Light UI** and a rudimentary version of the **Light
Control UI**. It is interoperable with a **Light Control UI** agent running on
Coaty JS and intended to be used along with it.

## Prerequisites

To build and run the CoatySwift Remote Operations app you need XCode 10.2 or
higher. CoatySwift is available through [CocoaPods](https://cocoapods.org).
Ensure you have installed **at least** version `1.8.4` of CocoaPods, i.e.
running `pod --version` should yield `1.8.4` or higher.

To interoperate with a Coaty JS Light Control UI agent, set it up as explained
[here](https://github.com/coatyio/coaty-examples/tree/master/remote-operations/js).

## Installation

To build the CoatySwift Remote Operations app, just clone this repo and run `pod
install` on the `remote-operations/swift/` Xcode project folder.

## Start-up

Ensure the Coaty JS Remote Operations components, i.e. broker, and Light Control
UI have been started.

Open the `xcworkspace` of the project folder in Xcode, then build and run it.
Now, you can invoke "Switch light" control operations in the Coaty JS Light
Control UI and see how the CoatySwift Light UI reacts accordingly. You can also
press the "Random Color Change" button in the CoatySwift app to switch remote
Coaty JS Light UIs.

> **Note**: The broker IP address of the CoatySwift app is preconfigured to
> localhost, i.e. `127.0.0.1` (see class `SwitchLightViewController`). This is
> okay for testing the app in the Xcode simulator in combination with a local
> broker. However, if you deploy and run your app on a device, you need to
> adjust the variable `brokerIp` accordingly.
>
> **Note**: The current version of CoatySwift does not support context-based
> filtering of Call-Return events. This means that context filter settings for
> lights in a Light Control UI agent are ignored by the CoatySwift Light UI app.
