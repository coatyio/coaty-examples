//  Copyright (c) 2019 Siemens AG. Licensed under the MIT License.
//
//  HelloWorldExampleViewController.swift
//  HelloWorld
//

import Foundation
import UIKit

/// This example view controller shows how you can set up a basic CoatySwift bootstrap application.
class HelloWorldExampleViewController: UIViewController {
    
    override func viewDidLoad() {
        setupView()
    }
    
    // MARK: - Setup methods.
    
    private func setupView() {
        
        // Fetch reference to AppDelegate.
        let appDelegate = UIApplication.shared.delegate as! AppDelegate

        // Add Coaty logo.
        let logo = UIImageView(image: UIImage(named: "coaty-logo"))
        
        logo.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(logo)

        logo.topAnchor.constraint(equalTo: view.topAnchor, constant: 100).isActive = true
        logo.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        logo.widthAnchor.constraint(equalToConstant: 192).isActive = true
        logo.heightAnchor.constraint(equalToConstant: 192).isActive = true
        
        // Add example name label.
        let label = UILabel(frame: CGRect.zero)
        label.textAlignment = .center
        label.text = "Hello World Example - Client"
        
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        
        label.topAnchor.constraint(equalTo: logo.bottomAnchor, constant: 30).isActive = true
        label.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        label.widthAnchor.constraint(equalTo: view.widthAnchor).isActive = true
        label.heightAnchor.constraint(equalToConstant: 30).isActive = true
        
        // Add note.
        let note = UILabel(frame: CGRect.zero)
        note.font = note.font.withSize(14)
        note.textAlignment = .center
        note.text = "Note: The output is logged to the XCode console."
        
        note.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(note)
        
        note.topAnchor.constraint(equalTo: label.bottomAnchor).isActive = true
        note.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        note.widthAnchor.constraint(equalTo: view.widthAnchor).isActive = true
        note.heightAnchor.constraint(equalToConstant: 30).isActive = true
        
        // Add broker info.
        let broker = UILabel(frame: CGRect.zero)
        broker.font = broker.font.withSize(14)
        broker.textAlignment = .center
        broker.text = "MQTT Broker: \(appDelegate.brokerIp):\(appDelegate.brokerPort)"
        
        broker.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(broker)
        
        broker.topAnchor.constraint(equalTo: note.bottomAnchor).isActive = true
        broker.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        broker.widthAnchor.constraint(equalToConstant:broker.intrinsicContentSize.width).isActive = true
        broker.heightAnchor.constraint(equalToConstant: 30).isActive = true
        
        // Add connectivity indicator.
        let indicator = UIView(frame: CGRect.zero)
        indicator.backgroundColor = .red
        indicator.layer.cornerRadius = 12
        
        indicator.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(indicator)
        
        indicator.centerYAnchor.constraint(equalTo: broker.centerYAnchor).isActive = true
        indicator.rightAnchor.constraint(equalTo: broker.leftAnchor, constant: -5).isActive = true
        indicator.widthAnchor.constraint(equalToConstant: 24).isActive = true
        indicator.heightAnchor.constraint(equalToConstant: 24).isActive = true
        
        // Dynamically update the indicator color based on the connection state.
        _ = appDelegate
            .container?
            .communicationManager?
            .getCommunicationState()
            .subscribe(onNext: {
                indicator.backgroundColor = $0 == .online ? .green : .red
        })
        
    }
}
