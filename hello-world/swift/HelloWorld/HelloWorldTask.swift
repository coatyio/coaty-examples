//  Copyright (c) 2019 Siemens AG. Licensed under the MIT License.
//
//  HelloWorldTask.swift
//  HelloWorld
//

import Foundation
import CoatySwift

#if !DYNAMIC

/// Represents a Hello World task or task request.
final class HelloWorldTask: Task {
    
    // MARK: - Class registration.

    override class var objectType: String {
        return register(objectType: "com.helloworld.Task", with: self)
    }
    
    // MARK: - Properties.
    
    /// Level of urgency of the HelloWorldTask.
    public var urgency: HelloWorldTaskUrgency
    
    // MARK: - Initializers.
    
    public init(objectId: CoatyUUID,
                name: String,
                creatorId: CoatyUUID,
                creationTimestamp: Double,
                status: TaskStatus,
                urgency: HelloWorldTaskUrgency,
                lastModificationTimestamp: Double? = nil,
                dueTimestamp: Double? = nil,
                doneTimestamp: Double? = nil,
                requirements: [String: Any]? = nil,
                description: String? = nil,
                assigneeObjectId: CoatyUUID? = nil) {
        self.urgency = urgency
        super.init(creatorId: creatorId,
                   creationTimestamp: creationTimestamp,
                   status: status,
                   name: name,
                   objectType: HelloWorldTask.objectType,
                   objectId: objectId,
                   lastModificationTimestamp: lastModificationTimestamp,
                   dueTimestamp: dueTimestamp,
                   doneTimestamp: doneTimestamp,
                   requirements: requirements,
                   description: description,
                   assigneeObjectId: assigneeObjectId)
        
    }

    // MARK: Codable methods.
    
    enum CodingKeys: String, CodingKey {
        case urgency
    }
    
    required init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        self.urgency = try container.decode(HelloWorldTaskUrgency.self, forKey: .urgency)
        try super.init(from: decoder)
    }
    
    override func encode(to encoder: Encoder) throws {
        try super.encode(to: encoder)
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(urgency, forKey: .urgency)
    }
}

/// Defines urgency levels for HelloWorld tasks.
enum HelloWorldTaskUrgency: Int, Codable {
    case low = 0
    case medium = 1
    case high = 2
    case critical = 3
}

#endif
