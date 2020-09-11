# CoatySwift - IO Routing Example

[![Powered by Coaty 2](https://img.shields.io/badge/Powered%20by-Coaty%202-FF8C00.svg)](https://coaty.io)
[![Swift](https://img.shields.io/badge/Source%20code-Swift%205-FF4029.svg)](https://developer.apple.com/swift/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

This example demonstrates how IO routing in [CoatySwift](https://github.com/coatyio/coaty-swift) 
can be used to control the flow of values from IoSources to IoActors, based on a selectable 
IoContext. Additionally, this example provides a useful switcher for different Backpressure 
strategies in IoRouting, which can be used to visually understand how each strategy works. 
(for more information please check out the [CoatySwift Developer Guide](https://coatyio.github.io/coaty-swift/man/developer-guide/)).

## Table of Contents

- [CoatySwift - IO Routing Example](#coatyswift---io-routing-example)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Start-up](#start-up)

## Introduction

Please read the [IO Routing section](https://coatyio.github.io/coaty-swift/man/developer-guide/#io-routing) of the CoatySwift Developer Guide to gain some basic understanding of how IO Routing works, before proceeding. 

In this example, three different targets are provided: SourcesAgent, NormalStateActorAgent and 
EmergencyStateActorAgent. It is possible to run the targets on a single device (or simulator), but 
for the best overview running each target on a separate device/simulator is recommended. 

SourcesAgent is an iOS application hosting three different IoSources, each with a different
Backpressure Strategy (refer to comments in code). Using this target a user can:
1) Modify the IO Routing Context (switch between Normal and Emergency states).
2) Select the strategy (in the background an appropriate IoSource is chosen) that should be 
   used to publish IOValues (None, Sample or Throttle).
3) Publish IOValues with an example payload to associated IOActors using CoatySwift.

NormalStateActorAgent represent an iOS application hosting an IoActor responsible for `operatingState` = "normal". It can:
1) Display whether it is currently associated with any IoSource.
2) List all received IoValues, since the last successful association.

EmergencyStateActorAgent represent an iOS application hosting an IoActor responsible for `operatingState` = "emergency". It can:
1) Display whether it is currently associated with any IoSource.
2) List all received IoValues, since the last successful association.

## Prerequisites

To build and run the CoatySwift IO Routing example you need XCode 10.2 or
higher. CoatySwift is available through [CocoaPods](https://cocoapods.org).
Ensure you have installed **at least** version `1.8.4` of CocoaPods, i.e.
running `pod --version` should yield `1.8.4` or higher.

## Installation

To build the CoatySwift IO Routing Example, just clone this repo and run `pod
install` on the `io-routing/swift/` Xcode project folder.

## Start-up

Ensure that a MQTT broker is running and reachable in your network. You can use the 
broker contained in coaty-examples/hello-world/js scripts.

Open the `xcworkspace` of the project folder in Xcode.
Select the target `SourcesAgent` and run it on e.g. iPhone 11 simulator.
Select the target `NormalStateActorAgent` and run it on e.g. iPhone 11 Pro simulator.
Select the target `EmergencyStatActorAgent` and run it on e.g. iPhone 11 Pro Max simulator.

You can choose the simulators/devices by your preference, the example will also work
between simulators and physical devices.

Now you can select the operating state and strategy on `SourcesAgent` application and later
publish IoValue event with an example payload. Based on the selected strategy and operating
state, the published IoValues will appear on either `NormalStateActorAgent` application or
`EmergencyStateActorAgent` application.

> **Note**: The broker host of each target app is preconfigured to localhost,
> i.e. `localhost` (see classes `AppDelegate`). This is okay for testing the app
> in the Xcode simulator in combination with a local broker. However, if you
> deploy and run your app on a device, you need to adjust the variable
> `broker` accordingly.