//
//  RNTMapManager.m
//  Persona
//
//  Created by Allan Zhang on 2/5/23.
//

#import <Foundation/Foundation.h>
#import <React/RCTViewManager.h>
#import "Persona-Swift.h"
#import <React/RCTEventEmitter.h>

@interface RNTMapManager : RCTViewManager 
@end

@implementation RNTMapManager

RCT_EXPORT_MODULE(RNTMap)

- (UIView *)view
{
    ContainerView* containerView = [[ContainerView alloc] init];
    containerView.uiManager = self.bridge.uiManager;
    return containerView;
}

RCT_CUSTOM_VIEW_PROPERTY(discussionProps, NSString, ContainerView)
{
    NSDictionary *mapDiscussionProps = json ? [self dictionaryWithJSONString:json] : @{@"system": @"system"};
    [self updateDiscussionPropsForContainerView:view discussionProps:mapDiscussionProps];
    
    NSLog(@"⚛️ Full discussionProps: %@", json);
}

- (NSDictionary *)dictionaryWithJSONString:(NSString *)jsonString {
    if (jsonString == nil) {
        return nil;
    }
    NSData *jsonData = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
    NSError *error = nil;
    NSDictionary *dictionary = [NSJSONSerialization JSONObjectWithData:jsonData options:0 error:&error];
    if (error != nil) {
        NSLog(@"⚛️ Error parsing JSON string: %@", error);
        return nil;
    }

    return dictionary;
}

/*
 Received objects sample
 {
     "header": false,
     "hideFirstTimelineSegment": true,
     "parentObjPath": {
         "chatDocPath": "communities/personateam/chat/all"
     },
     "headerProps": {
         "headerProps": {
             "chatDocPath": "communities/personateam/chat/all",
             "personaName": null,
             "personaProfileImgUrl": null,
             "persona": null,
             "communityID": "personateam"
         }
     },
     "openToThreadID": {
         "openToThreadID": null
     },
     "scrollToMessageID": {
         "scrollToMessageID": null
     },
     "userID": {
         "myUserID": "T9z52pVNcRXdXex7VQjOqeQeW9m2"
     },
     "startingInDM": false
 }
 */

- (void)updateDiscussionPropsForContainerView:(ContainerView *)containerView discussionProps:(NSDictionary *)mapDiscussionProps
{
    
    //Parent level objects
    NSDictionary *parentObjPath = [mapDiscussionProps objectForKey:@"parentObjPath"];
    NSDictionary *headerPropsDict = [mapDiscussionProps objectForKey:@"headerProps"];
    NSDictionary *scrollToMessageIDDict = [mapDiscussionProps objectForKey:@"scrollToMessageID"];
    
    //Retrieved child values
    NSDictionary *userID = [mapDiscussionProps objectForKey:@"userID"];
    NSString *communityID = headerPropsDict[@"headerProps"][@"communityID"];
    NSString *scrollToMessageID = scrollToMessageIDDict[@"scrollToMessageID"];

    NSNumber *startingInDMNumber = [mapDiscussionProps objectForKey:@"startingInDM"];
    BOOL startingInDM = [startingInDMNumber boolValue];
    
    
    //secondary objects not from discussionProps
    NSString *myUserID = [userID objectForKey:@"myUserID"];
    
    //nested objects from discussionProps
    NSString *firstChatDocPath = parentObjPath[@"chatDocPath"];
    
    NSLog(@"⚛️ headerPropsDict communityID value: %@", communityID);
    NSLog(@"⚛️ scrollToMessageIDDict value: %@", scrollToMessageID);

    // Do something with the parentObjPath value

    if (startingInDM == NO) {
        NSLog(@"⚛️🐵 Did not start in DM");
    } else {
        NSLog(@"⚛️🐵 Started in DM");
        firstChatDocPath = parentObjPath[@"parentObjPath"];
    }

    
    [self updateBootUpInfoWithUserId:myUserID
                         chatDocPath:firstChatDocPath
                       dmStartStatus:startingInDM
                   scrollToMessageID:scrollToMessageID];

}

- (void)updateBootUpInfoWithUserId: (NSString *)userId
                       chatDocPath: (NSString *)firstChatDocPath
                     dmStartStatus: (BOOL)startingInDM
                   scrollToMessageID: (NSString *)scrollToMessageID {
    
    // Get the shared instance of the UserManager singleton
    UserManager *userManager = [UserManager shared];
    [userManager setCurrentUserId:userId];
    [userManager setCurrentChatDocPath:firstChatDocPath];
    [userManager setStartingInDM:startingInDM];
//    [userManager setScrollToMessageID:scrollToMessageID];
    
    NSLog(@"⚛️👨‍🦳 New currentUserId: %@", userManager.currentUserId);
}




@end
