//
//  UserManager.m
//  Persona
//
//  Created by Allan Zhang on 2/15/23.
//

#import <Foundation/Foundation.h>

#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_MODULE(UserManager, NSObject);

//Methods called by React Native and triggering actions in iOS Swift
RCT_EXTERN_METHOD(chatScreenRendered:(NSDictionary *)data)
RCT_EXTERN_METHOD(sideBarRendered)
RCT_EXTERN_METHOD(sideBarRemoved)

@end

