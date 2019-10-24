//  Copyright (c) 2019 Siemens AG. Licensed under the MIT License.
//
//  AppDelegate.swift
//  CoatySwift_Example
//
//

import UIKit
import CoatySwift

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    
    // MARK: Configurable options.
    
    let brokerIp = "127.0.0.1"
    let brokerPort = 1883
    
    var container: Container<SwitchLightObjectFamily>? = nil
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        launchContainer()
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
    
    // MARK: - Coaty Container setup methods.

    /// This method sets up the Coaty container necessary to run our application.
    private func launchContainer() {
        // Instantiate controllers.
        let components = Components(controllers: [
            "ControlController": ControlController<SwitchLightObjectFamily>.self,
            "LightController": LightController<SwitchLightObjectFamily>.self
            ])
        
        guard let configuration = createSwitchLightConfiguration() else {
            print("Invalid configuration! Please check your options.")
            return
        }
        
        // Resolve your components with the given configuration and get your CoatySwift
        // application up and running.
        // Important: You need to specify clearly which Object Family you are going to use.
        // More details about what an ObjectFamily does can be found
        // in `SwitchLightObjectFamily.swift`.
        self.container = Container.resolve(components: components,
                                           configuration: configuration,
                                           objectFamily: SwitchLightObjectFamily.self)
    }

    /// Creates a basic configuration file for your LightSwitch application.
    private func createSwitchLightConfiguration() -> Configuration? {
        return try? .build { config in
            
            // Adjusts the logging level of CoatySwift messages.
            config.common = CommonOptions()
            config.common?.logLevel = .debug
            
            // Here, we define that the ControlController should advertise its identity as soon as
            // it gets online.
            config.controllers = ControllerConfig(
                controllerOptions: [
                    "ControlController": ControllerOptions(shouldAdvertiseIdentity: true),
                    "LightController": ControllerOptions(shouldAdvertiseIdentity: true)
                ])
            
            // Define the communication-related options, such as the Ip address of your broker and
            // the port it exposes, and your own mqtt client Id. Also, make sure
            // to immediately connect with the broker.
            let mqttClientOptions = MQTTClientOptions(host: brokerIp,
                                              port: UInt16(brokerPort),
                                              enableSSL: false)
            config.communication = CommunicationOptions(mqttClientOptions: mqttClientOptions,
                                                        identity: ["name": "LightAgent"],
                                                        shouldAutoStart: true)
            
            // The communicationManager will also advertise its identity upon connection to the
            // mqtt broker.
            config.communication?.shouldAdvertiseIdentity = true
            
        }
    }

}

