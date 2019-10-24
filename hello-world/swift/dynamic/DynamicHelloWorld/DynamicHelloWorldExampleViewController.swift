//  Copyright (c) 2019 Siemens AG. Licensed under the MIT License.
//
//  DynamicHelloWorldExampleViewController.swift
//  DynamicHelloWorld
//

import Foundation
import UIKit

/// This example view controller shows how you can set up a basic CoatySwift
/// bootstrap application using a DynamicController.
class DynamicHelloWorldExampleViewController: UIViewController {
    
    override func viewDidLoad() {
        setupView()
    }
    
    // MARK: - Setup methods.
    
    private func setupView() {
        self.view.backgroundColor = .white
        let label = UILabel(frame: CGRect(x: 100, y: 100, width: 100, height: 100))
        view.addSubview(label)
        label.center = view.center
    }
}
