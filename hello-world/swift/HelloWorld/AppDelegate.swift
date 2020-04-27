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
    var container: Container?

    let brokerHost = "127.0.0.1"
    let brokerPort = 1883
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
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
    
#if DYNAMIC
        // In the dynamic scheme no Swift classes are defined for custom Coaty object types.
        let customObjectTypes: [CoatyObject.Type] = []
#else
        // In the non-dynamic normal scheme Swift classes are defined for custom Coaty object types.
        let customObjectTypes = [HelloWorldTask.self]
#endif
        
        // Register controllers and custom object types.
        let components = Components(controllers: ["TaskController": TaskController.self],
                                    objectTypes: customObjectTypes)

        // Create a configuration.
        guard let configuration = createHelloWorldConfiguration() else {
            print("Invalid configuration! Please check your options.")
            return
        }
        
        // Resolve your components with the given configuration and
        // get your CoatySwift controllers up and running.
        container = Container.resolve(components: components,
                                      configuration: configuration)
    }
    
    /// Creates a configuration for the container.
    private func createHelloWorldConfiguration() -> Configuration? {
           return try? .build { config in
               
            config.common = CommonOptions()
            
            // Adjusts the logging level of CoatySwift messages, which is especially
            // helpful if you want to test or debug applications (default is .error).
            config.common?.logLevel = .info
            
            // Configure an expressive `name` of the container's identity here.
            config.common?.agentIdentity = ["name": "Client"]
            
            // Associate a distinct user with each client agent.
            config.common?.extra = ["clientUser": User(name: "Client User",
                                                       names: ScimUserNames(familyName: "ClientUser",
                                                                            givenName: ""),
                                                       objectType: User.objectType,
                                                       objectId: CoatyUUID())]
               
            // Here, we define configuration options for the TaskController.
            config.controllers = ControllerConfig(
                controllerOptions: ["TaskController":
                    ControllerOptions(extra: [
                        
                        // Minimum amount of time in milliseconds until an offer is sent.
                        "minTaskOfferDelay": 2000,
                        
                        // Minimum amount of time in milliseconds until a task is completed.
                        "minTaskDuration": 5000,
                        
                        // Timeout for the query-retrieve event in milliseconds.
                        "queryTimeout": 5000
                        
                    ])
            ])
               
            // Define communication-related options, such as the host address of your broker
            // and the port it exposes. Also, make sure to immediately connect with the broker,
            // indicated by `shouldAutoStart: true`.
            let mqttClientOptions = MQTTClientOptions(host: brokerHost,
                                                      port: UInt16(brokerPort))
            config.communication = CommunicationOptions(namespace: "com.helloworld",
                                                        mqttClientOptions: mqttClientOptions,
                                                        shouldAutoStart: true)
        }
    }
}
