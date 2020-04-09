//  Copyright (c) 2019 Siemens AG. Licensed under the MIT License.
//
//  AppDelegate.swift
//  RemoteOperations
//

import UIKit
import CoatySwift

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var container: Container?
    
    // Run the app locally in Xcode simulator.
    let brokerHost = "127.0.0.1"
    
    // To run the app in combination with the Remote Operations example deployed
    // on Github Pages (https://coatyio.github.io/coaty-examples/remote-operations/).
    // use this public broker.
    //
    // let brokerHost = "test.mosquitto.org"
    
    let brokerPort = 1883
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        launchContainer()
        return true
    }
    
    func applicationWillTerminate(_ application: UIApplication) {
        // Terminate container and trigger a graceful Identity deadvertisement.
        container?.shutdown()
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

    // MARK: - Coaty Container setup methods.

    /// This method sets up the Coaty container necessary to run our application.
    private func launchContainer() {
        
        // Register controllers.
        let components = Components(controllers: [
            "ControlController": ControlController.self,
            "LightController": LightController.self
        ])
        
        // Create a configuration.
        guard let configuration = createSwitchLightConfiguration() else {
            print("Invalid configuration! Please check your options.")
            return
        }
        
        // Resolve your components with the given configuration and get
        // your CoatySwift controllers up and running.
        self.container = Container.resolve(components: components,
                                           configuration: configuration)
    }

    /// Creates a configuration for the container.
    private func createSwitchLightConfiguration() -> Configuration? {
        return try? .build { config in
            
            // Adjusts the logging level of CoatySwift messages.
            config.common = CommonOptions()
            
            // Adjusts the logging level of CoatySwift messages, which is especially
            // helpful if you want to test or debug applications (default is .error).
            config.common?.logLevel = .info
            
            // Configure `name` of the container's identity here.
            // Do not change the given name, it is used by Coaty JS light
            // controller to track all active light and control agents.
            config.common?.agentIdentity = ["name": "LightAgent & LightControlAgent"]
            
            // Here, we define initial values for specific options of
            // the light controller and the light control controller.
            config.controllers = ControllerConfig(
                controllerOptions: [
                    // Currently, the initial values for building, floor, and room are fixed
                    // because the UI yet provides no means to adjust them interactively.
                    "LightController": ControllerOptions(extra: [
                        "building" : 33,
                        "floor": 4,
                        "room": 62,
                        "lightOn": false,
                        "lightLuminosity": 1.0,
                        "lightColor": (255, 140, 0, 1.0)
                    ]),
                    // Currently, these initial settings are used for any SwitchLight operation
                    // because the UI yet provides no means to modify them interactively.
                    "ControlController": ControllerOptions(extra: [
                       "initialContextFilterBuildings" : [33],
                       "initialContextFilterFloors" : [4],
                       "initialContextFilterRooms" : [62],
                       "initialOpParamOnOff" : true,
                       "initialOpParamLuminosity" : 0.75,
                       "initialSwitchTime" : 0
                    ])
                ])
            
            // Define communication-related options, such as the host address of your broker
            // and the port it exposes. Also, make sure to immediately connect with the broker,
            // indicated by `shouldAutoStart: true`.
            //
            // Note: Keep alive for the broker connection has been reduced to 10secs to minimize
            // connectivity issues when running with a remote public broker.
            let mqttClientOptions = MQTTClientOptions(host: brokerHost,
                                                      port: UInt16(brokerPort),
                                                      keepAlive: 10)
            config.communication = CommunicationOptions(namespace: "coaty.examples.remoteops",
                                                        mqttClientOptions: mqttClientOptions,
                                                        shouldAutoStart: true)
        }
    }

}

