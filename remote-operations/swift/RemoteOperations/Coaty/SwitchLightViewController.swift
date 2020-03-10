//  Copyright (c) 2019 Siemens AG. Licensed under the MIT License.
//
//  SwitchLightViewController.swift
//  RemoteOperations
//

import Foundation
import CoatySwift
import RxSwift

class SwitchLightViewController: UIViewController {
    
    // MARK: - Private attributes.
    
    private var lightView: UIView?
    private var container: Container? = nil
    private let disposeBag = DisposeBag()
    
    override func viewDidLoad() {
        // Setup view.
        self.view.backgroundColor = .white
        let delegate = UIApplication.shared.delegate as! AppDelegate
        container = delegate.container
        setupLight()
        setupButton()
        setupConnectivityIndicator()
    }
    
    // MARK: Setup methods.
    
    /// The light view simulates a lightbulb and provides location information.
    private func setupLight() {
        
        // Setup the delegate that controls the light.
        guard let lightController = container?.getController(name: "LightController") as? LightController else {
            print("Could not load LightController.")
            return
        }
        
        // Set delegate.
        lightController.delegate = self
        
        // Create light label.
        let lightLabel = UILabel(frame: .zero)
        lightLabel.font = lightLabel.font.withSize(24)
        lightLabel.textAlignment = .center
        lightLabel.text = "Light #\(lightController.light.objectId.string.prefix(17) + "...")"
        
        // Create location label.
        let locationLabel = UILabel(frame: .zero)
        locationLabel.textAlignment = .center
        locationLabel.text = "Building: \(lightController.lightContext.building) ⋅ Floor: \(lightController.lightContext.floor) ⋅ Room: \(lightController.lightContext.room)"
        
        // Create lightbulb.
        let lightView = UIView(frame: .zero)
        self.lightView = lightView
        lightView.backgroundColor = .clear
        lightView.layer.borderColor = UIColor.darkGray.cgColor
        lightView.layer.borderWidth = 2.0
        lightView.layer.cornerRadius = 300 / 2.0
        lightView.layer.masksToBounds = true
        
        // Setup constraints.
        lightLabel.translatesAutoresizingMaskIntoConstraints = false
        locationLabel.translatesAutoresizingMaskIntoConstraints = false
        lightView.translatesAutoresizingMaskIntoConstraints = false
        
        self.view.addSubview(lightLabel)
        self.view.addSubview(locationLabel)
        self.view.addSubview(lightView)
        
        lightLabel.widthAnchor.constraint(equalToConstant: lightLabel.intrinsicContentSize.width).isActive = true
        lightLabel.heightAnchor.constraint(equalToConstant: lightLabel.intrinsicContentSize.height).isActive = true
        lightLabel.centerXAnchor.constraint(equalTo: self.view.centerXAnchor).isActive = true
        lightLabel.topAnchor.constraint(equalTo: self.view.topAnchor, constant: 100).isActive = true
        
        locationLabel.widthAnchor.constraint(equalToConstant: locationLabel.intrinsicContentSize.width).isActive = true
        locationLabel.heightAnchor.constraint(equalToConstant: locationLabel.intrinsicContentSize.height).isActive = true
        locationLabel.centerXAnchor.constraint(equalTo: self.view.centerXAnchor).isActive = true
        locationLabel.topAnchor.constraint(equalTo: lightLabel.bottomAnchor, constant: 15).isActive = true
        
        lightView.widthAnchor.constraint(equalToConstant: lightView.layer.cornerRadius * 2).isActive = true
        lightView.heightAnchor.constraint(equalToConstant: lightView.layer.cornerRadius * 2).isActive = true
        lightView.centerXAnchor.constraint(equalTo: self.view.centerXAnchor).isActive = true
        lightView.topAnchor.constraint(equalTo: locationLabel.topAnchor, constant: 60).isActive = true
    }
    
    /// Setup the switch button.
    private func setupButton() {
        let switchButton = UIButton(frame: CGRect.zero)
        switchButton.setTitle("Switch Lights (random color)", for: .normal)
        switchButton.backgroundColor = .systemIndigo
        switchButton.layer.cornerRadius = 10.0
        switchButton.layer.borderColor = UIColor.darkGray.cgColor
        switchButton.layer.borderWidth = 2.0
        switchButton.addTarget(self, action: #selector(switchButtonTapped), for: .touchUpInside)
        
        // Setup constraints.
        switchButton.translatesAutoresizingMaskIntoConstraints = false
        self.view.addSubview(switchButton)
        switchButton.widthAnchor.constraint(equalToConstant: 300).isActive = true
        switchButton.heightAnchor.constraint(equalToConstant: 80).isActive = true
        switchButton.centerXAnchor.constraint(equalTo: self.view.centerXAnchor).isActive = true
        switchButton.bottomAnchor.constraint(equalTo: self.view.bottomAnchor, constant: -180).isActive = true
        
        // Add note.
        let note = UILabel(frame: CGRect.zero)
        note.font = note.font.withSize(14)
        note.textAlignment = .center
        note.text = "Note: Event log is output to the Xcode console."
        
        note.translatesAutoresizingMaskIntoConstraints = false
        self.view.addSubview(note)
        
        note.topAnchor.constraint(equalTo: switchButton.bottomAnchor).isActive = true
        note.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        note.widthAnchor.constraint(equalTo: view.widthAnchor).isActive = true
        note.heightAnchor.constraint(equalToConstant: 40).isActive = true
    }
    
    func setupConnectivityIndicator() {
        
        // Fetch reference to AppDelegate.
        let appDelegate = UIApplication.shared.delegate as! AppDelegate
        
        // Add broker info.
        let broker = UILabel(frame: CGRect.zero)
        broker.font = broker.font.withSize(14)
        broker.textAlignment = .center
        broker.text = "Broker: \(appDelegate.brokerHost):\(appDelegate.brokerPort)"
          
        broker.translatesAutoresizingMaskIntoConstraints = false
        
        view.addSubview(broker)
          
        broker.centerXAnchor.constraint(equalTo: view.centerXAnchor).isActive = true
        broker.widthAnchor.constraint(equalToConstant:broker.intrinsicContentSize.width).isActive = true
        broker.heightAnchor.constraint(equalToConstant: 30).isActive = true
        broker.bottomAnchor.constraint(equalTo: self.view.bottomAnchor, constant: -50).isActive = true
          
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
        // Ensure to unsubscribe from the subscription when this view controller is disposed.
        _ = appDelegate
            .container?
            .communicationManager?
            .getCommunicationState()
            .subscribe(onNext: {
                indicator.backgroundColor = $0 == .online ? .green : .red
            })
            .disposed(by: self.disposeBag)
    }
    
    @objc func switchButtonTapped() {
        guard let controlController = self.container?.getController(name: "ControlController") as? ControlController else {
            print("Could not load ControlController.")
            return
        }
        
        let options = controlController.options!.extra;
        
        let contextFilter = createContextFilter(
            forBuildings: options["initialContextFilterBuildings"] as! [Int],
            forFloors: options["initialContextFilterFloors"] as! [Int],
            forRooms: options["initialContextFilterRooms"] as! [Int])
        
        // Right now we just randomly create a color.
        let colorRGBA = ColorRGBA(r: Int.random(in: 0..<255),
                                  g: Int.random(in: 0..<255),
                                  b: Int.random(in: 0..<255),
                                  a: 1)
        
        controlController.switchLights(
            contextFilter: contextFilter,
            onOff: options["initialOpParamOnOff"] as! Bool,
            luminosity: options["initialOpParamLuminosity"] as! Double,
            rgba: colorRGBA,
            switchTime: options["initialSwitchTime"] as! Int)
    }
    
    private func createContextFilter(forBuildings: [Int], forFloors: [Int], forRooms: [Int]) -> ContextFilter {
        return try! .buildWithConditions {
            let buildingFilter = ContextFilterCondition(
                property: .init("building"),
                expression: .init(filterOperator: .In, op1: .init(forBuildings)))
            let floorFilter = ContextFilterCondition(
                property: .init("floor"),
                expression: .init(filterOperator: .In, op1: .init(forFloors)))
            let roomFilter = ContextFilterCondition(
                property: .init("room"),
                expression: .init(filterOperator: .In, op1: .init(forRooms)))
            
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
                                 alpha: CGFloat(color.a * luminosity))
        light.backgroundColor = lightColor
    }
}
