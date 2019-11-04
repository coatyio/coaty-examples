//  Copyright (c) 2019 Siemens AG. Licensed under the MIT License.
//
//  AppDelegate.swift
//  DynamicHelloWorld
//

import UIKit
import CoatySwift

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var window: UIWindow?
    var container: DynamicContainer?
    let enableSSL = false
    let brokerIp = "127.0.0.1"
    let brokerPort = 1883
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        launchContainer()
        
        return true
    }
    
    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
    }
    
    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }
    
    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
    }
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }
    
    func applicationWillTerminate(_ application: UIApplication) {
        // Shutdown container in order to trigger a graceful deadvertise of all advertised components.
        container?.shutdown()
    }

    // MARK: - Coaty Container setup methods.

    /// This method sets up the Coaty container necessary to run our application.
    private func launchContainer() {
        // Instantiate controllers.
        let dynamicComponents = DynamicComponents(controllers:
            ["DynamicTaskController": DynamicTaskController.self])
        
        guard let configuration = createHelloWorldConfiguration() else {
            print("Invalid configuration! Please check your options.")
            return
        }
        
        // Resolve your components with the given configuration and get your CoatySwift
        // application up and running.
        container = DynamicContainer.resolve(components: dynamicComponents,
                                             configuration: configuration)
        
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
                controllerOptions: ["DynamicTaskController": ControllerOptions(shouldAdvertiseIdentity: true)])
            
            // Define the communication-related options, such as the Ip address of your broker and
            // the port it exposes, and your own mqtt client Id. Also, make sure
            // to immediately connect with the broker.
            
            let mqttClientOptions = MQTTClientOptions(host: brokerIp,
                                                      port: UInt16(brokerPort),
                                                      enableSSL: enableSSL,
                                                      shouldTryMDNSDiscovery: false)
            config.communication = CommunicationOptions(mqttClientOptions: mqttClientOptions,
                                                        identity: ["name": "Client"],
                                                        shouldAutoStart: true)
            
            // The communicationManager will also advertise its identity upon connection to the
            // mqtt broker.
            config.communication?.shouldAdvertiseIdentity = true
            
        }
    }
    
    
}

