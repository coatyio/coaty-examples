//  Copyright (c) 2019 Siemens AG. Licensed under the MIT License.
//
//  ControlController.swift
//  RemoteOperations
//

import CoatySwift
import Foundation
import RxSwift

/// A Coaty controller that invokes remote operations to control lights.
class ControlController: Controller {
    
    func switchLights(contextFilter: ContextFilter,
                      onOff: Bool,
                      luminosity: Double,
                      rgba: ColorRGBA,
                      switchTime: Int) {
        // Cancel any pending response of the previous switchLights invocation
        // by unsubscribing from the Call event.
        self.disposeBag = DisposeBag()
        
        let parameters: [String: AnyCodable] = ["on": .init(onOff),
                                                "color": .init(rgba),
                                                "luminosity": .init(luminosity),
                                                "switchTime": .init(switchTime)]
        
        let switchLightOperation = SwitchLightOperations.lightControlOperation.rawValue
        let callEvent = try! CallEvent.with(operation: switchLightOperation,
                                            parameters: parameters,
                                            filter: contextFilter)
        
        logConsole(source: self.registeredName,
                   message: "lightSwitchOperation called with params \(PayloadCoder.encode(parameters))",
                   eventName: "Call",
                   eventDirection: .Out)
        
        self.communicationManager
            .publishCall(callEvent)
            .subscribe(onNext: { returnEvent in
                if let result = returnEvent.data.result {
                    logConsole(source: self.registeredName, message: "lightSwitchOperation returned: \(result)", eventName: "Return", eventDirection: .In)
                }
                
                if let error = returnEvent.data.error {
                    logConsole(source: self.registeredName, message: "lightSwitchOperation errored: \(error)", eventName: "Return", eventDirection: .In)

                }
        }).disposed(by: disposeBag)
    }
}
