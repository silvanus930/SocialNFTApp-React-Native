//
//  AppConstants.swift
//  Persona
//
//  Created by Allan Zhang on 2/17/23.
//

import Foundation

class AppConstants: NSObject {
    
    struct ChatDesign {
        static let INPUTBAR_BACKGROUND_COLOR_CODE: String = "282932"
        static let INPUTBAR_TEXTVIEW_COLOR_CODE: String = "1e1f25"
        static let MESSAGE_BUBBLE_SELF_COLOR_CODE: String = "203349"
        static let MESSAGE_BUBBLE_OTHER_COLOR_CODE: String = "1e1f25"
        static let CHAT_BACKGROUND_COLOR_CODE: String = "131517"
    }
    
    struct ViewStandards {
        static let INPUTBAR_HEIGHT: CGFloat = 60.0
        static let THREADS_BUTTON_HEIGHT: CGFloat = 32.0
        static let THREADS_TOP_OFFSET: CGFloat = 150.0
        static let THREADS_TOP_INSET: CGFloat = 20.0
        static let CELL_SWIPE_MAX_OFFSET: CGFloat = 60.0
    }
    
    struct ViewDesignations {
        static let EXTRA_VIEWS_TAG: Int = 999
        static let INPUTBAR_REPLYVIEW_TAG: Int = 900
        static let BOTTOM_SHEET_REPLY_OPTION: Int = 100
        static let BOTTOM_SHEET_COPY_OPTION: Int = 101
        static let BOTTOM_SHEET_EDIT_OPTION: Int = 102
        static let BOTTOM_MEDIA_PHOTO_LIBRARY: Int = 200
        static let BOTTOM_MEDIA_SELECT_VIDEO: Int = 201
        static let BOTTOM_MEDIA_TAKE_PHOTO: Int = 201
    }
    
}
