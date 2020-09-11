//  Copyright (c) 2020 Siemens AG. Licensed under the MIT License.
//
//  ContentView.swift
//  EmergencyStateActorAgent
//
//

import SwiftUI
import CoatySwift

// A struct representing a received io value, conforming to Identifiable, so that it can be displayed in a SwiftUI List
struct ReceivedIoValue: Identifiable {
    var id: CoatyUUID
    let description: String
}

struct ContentView: View {
    @State var isAssociated: Bool = false
    @State var receivedIoValues: [ReceivedIoValue] = []
    @State var isConnectedToBroker: Bool = false
    
    var body: some View {
        NavigationView {
            VStack(alignment: .leading) {
                // Broker connectivity indicator
                HStack {
                    Text("Broker: \(broker):\(port) ")
                    Image(systemName: (isConnectedToBroker ? "circle.fill" : "circle"))
                        .foregroundColor(isConnectedToBroker ? .green : .red)
                }
                
                // Object Id of the associated actor
                Text("ObjectId: \(Model.ioActors.first!.objectId.description)")
                
                // Association status
                HStack {
                    Text("Is associated?")
                    Image(systemName: (isAssociated ? "circle.fill" : "circle"))
                        .foregroundColor(isAssociated ? .green : .red)
                    Spacer()
                }
                
                // List of all received io values. Resets on new ASC event.
                List(self.receivedIoValues) { ioValue in
                    Text(ioValue.description)
                }
                
                Spacer()
                }.navigationBarTitle("Emergency").padding()
        }.onAppear(perform: helper)
    }
    
    private func helper() {
        observeCommunicationState()
        observeIoValues()
        observeAssociationState()
    }
    
    func observeCommunicationState() {
        _ = coatyContainer?.communicationManager?.observeCommunicationState().subscribe(onNext: { state in
            if state == .online {
                self.isConnectedToBroker = true
            } else {
                self.isConnectedToBroker = false
            }
        })
    }
    
    private func observeIoValues() {
        guard let ioActorController = coatyContainer?.getController(name: "IoActorController") as? IoActorController else {
            return
        }
        
        let actor = Model.ioActors.first!
        _ = ioActorController.observeIoValue(actor: actor).subscribe(onNext: { ioValue in
            // Raw values
            if let value = actor.useRawIoValues, value {
                guard let payload = ioValue?.value as? [UInt8] else {
                    return
                }
                
                print(payload)
            } else {
                // JSON encoded values
                guard let payload = ioValue?.value as? [String: String] else {
                    return
                }
                
                self.receivedIoValues.append(ReceivedIoValue(id: .init(), description: payload["payload"]!))
            }
        })
    }
    
    private func observeAssociationState() {
        guard let ioActorController = coatyContainer?.getController(name: "IoActorController") as? IoActorController else {
            return
        }
        
        let actor = Model.ioActors.first!
        _ = ioActorController.observeAssociation(actor: actor).subscribe(onNext: { element in
            // If this actor gets disassociated, clear the list of received io values
            if !element {
                self.receivedIoValues = []
            }
            
            self.isAssociated = element
        })
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
