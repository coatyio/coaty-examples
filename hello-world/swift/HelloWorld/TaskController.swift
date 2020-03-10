//  Copyright (c) 2019 Siemens AG. Licensed under the MIT License.
//
//  TaskController.swift
//  HelloWorld
//

import Foundation
import CoatySwift
import RxSwift

/// Listens for task requests advertised by the service and carries out assigned tasks.
class TaskController: Controller {
    
    // MARK: - Properties.
    
    /// This is a DispatchQueue for this particular controller that handles
    /// asynchronous workloads, such as when we wait for a reply on our task offer.
    private var taskControllerQueue = DispatchQueue(label: "com.helloWorld.taskControllerQueue",
                                                    qos: .userInteractive)
    
    // MARK: - Thread safety measures for working on tasks.
    
    /// A mutex lock managing the access to the `isBusy` variable.
    private let mutex = DispatchSemaphore(value: 1)
    
    /// Indicates whether the TaskController is currently working on a task already.
    private var isBusy: Bool = false
    
    // MARK: - Configurable Controller options.
    
    /// Minimum amount of time in milliseconds until an offer is sent.
    private var minTaskOfferDelay = 0
    
    /// Minimum amount of time in milliseconds until a task is completed.
    private var minTaskDuration = 0
    
    /// Timeout for the query-retrieve event in milliseconds.
    private var queryTimeout = 1000
    
    // MARK: - Configurable Common options.
    
    private var clientUserId: CoatyUUID? {
        if let clientUser = self.runtime.commonOptions?.extra["clientUser"] as? User {
            return clientUser.objectId
        }
        return nil
    }
    
    // MARK: - Controller lifecycle methods.

    override func onInit() {
        
        // Initialize controller options.
        if let minTaskOfferDelay = self.options?.extra["minTaskOfferDelay"] as? Int {
            self.minTaskOfferDelay = minTaskOfferDelay
        }
        if let minTaskDuration = self.options?.extra["minTaskDuration"] as? Int {
            self.minTaskDuration = minTaskDuration
        }
        if let queryTimeout = self.options?.extra["queryTimeout"] as? Int {
            self.queryTimeout = queryTimeout
        }
        
        setBusy(false)
    }
    
    override func onCommunicationManagerStarting() {
        super.onCommunicationManagerStarting()
        
        // Setup subscriptions.
        try? observeAdvertiseRequests()
        
        print("# Client User ID: \(self.clientUserId?.string ?? "-")")
    }
    
    // MARK: Application logic.
    
    /// Observe Advertise events for the objectType of `HelloWorldTask`.
    /// When a HelloWorldTask Advertise event is received, handle it via the `handleRequests`
    /// method.
    private func observeAdvertiseRequests() throws {

        #if DYNAMIC
        
        // Received task objects are decoded as instances of core type class `Task`,
        // not `HelloWorldTask`.
        try communicationManager
            .observeAdvertise(withObjectType: "com.helloworld.Task")
            .compactMap { advertiseEvent in
                advertiseEvent.data.object as? Task
            }
            .filter { task in
                task.status == .request
            }
            .subscribe(onNext: { task in
                self.handleRequests(request: task)
            }).disposed(by: self.disposeBag)
        
        #else
        
        // Received task objects are decoded as instances of class `HelloWorldTask`.
        try communicationManager
            .observeAdvertise(withObjectType: HelloWorldTask.objectType)
            .compactMap { advertiseEvent in
                advertiseEvent.data.object as? HelloWorldTask
            }
            .filter { task in
                task.status == .request
            }
            .subscribe(onNext: { task in
                self.handleRequests(request: task)
            }).disposed(by: self.disposeBag)
        
        #endif

    }
    
    /// This methods sends an Update event to the Service in order to make an offer to carry out a task.
    /// If it receives back a Complete event that matches its own client user ID, this means it has won the offer
    /// and can fulfill the task. The task will then be carried out in the `accomplishTask`method.
    ///
    /// - Parameter request: The task that was previously advertised by the Service and that needs
    ///                      to be handled.
    private func handleRequests(request: Task) {

        #if DYNAMIC
        
        // Non-core type properties are accessible as of type `Any?` in custom dictionary
        // and must be downcast to their appropriate type.
        guard let urgency = request.custom["urgency"] as? Int else {
            return
        }

        #else
        
        let urgency = (request as! HelloWorldTask).urgency

        #endif
        
        mutex.wait()
        // If we are busy with another task, we will ignore all incoming requests.
        if isBusy {
            logConsole(message: "Request ignored while busy: \(request.name)  [Urgency: \(urgency)]",
                       eventName: "ADVERTISE",
                       eventDirection: .In)
            
            mutex.signal()
            return
        }
        
        isBusy = true
        mutex.signal()

        logConsole(message: "Request considered: \(request.name)  [Urgency: \(urgency)]",
                   eventName: "ADVERTISE",
                   eventDirection: .In)
        
        /// This just simulates a random delay we introduce before we respond to a request.
        let offerDelay = Int.random(in: minTaskOfferDelay..<2*minTaskOfferDelay)
        
        taskControllerQueue.asyncAfter(deadline: .now() + .milliseconds(offerDelay)) {
            
            self.logConsole(message: "Make an offer for request \(request.name)",
                            eventName: "UPDATE",
                            eventDirection: .Out)
            
            // Update the task request: offer to accomplish the task immediately.
            request.dueTimestamp = CoatyTimestamp.nowMillis()
            request.assigneeObjectId = self.clientUserId
            
            // Send the updated task offer out and wait for the first response from a Service.
            try? self.communicationManager.publishUpdate(UpdateEvent.with(object: request))
                .take(1)
                .compactMap { completeEvent in
                    return completeEvent.data.object as? Task
                }
                .subscribe(onNext: { (task) in
                    // If the task has been assigned to our client user ID by the Service,
                    // carry out the task immediately.
                    if task.assigneeObjectId == self.clientUserId {
                        self.logConsole(message: "Offer accepted for request: \(task.name)",
                                        eventName: "COMPLETE",
                                        eventDirection: .In)
                        self.accomplishTask(task: task)
                    } else {
                        // We were not chosen to carry out the task.
                        self.setBusy(false)
                        self.logConsole(message: "Offer rejected for request: \(task.name)",
                                        eventName: "COMPLETE",
                                        eventDirection: .In)
                    }
                }).disposed(by: self.disposeBag)
            }
    }
    
    /// Accomplishes a task after it was assigned to this task controller.
    ///
    /// - Parameter task: the task that should be accomplished.
    private func accomplishTask(task: Task) {
        
        // Update the task status and the modification timestamp.
        task.status = .inProgress
        task.lastModificationTimestamp = CoatyTimestamp.nowMillis()
        
        self.logConsole(message: "Carrying out task: \(task.name)")
        
        // Notify other components that task is now in progress.
        try? communicationManager.publishAdvertise(AdvertiseEvent.with(object: task))
        
        // Calculate random delay to simulate task execution time.
        let taskDelay = Int.random(in: minTaskDuration..<2*minTaskDuration)
        
        taskControllerQueue.asyncAfter(deadline: .now() + .milliseconds(taskDelay)) {
            
            // Update the task object to set its status to "done".
            task.status = .done
            task.doneTimestamp = CoatyTimestamp.nowMillis()
            task.lastModificationTimestamp = task.doneTimestamp
            
            self.logConsole(message: "Completed task: \(task.name)",
                            eventName: "ADVERTISE",
                            eventDirection: .Out)
            
            // Notify other components that task has been completed.
            try? self.communicationManager.publishAdvertise(AdvertiseEvent.with(object: task))
            
            // Send out query to get all available snapshots of the task object.
            
            self.logConsole(message: "Snapshot by parentObjectId: \(task.name)",
                            eventName: "QUERY",
                            eventDirection: .Out)
            
            // Note that the queried snapshots may or may not include the latest
            // task snapshot with task status "Done", because the task snaphot
            // of the completed task may or may not have been stored in the
            // database before the query is executed. A proper implementation
            // should use an Update-Complete event to advertise task status
            // changes and await the response before querying snapshots.
            let queryEvent = self.createSnapshotQuery(forTask: task)
            
            self.communicationManager.publishQuery(queryEvent)
                .take(1)
                .timeout(.milliseconds(self.queryTimeout),
                         scheduler: SerialDispatchQueueScheduler(
                            queue: self.taskControllerQueue,
                            internalSerialQueueName: "com.helloworld.internalQueryQueue")
                )
                .subscribe(
                    
                    // Handle incoming snapshots.
                    onNext: { (retrieveEvent) in
                        self.logConsole(message: "Snapshots by parentObjectId: \(task.name)",
                                        eventName: "RETRIEVE",
                                        eventDirection: .In)
                        
                        self.logHistorian(retrieveEvent.data.objects as! [Snapshot])
                    },
                    
                    // Handle timeout error if no response has been received
                    // within the given period of time.
                    onError: { _ in
                        print("Failed to retrieve snapshot objects.")
                    })
                .disposed(by: self.disposeBag)
            
            // Task was accomplished, further incoming task requests can be handled again.
            self.setBusy(false)
        }
    }
    
    // MARK: - Event creation methods.
    
    /// Builds a query that asks for snapshots of the provided task object.
    ///
    /// - Parameter task: the tasks that we are interested in.
    /// - Returns: a Query event.
    private func createSnapshotQuery(forTask task: Task) -> QueryEvent {
        
        // Setup the object filter to match on the `parentObjectId` and sort the results by the
        // creation timestamp.
        let objectFilter = try? ObjectFilter.buildWithCondition {
            let objectId = AnyCodable(task.objectId)
            $0.condition = ObjectFilterCondition(property: .init("parentObjectId"),
                                                 expression: .init(filterOperator: .Equals, op1: objectId))
            $0.orderByProperties = [OrderByProperty(properties: .init("creationTimestamp"), sortingOrder: .Desc)]
        }
        
        return QueryEvent.with(coreTypes: [.Snapshot], objectFilter: objectFilter)
    }
    
    // MARK: Utilities.
    
    private enum Direction {
        case In
        case Out
    }
    
    /// Pretty printing for event flow.
    ///
    /// - Parameters:
    ///   - message: the text that is displayed as description.
    ///   - eventName: the name of the event type (optional).
    ///   - eventDirection: either in or out.
    private func logConsole(message: String, eventName: String? = nil, eventDirection: Direction = .In) {
        var output = eventName != nil ? (eventDirection == .Out ? "<- " : "-> ") : "   "
        output += (eventName ?? "") + String(repeating: " ", count: 11 - (eventName?.count ?? 0))
        output += "| \(message)"
        print(output)
    }
    
    /// Pretty printing for snapshots.
    ///
    /// - Parameter snapshots: the snapshots we want to print.
    private func logHistorian(_ snapshots: [Snapshot]) {
        print("#############################")
        print("# Snapshots retrieved: \(snapshots.count)")
        snapshots.forEach {
            if let task = $0.object as? Task {
                print("# timestamp: \(task.creationTimestamp)  assigneeObjectId: \(task.assigneeObjectId?.string ?? "-" + String(repeating: " ", count: 35))  status: \(task.status)")
            }
        }
        
        print("#############################\n")
    }
    
    /// Thread-safe setter for `isBusy`
    ///
    /// - Parameter to: value that `isBusy` should be set to.
    private func setBusy(_ to: Bool) {
        mutex.wait()
        isBusy = to
        mutex.signal()
    }
}
