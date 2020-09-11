//  Copyright (c) 2020 Siemens AG. Licensed under the MIT License.
//
//  Model.swift
//  SourcesAgent
//
//

import Foundation
import CoatySwift

enum Model {
    // Dictionary from Strategy name ("None", "Sample", "Throttle") to a respective IoSource realizing this backpressure strategy.
    static var ioSources: [String: IoSource] = [:]
    
    // Current ioContext defined in the application.
    static var ioContext: TemperatureIoContext?
}

