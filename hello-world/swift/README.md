# CoatySwift - Hello World Example

[![Powered by Coaty](https://img.shields.io/badge/Powered%20by-Coaty-FF8C00.svg)](https://coaty.io)
[![Swift](https://img.shields.io/badge/Source%20code-Swift%205-FF4029.svg)](https://developer.apple.com/swift/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Check this example to see an application scenario of the
[CoatySwift](https://github.com/coatyio/coaty-swift) framework in action.

## Table of Contents

* [Introduction](#introduction)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Start-up](#start-up)

## Introduction

Our Hello World example demonstrates the best practice use of Coaty
communication events to discover, distribute, share, and persist information in
a decentralized application. For an overview of the example scenario, take a
look at the [Coaty JavaScript Hello
World](https://github.com/coatyio/coaty-examples/tree/master/hello-world/js#introduction)
project.

In this scenario, the CoatySwift Hello World example application realizes the
functionality of a **Hello World client**. It is fully interoperable with the
Hello World agents running on Coaty JS and and intended to be used along with
them.

## Prerequisites

To build and run the CoatySwift application you need XCode 10.2 or higher.
CoatySwift is available through [CocoaPods](https://cocoapods.org). Ensure you
have installed **at least** version `1.8.4` of CocoaPods, i.e. running `pod
--version` should yield `1.8.4` or higher.

To interoperate with the Coaty JS Hello World agents, install and start up the
Coaty JS Hello World components as explained
[here](https://github.com/coatyio/coaty-examples/tree/master/hello-world/js#installation)
and
[here](https://github.com/coatyio/coaty-examples/tree/master/hello-world/js#start-up).

## Installation

There are two versions of the CoatySwift Hello World example:

* a *static* one that uses the static typesafe object types defined in
  CoatySwift, and
* a *dynamic* one that uses less static and less type safe object types in
  CoatySwift to deal with Coaty objects whose type is not yet known at compile
  time. This feature is currently experimental.

To build either version, just clone this repo and run `pod install` on either
the `hello-world/swift/static` or `hello-world/swift/dynamic` Xcode project
folder, respectively.

## Start-up

Ensure the Coaty JS Hello World components, i.e. broker, service, monitor, and
client(s) have been started.

Open the `xcworkspace` of the static or dynamic project folder in Xcode, then
build and run it. Now, the CoatySwift Hello World client outputs log messages on
the console, identical in format to a Coaty JS Hello World client.

> Note: The broker IP address of the CoatySwift Hello World agent is
> preconfigured to the localhost, i.e. `127.0.0.1` (see class
> `HelloWorldExampleViewController` or `DynamicHelloWorldExampleViewController`,
> respectively).
>
> If you run your Coaty broker on another machine in your network, adjust the
> variable `brokerIp` accordingly.
