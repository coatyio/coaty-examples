//  Copyright (c) 2019 Siemens AG. Licensed under the MIT License.
//
//  LightController.swift
//  RemoteOperations
//

import Foundation
import CoatySwift

/// Delegate to trigger changes of a light.
protocol LightControlDelegate {
    func switchLight(_ on: Bool, _ color: ColorRGBA, _ luminosity: Double)
}

/// A Coaty controller that manages a single light with its context and observes
/// Call requests for remote operations to change the light's status.
///
/// For communicating light status changes to the associated light, the controller provides the
/// `LightControlDelegate`.
class LightController: Controller {
    
    /// MARK: Public attributes.
    
    public var delegate: LightControlDelegate?
    public var lightContext: LightContext!
    public var light: Light!
    
    // MARK: Private attributes.
    
    /// This is a DispatchQueue for this particular controller that handles
    /// asynchronous workloads, such as when we wait for the delay of the `switchTime`
    private var lightControllerQueue = DispatchQueue(label: "coaty.examples.remoteops.lightControllerQueue")
    private var lightStatus: LightStatus!
    
    // MARK: Lifecycle methods.
    
    override func onInit() {
        super.onInit()
        
        // Set up light status from configuration options.
        let optionColor = self.options?.extra["lightColor"] as! (Int, Int, Int, Double)
        let initialColor = ColorRGBA(
            r: optionColor.0,
            g: optionColor.1,
            b: optionColor.2,
            a: optionColor.3)
        self.light = Light(isDefect: false)
        self.lightStatus = LightStatus(
            on: self.options?.extra["lightOn"] as! Bool,
            luminosity: self.options?.extra["lightLuminosity"] as! Double,
            color: initialColor)
        self.lightStatus.parentObjectId = self.light.parentObjectId
        
        // Set up context from configuration options.
        self.lightContext = LightContext(
            building: self.options?.extra["building"] as! Int,
            floor: self.options?.extra["floor"] as! Int,
            room: self.options?.extra["room"] as! Int)
    }
    
    override func onCommunicationManagerStarting() {
        super.onCommunicationManagerStarting()
        observeCallEvents()
    }
    
    // MARK: Application logic.
    
    /// Observe incoming call events that match the operationId of the lightSwitchOperation that is
    /// offered by this controller.
    private func observeCallEvents() {
        let lightSwitchOperation = SwitchLightOperations.lightControlOperation.rawValue
        try? self.communicationManager.observeCall(operationId: lightSwitchOperation, context: self.lightContext)
            .subscribe(onNext: { callEvent in
                
                let params = callEvent.data.parameterDictionary
                logConsole(source: self.registeredName,
                           message: "lightSwitchOperation received with params \(PayloadCoder.encode(params))",
                           eventName: "Call",
                           eventDirection: .In)
                
                // Try to cast the received parameters to the expected value types.
                let on = callEvent.data.getParameterByName(name: "on") as? Bool
                let color = callEvent.data.getParameterByName(name: "color")
                let colorRGBA = self.createColorRGBA(color)
                let luminosity = self.toDouble(callEvent.data.getParameterByName(name: "luminosity"))
                let switchTime = callEvent.data.getParameterByName(name: "switchTime") as? Int
                
                // Perform parameter validation.
                if !self.validateSwitchOpParams(on, colorRGBA, luminosity, switchTime) {
                    // Validation failed, reply with error.
                    let error = ReturnError(code: .invalidParameters, message: .invalidParameters)
                    let executionInfo: ExecutionInfo = ["lightId": self.light.objectId,
                                                        "triggerTime": CoatyTimestamp.nowMillis()]
                    let event = ReturnEvent.with(error: error, executionInfo: executionInfo)
                    
                    logConsole(source: self.registeredName, message: "Invalid parameters.", eventName: "Return", eventDirection: .Out)
                    callEvent.returned(returnEvent: event)
                    return
                }
                
                // Respond with a custom error if the light is currently defect.
                if self.light.isDefect {
                    let error = ReturnError(code: 1, message: "Light is defect")
                    let executionInfo: ExecutionInfo = ["lightId": self.light.objectId,
                                                        "triggerTime": CoatyTimestamp.nowMillis()]
                    let event = ReturnEvent.with(error: error, executionInfo: executionInfo)
                    callEvent.returned(returnEvent: event)
                    logConsole(source: self.registeredName, message: "Light is defect", eventName: "Return", eventDirection: .Out)
                    return
                }
                
                // Everything went alright, update the light status and call the delegate.
                self.lightControllerQueue.asyncAfter(deadline: .now() + .milliseconds(switchTime!)) {
                    self.updateLightStatus(on!, colorRGBA!, luminosity!)
                    
                    // Make sure to run UI code on the main thread.
                    DispatchQueue.main.async {
                        self.delegate?.switchLight(on!, colorRGBA!, luminosity!)
                    }
                    
                    // Return successful result to the caller.
                    let result: ReturnResult = .init(self.lightStatus!.on)
                    let executionInfo: ExecutionInfo = ["lightId": self.light.objectId,
                                                        "triggerTime": CoatyTimestamp.nowMillis()]
                    let event = ReturnEvent.with(result: result,
                                                 executionInfo: executionInfo)
                    
                    logConsole(source: self.registeredName, message: "Switched successfully", eventName: "Return", eventDirection: .Out)
                    callEvent.returned(returnEvent: event)
                }
            }).disposed(by: disposeBag)
    }
    
    // MARK: Utility methods.
    private func createColorRGBA(_ color: Any?) -> ColorRGBA? {
        guard color != nil, let color = color! as? [Any] else {
            return nil
        }
        
        let red = color[0] as? Int
        let green = color[1] as? Int
        let blue = color[2] as? Int
        let alpha = toDouble(color[3])
        
        guard red != nil, green != nil, blue != nil, alpha != nil else {
            return nil
        }
        return ColorRGBA(r: red!, g: green!, b: blue!, a: alpha!)
    }
    
    private func toDouble(_ any: Any?) -> Double? {
        if let double = any as? Double {
            return double
        }
        
        if let int = any as? Int {
            return Double(int)
        }
        
        return nil
    }
    
    private func validateSwitchOpParams(_ on: Bool?,
                                        _ colorRGBA: ColorRGBA?,
                                        _ luminosity: Double?,
                                        _ switchTime: Int?) -> Bool {
        guard
            on != nil,
            colorRGBA != nil,
            // For testing purposes, yield an error if color is black.
            !(colorRGBA!.r == 0 && colorRGBA!.g == 0 && colorRGBA!.b == 0),
            luminosity != nil,
            luminosity! >= 0,
            luminosity! <= 1,
            switchTime != nil,
            switchTime! >= 0
            else {
            return false
        }
        
        return true
    }
    
    private func updateLightStatus(_ on: Bool, _ color: ColorRGBA, _ luminosity: Double) {
        self.lightStatus.on = on
        self.lightStatus.color = color
        self.lightStatus.luminosity = luminosity
    }

}
