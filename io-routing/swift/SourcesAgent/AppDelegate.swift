//  Copyright (c) 2020 Siemens AG. Licensed under the MIT License.
//
//  AppDelegate.swift
//  SourcesAgent
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

// Custom subclass of IoContext extending it by an additional property `operatingState`.
class TemperatureIoContext: IoContext {
    var operatingState: String
    
    override class var objectType: String {
        return register(objectType: "coaty.TemperatureIoContext", with: self)
    }
    
    init(coreType: CoreType, objectType: String, objectId: CoatyUUID, name: String, operatingState: String) {
        self.operatingState = operatingState
        super.init(coreType: coreType, objectType: objectType, objectId: objectId, name: name)
    }
    
    enum CodingKeys: String, CodingKey {
        case operatingState
    }
    
    required init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        self.operatingState = try container.decode(String.self, forKey: .operatingState)
        try super.init(from: decoder)
    }
    
    override func encode(to encoder: Encoder) throws {
        try super.encode(to: encoder)
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(operatingState, forKey: .operatingState)
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Launch a coaty container three IOSources: One for each Backpressure strategy.
        // Initialize IoSource for .None Strategy.
        let source1 = IoSource(valueType: "coaty.test.Temperature[Celsius]",
                               updateStrategy: .None,
                               name: "Temperature Source 1",
                               objectType: CoreType.IoSource.rawValue,
                               objectId: CoatyUUID(uuidString: "c547e5cd-ef99-4ccd-b109-fc472fc2d421")!)
        
        // Initialize IoSource for .Sample Strategy.
        let source2 = IoSource(valueType: "coaty.test.Temperature[Celsius]",
                               updateStrategy: .Sample,
                               updateRate: 5000,
                               name: "Temperature Source 2",
                               objectType: CoreType.IoSource.rawValue,
                               objectId: CoatyUUID(uuidString: "2e9949f7-a8ef-435b-88a9-527c0a9414c3")!)
        
        // Initialize IoSource for .Throttle Strategy.
        let source3 = IoSource(valueType: "coaty.test.Temperature[Celsius]",
                               updateStrategy: .Throttle,
                               updateRate: 5000,
                               name: "Temperature Source 3",
                               objectType: CoreType.IoSource.rawValue,
                               objectId: CoatyUUID(uuidString: "200cc37b-df20-4425-a16f-5c0b42d04dbb")!)
        
        // Add the initialized sources to the Model to make them accessible from ContentView.
        Model.ioSources["None"] = source1
        Model.ioSources["Sample"] = source2
        Model.ioSources["Throttle"] = source3
        
        // Configure the context
        let ioContext = TemperatureIoContext(coreType: .IoContext,
                                             objectType: "coaty.TemperatureIoContext",
                                             objectId: CoatyUUID(uuidString: "b61740a6-95d7-4d1a-8be5-53f3aa1e0b79")!,
                                             name: "TemperatureMeasurement",
                                             operatingState: "normal")
        
        // Add the initialized context to the Model to make it accessible from ContentView.
        // In order to get access to the context, a coaty agent might also send a Discover Event with core type .IoContext .
        Model.ioContext = ioContext
        
        // Configure the rules used by the RuleBasedIoRouter.
        let condition1: IoRoutingRuleConditionFunc = { (source, sourceNode, actor, actorNode, context, router) -> Bool in
            guard let operatingStateResponsibility = actorNode.characteristics?["isResponsibleForOperatingState"] as? String,
                let context = context as? TemperatureIoContext else {
                return false
            }
            return operatingStateResponsibility == "normal" && context.operatingState == "normal"
        }
        
        let condition2: IoRoutingRuleConditionFunc = { (source, sourceNode, actor, actorNode, context, router) -> Bool in
            guard let operatingStateResponsibility = actorNode.characteristics?["isResponsibleForOperatingState"] as? String,
                let context = context as? TemperatureIoContext else {
                return false
            }
            return operatingStateResponsibility == "emergency" && context.operatingState == "emergency"
        }
        
        let rules: [IoAssociationRule] = [
            IoAssociationRule(name: "Route temperature sources to normal actors if operating state is normal",
                              valueType: "coaty.test.Temperature[Celsius]",
                              condition: condition1),
            IoAssociationRule(name: "Route temperature sources to emergency actors if operating state is emergency",
                              valueType: "coaty.test.Temperature[Celsius]",
                              condition: condition2)
        ]
        
        // Configure the router.
        // RuleBasedIoRouter requires ioContext and rules to be configured in ControllerConfig extra property.
        // If those entries are not configured, the framework will throw an error.
        let routerOptions = ControllerOptions(extra: ["ioContext" : ioContext, "rules": rules])
        
        // Controller options are always mapped by the controller class name as String.
        let controllers = ControllerConfig(controllerOptions: ["RuleBasedIoRouter": routerOptions])
        
        // Create an IoNode: initialize ioNodeDefinition consisting of all three sources.
        let ioNodeDefinition = IoNodeDefinition(ioSources: [source1, source2, source3],
                                                ioActors: nil,
                                                characteristics: nil)
        
        // Set the IoNodeDefinition in the CommonOptions.
        let commonOptions = CommonOptions(ioContextNodes: ["TemperatureMeasurement" : ioNodeDefinition],
                                          logLevel: .info)
        
        // Configure the communication options.
        let mqttClientOptions = MQTTClientOptions(host: broker,
                                                  port: UInt16(port))
        let communicationOptions = CommunicationOptions(namespace: "com.integration",
                                                        shouldEnableCrossNamespacing: nil,
                                                        mqttClientOptions: mqttClientOptions,
                                                        shouldAutoStart: true,
                                                        useProtocolCompliantClientId: nil)
        
        // Create the final agent configuration.
        let configuration = Configuration(common: commonOptions,
                                          communication: communicationOptions,
                                          controllers: controllers,
                                          databases: nil)
        
        
        // Create the Components object. Make sure to register the custom IoContext subclass by including it in the objectTypes array.
        let components = Components(controllers: ["IoSourceController": IoSourceController.self,
                                                   "RuleBasedIoRouter": RuleBasedIoRouter.self],
                                    objectTypes: [TemperatureIoContext.self])
        
        // Resolve the coaty container.
        coatyContainer = Container.resolve(components: components,
                                           configuration: configuration)
        
        return true
    }
}


