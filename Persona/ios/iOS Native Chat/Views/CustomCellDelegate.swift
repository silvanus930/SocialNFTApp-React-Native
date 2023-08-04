//
//  CustomCellDelegate.swift
//  Persona
//
//  Created by Allan Zhang on 2/17/23.
//

import MessageKit

protocol CustomCellDelegate: MessageCellDelegate {
    func didTapReaction(in cell: MessageCollectionViewCell, emoji: String)
    func didSelectProposalAction(in cell: MessageCollectionViewCell, actionIndex: Int)
    func didTapThreads(in cell: MessageCollectionViewCell)
}
