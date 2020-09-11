//  Copyright (c) 2020 Siemens AG. Licensed under the MIT License.
//
//  AppDelegate.swift
//  EmergencyStateActorAgent
//
//

import UIKit
import CoatySwift

// Keep a global reference to the coaty container so that it stays alive during the whole runtime of the app.
var coatyContainer: Container?
// Address of the MQTT broker.
var broker: String = "localhost"
// Port of the MQTT broker.
var port: Int = 1883

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Launch a coaty container with an emergency state actor.
        // Temperature Actor 2 (Emergency operating state).
        let actor2 = IoActor(valueType: "coaty.test.Temperature[Celsius]",
                             updateRate: 5000,
                             name: "Temperature Actor 2",
                             objectType: CoreType.IoActor.rawValue,
                             objectId: CoatyUUID(uuidString: "a60a74f3-3d26-446f-a358-911867544944")!)
        
        // Add the initialized actor to the model to make it accessible from ContentView.
        Model.ioActors.append(actor2)
        
        // Configuration an IONode for this actor
        let ioNodeDefinition = IoNodeDefinition(ioSources: nil,
                                                ioActors: [actor2],
                                                characteristics: ["isResponsibleForOperatingState": "emergency"])
        
        let ioContextNodes = ["TemperatureMeasurement": ioNodeDefinition]
        let commonOptions = CommonOptions(ioContextNodes: ioContextNodes,
                                          logLevel: .debug)
        
        // Configure the communication options.
        let mqttClientOptions = MQTTClientOptions(host: broker,
                                                  port: UInt16(port))
        
        let communicationOptions = CommunicationOptions(namespace: "com.integration",
                                                        shouldEnableCrossNamespacing: nil,
                                                        mqttClientOptions: mqttClientOptions,
                                                        shouldAutoStart: true,
                                                        useProtocolCompliantClientId: nil)
        
        let controllers = ControllerConfig(controllerOptions: [ : ])
        
        // Create the Components object.
        let components = Components(controllers: [ "IoActorController" : IoActorController.self ],
                                    objectTypes: [])
        
        // Create the final agent configuration.
        let configuration = Configuration(common: commonOptions,
                                          communication: communicationOptions,
                                          controllers: controllers,
                                          databases: nil)
        
        coatyContainer = Container.resolve(components: components,
                                           configuration: configuration)
        
        return true
    }

    // MARK: UISceneSession Lifecycle

    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        // Called when a new scene session is being created.
        // Use this method to select a configuration to create the new scene with.
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
        // Called when the user discards a scene session.
        // If any sessions were discarded while the application was not running, this will be called shortly after application:didFinishLaunchingWithOptions.
        // Use this method to release any resources that were specific to the discarded scenes, as they will not return.
    }


}
