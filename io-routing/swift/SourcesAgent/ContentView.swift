//  Copyright (c) 2020 Siemens AG. Licensed under the MIT License.
//
//  ContentView.swift
//  SourcesAgent
//
//

import SwiftUI
import CoatySwift

struct ContentView: View {
    // Possible values: "normal" and "emergency"
    @State var operatingState: String = "normal"
    // Possivle values: "None", "Sample" and "Throttle"
    @State var selectedSourceWithStrategy: String = "None"
    
    @State var isConnectedToBroker: Bool = false
    @State var publishIoValueCounter: Int = 1
    
    var body: some View {
        NavigationView {
            VStack(alignment: .center, spacing: 16) {
                // Broker connectivity indicator
                HStack {
                    Text("Broker: \(broker):\(port) ")
                    Image(systemName: (isConnectedToBroker ? "circle.fill" : "circle"))
                        .foregroundColor(isConnectedToBroker ? .green : .red)
                }
                
                // Operating state picker
                Picker(selection: $operatingState.onChange(stateChange), label: Text("Choose operating state")) {
                    Text("Normal").tag("normal")
                    Text("Emergency").tag("emergency")
                }
                .pickerStyle(SegmentedPickerStyle())
                
                // IoSource selector (selects an IoSource with the respective bacpressure strategy)
                Picker(selection: $selectedSourceWithStrategy.onChange(sourceChange), label: Text("Choose source")) {
                    Text("None").tag("None")
                    Text("Sample").tag("Sample")
                    Text("Throttle").tag("Throttle")
                }
                .pickerStyle(SegmentedPickerStyle())

                Spacer()
                
                Text("To publish an event on the selected source press the button below.")
                    .font(.footnote)
                    .multilineTextAlignment(.center)
                
                // A button used to publish an IoValue on the selected IoSource
                Button(action: publishIoValue) {
                    Text("Publish")
                    .foregroundColor(.white)
                    .padding(12)
                    .font(.title)
                }
                .background(Color.blue)
                .cornerRadius(8)
                
                // Next message payload representation
                Text("Next message payload: \"Hello Coaty! \(publishIoValueCounter)\"")
            }
            .navigationBarTitle("Sources controller")
            .padding()
        }
        .onAppear(perform: helper)
    }
    
    private func helper() {
        observeCommunicationState()
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
    
    func publishIoValue() {
        guard let ioSourceController = coatyContainer?.getController(name: "IoSourceController") as? IoSourceController else {
            return
        }
        
        guard let ioSource = Model.ioSources[self.selectedSourceWithStrategy] else {
            return
        }
        ioSourceController.publish(source: ioSource, value: "Hello Coaty! \(publishIoValueCounter)")
        
        // Increment the counter for IOValue messages
        publishIoValueCounter = publishIoValueCounter + 1
    }
    
    func stateChange(_ state: String) {
        let context = Model.ioContext!
        context.operatingState = state
        
        // Update the ioContext with the newly selected state value.
        _ = try? coatyContainer?
            .communicationManager?
            .publishUpdate(UpdateEvent.with(object: context))
            .subscribe(onNext: { complete in
            _ = 1
        })
    }
    
    func sourceChange(_ source: String) {
        self.selectedSourceWithStrategy = source
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}

extension Binding {
    func onChange(_ handler: @escaping (Value) -> Void) -> Binding<Value> {
        return Binding(
            get: { self.wrappedValue },
            set: { selection in
                self.wrappedValue = selection
                handler(selection)
        })
    }
}

