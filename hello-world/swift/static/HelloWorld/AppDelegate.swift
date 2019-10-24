//  Copyright (c) 2019 Siemens AG. Licensed under the MIT License.
//
//  AppDelegate.swift
//  HelloWorld
//

import UIKit
import CoatySwift

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    let enableSSL = false
    let brokerIp = "127.0.0.1"
    let brokerPort = 1883
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        
        // Set starting point for application
        window = UIWindow(frame: UIScreen.main.bounds)
        let vc = HelloWorldExampleViewController()
        window?.rootViewController = vc
        window?.makeKeyAndVisible()
        
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
        let components = Components(controllers: ["TaskController": TaskController<HelloWorldObjectFamily>.self])

        guard let configuration = createHelloWorldConfiguration() else {
            print("Invalid configuration! Please check your options.")
            return
        }
        
        // Resolve your components with the given configuration and get your CoatySwift
        // application up and running.
        // Important: You need to specify clearly which Object Family you are going to use.
        // More details about what an ObjectFamily does can be found
        // in `HelloWorldObjectFamily.swift`.
        _ = Container.resolve(components: components,
                              configuration: configuration,
                              objectFamily: HelloWorldObjectFamily.self)
    }
    
    /// Creates a basic configuration file for your HelloWorld application.
    private func createHelloWorldConfiguration() -> Configuration? {
           return try? .build { config in
               
               // This part defines the associated user (aka the identity associated with this client).
               config.common = CommonOptions()
               config.common?.associatedUser = User(name: "ClientUser",
                                                    names: ScimUserNames(familyName: "ClientUser",
                                                                         givenName: ""),
                                                    objectType: CoatyObjectFamily.user.rawValue,
                                                    objectId: CoatyUUID())
               
               // Adjusts the logging level of CoatySwift messages.
               config.common?.logLevel = .debug
               
               // Here, we define that the TaskController should advertise its identity as soon as
               // it gets online.
               config.controllers = ControllerConfig(
                   controllerOptions: ["TaskController": ControllerOptions(shouldAdvertiseIdentity: true)])
               
               // Define the communication-related options, such as the Ip address of your broker and
               // the port it exposes, and your own mqtt client Id. Also, make sure
               // to immediately connect with the broker.
               let mqttClientOptions = MQTTClientOptions(host: brokerIp,
                                                         port: UInt16(brokerPort),
                                                         enableSSL: enableSSL)
               config.communication = CommunicationOptions(mqttClientOptions: mqttClientOptions,
                                                           identity: ["name": "Client"],
                                                           shouldAutoStart: true)
               
               // The communicationManager will also advertise its identity upon connection to the
               // mqtt broker.
               config.communication?.shouldAdvertiseIdentity = true
               
           }
    }
}

