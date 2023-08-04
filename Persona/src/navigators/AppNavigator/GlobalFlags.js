import React, {useState} from 'react';
import {
    View,
    ScrollView,
    Text,
    Switch,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import colors from 'resources/colors';
import palette from 'resources/palette';
import {Styles} from 'components/Dynamic';
import MainNavigator from 'navigators/MainNavigator';
import LineSeperator from 'components/LineSeperator';
import NotchSpacer from 'components/NotchSpacer';

export const getActivityTypes = [
    'application',
    'invitation',
    'post_comment',
    'post_thread_comment',
    'post_like',
    'comment_endorsement',
    'new_post_from_collaborator',
    'post_edit_from_collaborator',
    'chat_message',
    'chat_endorsement',
    'chat_thread_message',
    'post_endorsement',
    'post_mention',
    'comment_mention',
    'comment_thread_mention',
    'community_join',
    'room_audio_discussion',
    'room_users_present',
    'post_new_discussion',
    'post_continued_discussion',
    'user_profile_follow',
    'post_remix',
];

const GlobalFlags = React.memo(GlobalFlagsMemo, () => true);
export default GlobalFlags;
function GlobalFlagsMemo() {
    const useLogging = true;
    const [start, setStart] = useState(false);
    const [viewMyPostsInFeed, setViewMyPostsInFeed] = useState(true);
    const [handleViewableItemsChanged, setHandleViewableItemsChanged] =
        useState(true);
    const [privatePersonas, setPrivatePersonas] = useState(true);
    const [longCommentBars, setLongCommentBars] = useState(false);
    const [reverseOtherUserComments, setReverseOtherUserComments] =
        useState(false);
    const [studioShowsPostTypeText, setStudioShowsPostTypeText] =
        useState(false);
    const [studioShowsPostPath, setStudioShowsPostPath] = useState(true);
    const [studioCreatesChat, setStudioCreatesChat] = useState(false);
    const [publicCollabButtons, setPublicCollabButtons] = useState(true);
    const [publicCollabPosts, setPublicCollabPosts] = useState(true);
    const [deselectUserForChat, setDeselectUserForChat] = useState(true);
    const [deselectAuthorForChat, setDeselectAuthorForChat] = useState(false);
    const [numPostsPerPersonaInFeed, setNumPostsPerPersonaInFeed] = useState(1);
    const [logFb, setLogFb] = useState(true && useLogging);
    const [logAuth, setLogAuth] = useState(true && useLogging);
    const [logGlobalState, setLogGlobalState] = useState(true && useLogging);
    const [logInviteState, setLogInviteState] = useState(true && useLogging);
    const [logPersonaState, setLogPersonaState] = useState(true && useLogging);
    const [logPostState, setLogPostState] = useState(true && useLogging);
    const [logImplementMe, setLogImplementMe] = useState(true && useLogging);
    const [logPostCreation, setLogPostCreation] = useState(true && useLogging);
    const [logS3, setLogS3] = useState(true && useLogging);
    const [logDebug, setLogDebug] = useState(true && useLogging);
    const [logPermissions, setLogPermissions] = useState(true && useLogging);
    const [logAudio, setLogAudio] = useState(true && useLogging);
    const [logVideo, setLogVideo] = useState(true && useLogging);
    const [logKeyboard, setLogKeyboard] = useState(true && useLogging);
    const [warnFb, setWarnFb] = useState(true && useLogging);
    const [warnAuth, setWarnAuth] = useState(true && useLogging);
    const [warnGlobalState, setWarnGlobalState] = useState(true && useLogging);
    const [warnInviteState, setWarnInviteState] = useState(true && useLogging);
    const [warnPersonaState, setWarnPersonaState] = useState(
        true && useLogging,
    );
    const [warnPostState, setWarnPostState] = useState(true && useLogging);
    const [warnImplementMe, setWarnImplementMe] = useState(true && useLogging);
    const [warnPostCreation, setWarnPostCreation] = useState(
        true && useLogging,
    );
    const [warnS3, setWarnS3] = useState(true && useLogging);
    const [warnDebug, setWarnDebug] = useState(true && useLogging);
    const [warnPermissions, setWarnPermissions] = useState(true && useLogging);
    const [warnAudio, setWarnAudio] = useState(true && useLogging);
    const [warnVideo, setWarnVideo] = useState(true && useLogging);
    const [warnKeyboard, setWarnKeyboard] = useState(true && useLogging);
    const [studioVersion, setStudioVersion] = useState(1);
    const [showChatNotifications, setShowChatNotifications] = useState(true);
    const autoStart = true;
    const [useNativeChatModule, setUseNativeChatModule] = useState(false);

    React.useEffect(() => {
        autoStart && startApp();
    }, [autoStart]);

    // set GLOBAL flags before starting app
    const startApp = async () => {
        global.TEST_USER_EMAIL_REGEX = new RegExp('test@persona.*\\.com');
        global.HANDLE_VIEWABLE_ITEMS_CHANGED = handleViewableItemsChanged;
        global.SHOW_CHAT_NOTIFICATIONS = showChatNotifications;
        // Only look at the first N items in activity to see if there are any new unseen
        global.NEW_ACTIVITY_ITEM_THRESHOLD = 1;

        global.ACTIVITY_TYPES = getActivityTypes;
        global.UPDATE_DB_ITEMS_SEEN = false;
        global.LAZY_LOAD = true;

        (global.STUDIO_SHOWS_POST_TYPE_TEXT = studioShowsPostTypeText),
            (global.STUDIO_SHOWS_POST_PATH = studioShowsPostPath);
        global.NUM_POSTS_PER_PERSONA_IN_FEED_GLOBAL = numPostsPerPersonaInFeed;
        global.LOG_FB = logFb;
        global.WARN_FB = warnFb;

        global.LOG_AUTH = logAuth;
        global.WARN_AUTH = warnAuth;

        global.LOG_STATE_GLOBAL = logGlobalState;
        global.WARN_STATE_GLOBAL = warnGlobalState;

        global.LOG_STATE_INVITE = logInviteState;
        global.WARN_STATE_INVITE = warnInviteState;

        global.LOG_STATE_PERSONA = logPersonaState;
        global.WARN_STATE_PERSONA = warnPersonaState;

        global.LOG_STATE_POST = logPostState;
        global.WARN_STATE_POST = warnPostState;

        global.WARN_IMPLEMENT_ME = warnImplementMe;

        global.LOG_POST_CREATION = logPostCreation;
        global.WARN_POST_CREATION = warnPostCreation;

        global.LOG_S3 = logS3;
        global.WARN_S3 = warnS3;

        global.LOG_PERMISSIONS = logPermissions;
        global.WARN_PERMISSIONS = warnPermissions;

        global.LOG_AUDIO = logAudio;
        global.WARN_AUDIO = warnAudio;

        global.LOG_VIDEO = logVideo;
        global.WARN_VIDEO = warnVideo;

        global.LOG_MEDIA = global.LOG_VIDEO || global.LOG_AUDIO;
        global.WARN_MEDIA = global.WARN_VIDEO || global.WARN_AUDIO;

        global.LOG_DEBUG = logDebug;
        global.WARN_DEBUG = warnDebug;

        global.LOG_KEYBOARD = logKeyboard;
        global.WARN_KEYBOARD = warnKeyboard;

        global.LONG_COMMENT_BARS = longCommentBars;
        global.REVERSE_OTHER_USER_COMMENTS = reverseOtherUserComments;

        global.PUBLIC_COLLAB_BUTTONS = publicCollabButtons;
        global.PUBLIC_COLLAB_POSTS = publicCollabPosts;

        global.DESELECT_USER_FOR_CHAT = deselectUserForChat;
        global.DESELECT_AUTHOR_FOR_CHAT = deselectAuthorForChat;

        global.STUDIO_CREATES_CHAT = studioCreatesChat;

        global.PRIVATE_PERSONAS = privatePersonas;

        global.USE_NATIVE_CHAT_MODULE = useNativeChatModule;
        setStart(true);
    };

    const FlagsUI = () => {
        return (
            <View style={Styles.container}>
                <View style={Style.container}>
                    <Text
                        style={{
                            ...palette.text,
                            fontSize: 20,
                            marginLeft: 110,
                        }}>
                        Feature flags
                    </Text>
                </View>
                <LineSeperator />
                <ScrollView style={Styles.scrollView}>
                    <View style={Style.container}>
                        <Text style={{...palette.text, marginBottom: 10}}>
                            Global:
                        </Text>
                        <View style={Style.versionContainer}>
                            <Switch
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                    handleViewableItemsChanged
                                        ? '#f5dd4b'
                                        : '#f4f3f4'
                                }
                                ios_backgroundColor="#3e3e3e"
                                value={handleViewableItemsChanged}
                                onValueChange={setHandleViewableItemsChanged}
                            />
                            <Text style={Style.versionText}>
                                handleViewableItemsChanged
                            </Text>
                        </View>
                        <View style={Style.versionContainer}>
                            <Switch
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                    privatePersonas ? '#f5dd4b' : '#f4f3f4'
                                }
                                ios_backgroundColor="#3e3e3e"
                                value={privatePersonas}
                                onValueChange={setPrivatePersonas}
                            />
                            <Text style={Style.versionText}>
                                Private Personas (off => all personas public)
                            </Text>
                        </View>
                    </View>
                    <LineSeperator />

                    <View style={Style.btnContainer}>
                        <TouchableOpacity onPress={startApp}>
                            <View style={Style.startBtn}>
                                <Text style={Style.startBtnText}>START</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <LineSeperator />

                    <View style={Style.container}>
                        <Text style={{...palette.text, marginBottom: 10}}>
                            Home:
                        </Text>
                        <View style={Style.versionContainer}>
                            <Switch
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                    viewMyPostsInFeed ? '#f5dd4b' : '#f4f3f4'
                                }
                                ios_backgroundColor="#3e3e3e"
                                value={viewMyPostsInFeed}
                                onValueChange={setViewMyPostsInFeed}
                            />
                            <Text style={Style.versionText}>
                                View my own posts in feed
                            </Text>
                        </View>

                        <View style={Style.versionContainer}>
                            <Switch
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                    publicCollabButtons ? '#f5dd4b' : '#f4f3f4'
                                }
                                ios_backgroundColor="#3e3e3e"
                                value={publicCollabButtons}
                                onValueChange={setPublicCollabButtons}
                            />
                            <Text style={Style.versionText}>
                                Public Collab Buttons
                            </Text>
                        </View>

                        <View style={Style.versionContainer}>
                            <Switch
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                    longCommentBars ? '#f5dd4b' : '#f4f3f4'
                                }
                                ios_backgroundColor="#3e3e3e"
                                value={longCommentBars}
                                onValueChange={setLongCommentBars}
                            />
                            <Text style={Style.versionText}>
                                Long Comment Bars
                            </Text>
                        </View>

                        <View style={Style.versionContainer}>
                            <Switch
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                    reverseOtherUserComments
                                        ? '#f5dd4b'
                                        : '#f4f3f4'
                                }
                                ios_backgroundColor="#3e3e3e"
                                value={reverseOtherUserComments}
                                onValueChange={setReverseOtherUserComments}
                            />
                            <Text style={Style.versionText}>
                                Reverse Other User's Comments
                            </Text>
                        </View>

                        <View style={Style.versionContainer}>
                            <Text style={Style.versionText}>
                                {numPostsPerPersonaInFeed} posts per visible
                                seen persona group
                            </Text>
                        </View>
                    </View>

                    <LineSeperator />

                    <View style={Style.btnContainer}>
                        <TouchableOpacity onPress={startApp}>
                            <View style={Style.startBtn}>
                                <Text style={Style.startBtnText}>START</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <LineSeperator />

                    <View style={Style.container}>
                        <Text style={{...palette.text, marginBottom: 10}}>
                            Activity:
                        </Text>
                        <View style={Style.versionContainer}>
                            <Switch
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                    showChatNotifications
                                        ? '#f5dd4b'
                                        : '#f4f3f4'
                                }
                                ios_backgroundColor="#3e3e3e"
                                value={showChatNotifications}
                                onValueChange={setShowChatNotifications}
                            />
                            <Text style={Style.versionText}>
                                View chat notifications
                            </Text>
                        </View>
                    </View>

                    <LineSeperator />

                    <View style={Style.btnContainer}>
                        <TouchableOpacity onPress={startApp}>
                            <View style={Style.startBtn}>
                                <Text style={Style.startBtnText}>START</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <LineSeperator />

                    <View style={Style.container}>
                        <Text style={{...palette.text, marginBottom: 10}}>
                            Studio:
                        </Text>
                        <View style={Style.versionContainer}>
                            <Switch
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                    publicCollabPosts ? '#f5dd4b' : '#f4f3f4'
                                }
                                ios_backgroundColor="#3e3e3e"
                                value={publicCollabPosts}
                                onValueChange={setPublicCollabPosts}
                            />
                            <Text style={Style.versionText}>
                                Publish Public Collab Posts
                            </Text>
                        </View>
                        <View style={Style.versionContainer}>
                            <Switch
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                    studioShowsPostTypeText
                                        ? '#f5dd4b'
                                        : '#f4f3f4'
                                }
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={setStudioShowsPostTypeText}
                                value={studioShowsPostTypeText}
                            />
                            <Text style={Style.versionText}>
                                Studio shows text instead of icons for
                                PostCreationScreen UI modality switches
                            </Text>
                        </View>

                        <View style={Style.versionContainer}>
                            <Switch
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                    studioShowsPostPath ? '#f5dd4b' : '#f4f3f4'
                                }
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={setStudioShowsPostPath}
                                value={studioShowsPostPath}
                            />
                            <Text style={Style.versionText}>
                                Show Post Path
                            </Text>
                        </View>

                        <View style={Style.versionContainer}>
                            <Switch
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                    studioCreatesChat ? '#f5dd4b' : '#f4f3f4'
                                }
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={setStudioCreatesChat}
                                value={studioCreatesChat}
                            />
                            <Text style={Style.versionText}>Create Chats</Text>
                        </View>

                        <View style={Style.versionContainer}>
                            <Switch
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                    deselectUserForChat ? '#f5dd4b' : '#f4f3f4'
                                }
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={setDeselectUserForChat}
                                value={deselectUserForChat}
                            />
                            <Text style={Style.versionText}>
                                Allow Deselect User When Creating Chat
                            </Text>
                        </View>

                        <View style={Style.versionContainer}>
                            <Switch
                                trackColor={{false: '#767577', true: '#81b0ff'}}
                                thumbColor={
                                    deselectAuthorForChat
                                        ? '#f5dd4b'
                                        : '#f4f3f4'
                                }
                                ios_backgroundColor="#3e3e3e"
                                onValueChange={setDeselectAuthorForChat}
                                value={deselectAuthorForChat}
                            />
                            <Text style={Style.versionText}>
                                Allow Deselect Author When Creating Chat
                            </Text>
                        </View>
                    </View>

                    <LineSeperator />

                    <View style={Style.container}>
                        {/*TODO read/write settings to a file and then .gitignore the file*/}
                        <Text
                            style={{
                                ...palette.text,
                                marginBottom: 10,
                                marginTop: 30,
                            }}>
                            Global Log & Warn:
                        </Text>
                        <View style={Style.versionContainer}>
                            <View style={Style.logContainer}>
                                <Switch
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setLogDebug}
                                    value={logDebug}
                                />
                                <Text style={Style.logwarnText}>DEBUG log</Text>
                            </View>
                            <View style={Style.warnContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setWarnDebug}
                                    value={warnDebug}
                                />
                                <Text style={Style.logwarnText}>
                                    warn DEBUG
                                </Text>
                            </View>
                        </View>
                        <View style={Style.versionContainer}>
                            <View style={Style.logContainer}>
                                <Switch
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setLogFb}
                                    value={logFb}
                                />
                                <Text style={Style.logwarnText}>
                                    Firebase log
                                </Text>
                            </View>
                            <View style={Style.warnContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setWarnFb}
                                    value={warnFb}
                                />
                                <Text style={Style.logwarnText}>
                                    warn Firebase
                                </Text>
                            </View>
                        </View>
                        <View style={Style.versionContainer}>
                            <View style={Style.logContainer}>
                                <Switch
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setLogAuth}
                                    value={logAuth}
                                />
                                <Text style={Style.logwarnText}>Auth log</Text>
                            </View>
                            <View style={Style.warnContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setWarnAuth}
                                    value={warnAuth}
                                />
                                <Text style={Style.logwarnText}>warn Auth</Text>
                            </View>
                        </View>
                        <View style={Style.versionContainer}>
                            <View style={Style.logContainer}>
                                <Switch
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setLogPostCreation}
                                    value={logPostCreation}
                                />
                                <Text style={Style.logwarnText}>
                                    PostCreation log
                                </Text>
                            </View>
                            <View style={Style.warnContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setWarnPostCreation}
                                    value={warnPostCreation}
                                />
                                <Text style={Style.logwarnText}>
                                    warn PostCreation
                                </Text>
                            </View>
                        </View>
                        <View style={Style.versionContainer}>
                            <View style={Style.logContainer}>
                                <Switch
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setLogS3}
                                    value={logS3}
                                />
                                <Text style={Style.logwarnText}>S3 log</Text>
                            </View>
                            <View style={Style.warnContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setWarnS3}
                                    value={warnS3}
                                />
                                <Text style={Style.logwarnText}>warn S3</Text>
                            </View>
                        </View>
                        <View style={Style.versionContainer}>
                            <View style={Style.logContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setLogAudio}
                                    value={logAudio}
                                />
                                <Text style={Style.logwarnText}>Audio Log</Text>
                            </View>
                            <View style={Style.warnContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setWarnAudio}
                                    value={warnAudio}
                                />
                                <Text style={Style.logwarnText}>
                                    warn Audio
                                </Text>
                            </View>
                        </View>
                        <View style={Style.versionContainer}>
                            <View style={Style.logContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setLogVideo}
                                    value={logVideo}
                                />
                                <Text style={Style.logwarnText}>Audio Log</Text>
                            </View>
                            <View style={Style.warnContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setWarnVideo}
                                    value={warnVideo}
                                />
                                <Text style={Style.logwarnText}>
                                    warn Audio
                                </Text>
                            </View>
                        </View>
                        <View style={Style.versionContainer}>
                            <View style={Style.logContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setLogPermissions}
                                    value={logPermissions}
                                />
                                <Text style={Style.logwarnText}>
                                    Permissions Log
                                </Text>
                            </View>
                            <View style={Style.warnContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setWarnPermissions}
                                    value={warnPermissions}
                                />
                                <Text style={Style.logwarnText}>
                                    warn Permissions
                                </Text>
                            </View>
                        </View>
                        <View style={Style.versionContainer}>
                            <View style={Style.logContainer} />
                            <View style={Style.warnContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setWarnImplementMe}
                                    value={warnImplementMe}
                                />
                                <Text style={Style.logwarnText}>
                                    warn IMPLEMENT ME
                                </Text>
                            </View>
                        </View>
                    </View>
                    <LineSeperator />
                    <View style={Style.container}>
                        <Text
                            style={{
                                ...palette.text,
                                marginBottom: 10,
                                marginTop: 30,
                            }}>
                            Studio State Logs:
                        </Text>
                        <View style={Style.versionContainer}>
                            <View style={Style.logContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setLogGlobalState}
                                    value={logGlobalState}
                                />
                                <Text style={Style.logwarnText}>
                                    GlobalState log
                                </Text>
                            </View>
                            <View style={Style.warnContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setWarnGlobalState}
                                    value={warnGlobalState}
                                />
                                <Text style={Style.logwarnText}>
                                    warn GlobalState
                                </Text>
                            </View>
                        </View>
                        <View style={Style.versionContainer}>
                            <View style={Style.logContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setLogPostState}
                                    value={logPostState}
                                />
                                <Text style={Style.logwarnText}>
                                    PostState log
                                </Text>
                            </View>
                            <View style={Style.warnContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setWarnPostState}
                                    value={warnPostState}
                                />
                                <Text style={Style.logwarnText}>
                                    warn PostState
                                </Text>
                            </View>
                        </View>
                        <View style={Style.versionContainer}>
                            <View style={Style.logContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setLogPersonaState}
                                    value={logPersonaState}
                                />
                                <Text style={Style.logwarnText}>
                                    PersonaState log
                                </Text>
                            </View>
                            <View style={Style.warnContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setWarnPersonaState}
                                    value={warnPersonaState}
                                />
                                <Text style={Style.logwarnText}>
                                    warn PersonaState
                                </Text>
                            </View>
                        </View>
                        <View style={Style.versionContainer}>
                            <View style={Style.logContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setLogInviteState}
                                    value={logInviteState}
                                />
                                <Text style={Style.logwarnText}>
                                    InviteState log
                                </Text>
                            </View>
                            <View style={Style.warnContainer}>
                                <Switch
                                    style={Style.warnSwitch}
                                    trackColor={{
                                        false: '#767577',
                                        true: '#81b0ff',
                                    }}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setWarnInviteState}
                                    value={warnInviteState}
                                />
                                <Text style={Style.logwarnText}>
                                    warn InviteState
                                </Text>
                            </View>
                        </View>

                        <View style={Style.container}>
                            <TouchableOpacity onPress={startApp}>
                                <View style={Style.startBtn}>
                                    <Text style={Style.startBtnText}>
                                        START
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    };

    return start ? (
        <React.Fragment>
            <MainNavigator />
        </React.Fragment>
    ) : autoStart ? (
        <></>
    ) : (
        <FlagsUI />
    );
}

const Style = StyleSheet.create({
    scrollView: {
        backgroundColor: colors.backgroundColor,
    },

    container: {
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingBottom: 0,
        paddingTop: 40,
        paddingLeft: 40,
    },

    btnContainer: {
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingBottom: 5,
        paddingTop: 5,
        paddingLeft: 40,
    },

    versionContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingBottom: 20,
        paddingTop: 20,
    },

    versionText: {
        color: 'white',
        height: 20,
        marginTop: 6,
        marginLeft: 10,
    },

    logwarnText: {
        fontSize: 11,
        color: 'white',
        height: 20,
        marginTop: 6,
        marginLeft: 10,
    },

    logContainer: {
        flex: 1,
        borderColor: 'white',
        flexDirection: 'row',
    },

    warnContainer: {
        flex: 1,
        borderColor: 'white',
        flexDirection: 'row-reverse',
        marginLeft: 40,
    },

    warnSwitch: {
        marginLeft: 10,
    },

    startBtn: {
        borderColor: 'white',
        borderWidth: 1,
        borderRadius: 25,
        marginTop: 0,
        marginLeft: 115,
        paddingTop: 5,
        paddingBottom: 5,
        marginBottom: 10,
        paddingLeft: 20,
        width: 100,
    },
    startBtnText: {
        color: 'white',
        fontSize: 20,
    },
});
