# CoatySwift - Hello World Example

[![Powered by Coaty 2](https://img.shields.io/badge/Powered%20by-Coaty%202-FF8C00.svg)](https://coaty.io)
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

If you want to install all prerequisites of the example locally on macOS, we
recommend to install PostgreSQL using this [interactive
installer](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).

## Installation

To build the CoatySwift Hello World example, just clone this repo and run `pod
install` on the `hello-world/swift/` Xcode project folder.

This Xcode project contains two versions of the CoatySwift Hello World example,
realized as two separate Xcode build targets:

* `HelloWorld` - default target that defines and registers the object type
  `"com.helloworld.Task"` with a corresponding Swift class named
  `HelloWorldTask` so that custom fields are directly accessible as typesafe
  instance properties, and
* `HelloWorld Dynamic` - target that *only* uses the Coaty core type `Task` to
  represent the object type `"com.helloworld.Task"` so that custom fields are
  accessible in the `custom` instance property in the form of less typesafe
  attribute-value pairs of type `Any`.

The dynamic approach is especially useful if you want to deal with arbitary
Coaty objects whose *object type* is not known when you program your CoatySwift
app. A detailed discussion of this topic can be found
[here](https://coatyio.github.io/coaty-swift/man/developer-guide/#custom-object-types).

## Start-up

Ensure the Coaty JS Hello World components, i.e. broker, service, monitor, and
clients (optional) have been started.

Open the `xcworkspace` of the project folder in Xcode, then build and run it.
Now, the CoatySwift Hello World client interoperates with the other Hello World
components and outputs log messages on the console, identical in format to a
Coaty JS Hello World client.

You can switch between the two build targets by setting the active scheme to
either `HelloWorld` or `HelloWorld Dynamic`.

> **Note**
>
> If you run the `HelloWorld Dynamic` scheme, the `urgency` property
> of a received HelloWorldTask is displayed as a raw Integer value, while in the
> `HelloWorld` scheme it is displayed as an Enum value. This is due to the fact,
> that in the dynamic scheme the task object is decoded as core type `Task` with
> the non-core type property `urgency` decoded in the `custom` dictionary
> property as type `Int` according to the transmitted JSON raw value.
>
> **Note**
>
> The broker host address of the CoatySwift app is preconfigured to
> localhost, i.e. `127.0.0.1` (see class `AppDelegate`). This is okay for
> testing the app in the Xcode simulator in combination with a local broker.
> However, if you deploy and run your app on a device, you need to adjust the
> variable `brokerHost` accordingly.
