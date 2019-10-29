//  Copyright (c) 2019 Siemens AG. Licensed under the MIT License.
//
//  SwitchLightViewController.swift
//  CoatySwift_Example
//
//

import Foundation
import CoatySwift

class SwitchLightViewController: UIViewController {
    
    // MARK: - Private attributes.
    
    private var lightView: UIView?
    private var container: Container<SwitchLightObjectFamily>? = nil
    
    override func viewDidLoad() {
        // Setup view.
        self.view.backgroundColor = .white
        let delegate = UIApplication.shared.delegate as! AppDelegate
        container = delegate.container
        setupButton()
        setupLight()
        setupConnectivityIndicator()
    }
    
    // MARK: Setup methods.
    
    /// Setup the switch button. Note that the button will only trigger random changes.
    private func setupButton() {
        let switchButton = UIButton(frame: CGRect.zero)
        switchButton.setTitle("Random Color Change", for: .normal)
        switchButton.backgroundColor = .lightGray
        switchButton.layer.cornerRadius = 10.0
        switchButton.layer.borderColor = UIColor.darkGray.cgColor
        switchButton.layer.borderWidth = 2.0
        switchButton.addTarget(self, action: #selector(switchButtonTapped), for: .touchUpInside)
        
        // Setup constraints.
        switchButton.translatesAutoresizingMaskIntoConstraints = false
        self.view.addSubview(switchButton)
        switchButton.widthAnchor.constraint(equalToConstant: 250).isActive = true
        switchButton.heightAnchor.constraint(equalToConstant: 100).isActive = true
        switchButton.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        switchButton.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -125).isActive = true
    }
    
    /// The light view simulates a lightbulb.
    private func setupLight() {
        
        // Create lightbulb.
        let lightView = UIView(frame: CGRect(x: 100, y: 300, width: 300, height: 100))
        self.lightView = lightView
        lightView.backgroundColor = .clear
        lightView.layer.borderColor = UIColor.darkGray.cgColor
        lightView.layer.borderWidth = 2.0
        lightView.layer.cornerRadius = 200 / 2.0
        lightView.layer.masksToBounds = true
        
        // Create label.
        let lightLabel = UILabel(frame: .zero)
        lightLabel.textAlignment = .center
        lightLabel.text = "Lightbulb"
        
        // Setup the delegate that controls the light.
        guard let lightController = container?.getController(name: "LightController") as? LightController else {
            print("Could not load LightController.")
            return
        }
        
        // Set delegate.
        lightController.delegate = self
        
        // Setup constraints.
        lightView.translatesAutoresizingMaskIntoConstraints = false
        lightLabel.translatesAutoresizingMaskIntoConstraints = false
        
        self.view.addSubview(lightView)
        self.view.addSubview(lightLabel)
        
        lightView.widthAnchor.constraint(equalToConstant: 200).isActive = true
        lightView.heightAnchor.constraint(equalToConstant: 200).isActive = true
        lightView.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        lightView.topAnchor.constraint(equalTo: view.topAnchor, constant: 125).isActive = true
        
        lightLabel.widthAnchor.constraint(equalToConstant: lightLabel.intrinsicContentSize.width).isActive = true
        lightLabel.heightAnchor.constraint(equalToConstant: lightLabel.intrinsicContentSize.height).isActive = true
        lightLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        lightLabel.topAnchor.constraint(equalTo: lightView.bottomAnchor, constant: 5).isActive = true
    }
    
    func setupConnectivityIndicator() {
        
        // Fetch reference to AppDelegate.
        let appDelegate = UIApplication.shared.delegate as! AppDelegate
        
        // Add broker info.
        let broker = UILabel(frame: CGRect.zero)
        broker.font = broker.font.withSize(14)
        broker.textAlignment = .center
        broker.text = "MQTT Broker: \(appDelegate.brokerIp):\(appDelegate.brokerPort)"
          
        broker.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(broker)
          
        broker.topAnchor.constraint(equalTo: self.lightView!.bottomAnchor, constant: 25).isActive = true
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
    
    @objc func switchButtonTapped() {
        guard let controlController = self.container?.getController(name: "ControlController") as? ControlController<SwitchLightObjectFamily> else {
            print("Could not load ControlController.")
            return
        }
        
        let contextFilter = createContextFilter()
        
        // Right now we just randomly create a color.
        let colorRGBA = ColorRGBA(r: Int.random(in: 0..<255),
                                  g: Int.random(in: 0..<255),
                                  b: Int.random(in: 0..<255),
                                  a: 1)
        
        controlController.switchLights(contextFilter: contextFilter,
                                       onOff: true,
                                       luminosity: 0.75,
                                       rgba: colorRGBA,
                                       switchTime: 0)
    }
    
    private func createContextFilter() -> ContextFilter {
        return try! .buildWithConditions {
            let buildingFilter = ContextFilterCondition(property: .init("building"),
                                                        expression: .init(filterOperator: .In, op1: [33]))
            let floorFilter = ContextFilterCondition(property: .init("floor"),
                                                     expression: .init(filterOperator: .In, op1: [4]))
            let roomFilter = ContextFilterCondition(property: .init("room"),
                                                    expression: .init(filterOperator: .In, op1: [62]))
            
            $0.conditions = ObjectFilterConditions.init(and: [buildingFilter, floorFilter, roomFilter])
        }
    }
}

extension SwitchLightViewController: LightControlDelegate {
    
    func switchLight(_ on: Bool, _ color: ColorRGBA, _ luminosity: Double) {
        
        guard let light = self.lightView else {
            return
        }
        
        // Switch light on or off.
        if !on {
            light.backgroundColor = .clear
            return
        }
        
        // Adjust light color.
        let lightColor = UIColor(red: CGFloat(color.r) / 255.0,
                                 green: CGFloat(color.g) / 255.0,
                                 blue: CGFloat(color.b) / 255.0,
                                 alpha: CGFloat(color.a))
        light.backgroundColor = lightColor
        
        // NOTE: Luminosity is currently ignored.
    }
}
