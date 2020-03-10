//  Copyright (c) 2019 Siemens AG. Licensed under the MIT License.
//
//  Util.swift
//  RemoteOperations
//

import Foundation

internal enum Direction {
    case In
    case Out
}

/// Pretty printing for event flow.
///
/// - Parameters:
///   - source: the name of the source controller
///   - message: the text that is displayed as description.
///   - eventName: typically the core type.
///   - eventDirection: either in or out.
internal func logConsole(source: String, message: String, eventName: String, eventDirection: Direction = .In) {
    let direction = eventDirection == .Out ? "->" : "<-"
    print("\(source) \t \(direction) \(eventName) \t| \(message)")
}
