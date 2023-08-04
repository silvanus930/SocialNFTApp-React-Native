//
//  LoadingView.swift
//  Persona
//
//  Created by Allan Zhang on 4/2/23.
//

import UIKit

class LoadingView: UIView {
    let spinner = UIActivityIndicatorView(style: .gray)
    let label = UILabel()

    override init(frame: CGRect) {
        super.init(frame: frame)
        
        // Add spinner
        addSubview(spinner)
        spinner.translatesAutoresizingMaskIntoConstraints = false
        spinner.startAnimating()
        NSLayoutConstraint.activate([
            spinner.centerYAnchor.constraint(equalTo: centerYAnchor),
            spinner.centerXAnchor.constraint(equalTo: centerXAnchor)
        ])
        
        // Add label
        addSubview(label)
        label.translatesAutoresizingMaskIntoConstraints = false
        label.text = "Getting messages"
        label.font = UIFont.systemFont(ofSize: 12)
        label.textColor = .gray
        NSLayoutConstraint.activate([
            label.topAnchor.constraint(equalTo: spinner.bottomAnchor, constant: 8),
            label.centerXAnchor.constraint(equalTo: centerXAnchor)
        ])
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

