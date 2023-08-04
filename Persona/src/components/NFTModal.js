import React from 'react';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Feather';
import isEqual from 'lodash.isequal';
import ProfilePersona from 'components/ProfilePersona';
import {NFTModalStateContext} from 'state/NFTModalState';
import BottomSheet from './BottomSheet';
import fonts from 'resources/fonts';
import colors from 'resources/colors';
import {TouchableOpacity, Text, View} from 'react-native';

function propsAreEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}

export default function NFTModalProfiler(props) {
    return (
        <React.Profiler
            id={'NFTModal'}
            onRender={(id, phase, actualDuration) => {
                if (actualDuration > 2) {
                    //console.log('======> (Profiler)', id, phase, actualDuration);
                }
            }}>
            <NFTModalMemo {...props} />
        </React.Profiler>
    );
}

const NFTModalMemo = React.memo(NFTModal, propsAreEqual);
function NFTModal({navigation}) {
    const {
        toggleModalVisibility,
        persona,
        personaID,
        communityID,
        userID,
        showToggle,
    } = React.useContext(NFTModalStateContext);
    console.log('rendering NFTModal', personaID, communityID, persona);
    const wip = React.useCallback(() => {
        alert('Coming soon!');
    }, []);

    let size = 22;

    return (
        <BottomSheet
            // windowScale={0.63}
            snapPoints={['63%']}
            toggleModalVisibility={toggleModalVisibility}
            showToggle={showToggle}>
            <View
                style={{
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderColor: 'magenta',
                    borderWidth: 0,
                }}>
                <View style={{height: 200}}>
                    <ProfilePersona
                        userID={userID}
                        showName={true}
                        navigation={navigation}
                        persona={persona}
                        personaID={personaID}
                    />
                </View>

                {userID === auth().currentUser.uid ? (
                    <>
                        <TouchableOpacity
                            onPress={wip}
                            style={{
                                marginStart: 40,
                                flexDirection: 'row',
                                alignItems: 'center',
                                height: 42,
                                width: '80%',
                                marginEnd: 40,
                                padding: 10,
                                borderRadius: 8,
                                marginTop: 20,
                                backgroundColor: colors.paleBackground,
                            }}>
                            <Icon
                                color={colors.red}
                                name={'send'}
                                size={size}
                            />
                            <Text
                                style={{
                                    fontSize: 16,
                                    color: colors.postAction,
                                    fontFamily: fonts.bold,
                                    color: colors.red,
                                    marginStart: 10,
                                }}>
                                Send
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={wip}
                            style={{
                                marginStart: 40,
                                flexDirection: 'row',
                                alignItems: 'center',
                                height: 42,
                                width: '80%',
                                marginEnd: 40,
                                padding: 10,
                                borderRadius: 8,
                                marginTop: 20,
                                backgroundColor: colors.paleBackground,
                            }}>
                            <Icon
                                color={colors.red}
                                name={'activity'}
                                size={size}
                            />
                            <Text
                                style={{
                                    fontSize: 16,
                                    color: colors.postAction,
                                    fontFamily: fonts.bold,
                                    color: colors.red,
                                    marginStart: 10,
                                }}>
                                Auction
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={wip}
                            style={{
                                marginStart: 40,
                                flexDirection: 'row',
                                alignItems: 'center',
                                height: 42,
                                width: '80%',
                                marginEnd: 40,
                                padding: 10,
                                borderRadius: 8,
                                marginTop: 20,
                                backgroundColor: colors.paleBackground,
                            }}>
                            <Icon
                                color={colors.red}
                                name={'trash'}
                                size={size}
                            />
                            <Text
                                style={{
                                    fontSize: 16,
                                    color: colors.postAction,
                                    fontFamily: fonts.bold,
                                    color: colors.red,
                                    marginStart: 10,
                                }}>
                                Burn
                            </Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity
                        onPress={wip}
                        style={{
                            marginStart: 40,
                            flexDirection: 'row',
                            alignItems: 'center',
                            height: 42,
                            width: '80%',
                            marginEnd: 40,
                            padding: 10,
                            borderRadius: 8,
                            marginTop: 20,
                            backgroundColor: colors.paleBackground,
                        }}>
                        <Icon
                            color={colors.red}
                            name={'activity'}
                            size={size}
                        />
                        <Text
                            style={{
                                fontSize: 16,
                                color: colors.postAction,
                                fontFamily: fonts.bold,
                                color: colors.red,
                                marginStart: 10,
                            }}>
                            Activity
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </BottomSheet>
    );
}

/*
            <TouchableOpacity
                onPress={null}
                style={{
                    marginStart: 40,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginEnd: 40,
                    padding: 10,
                    borderRadius: 8,
                    marginTop: 20,
                    backgroundColor: colors.paleBackground,
                }}>
                <Text
                    style={{
                        fontSize: 28,
                        fontStyle: 'italic',
                        color: colors.postAction,
                        top: -2,
                    }}>
                    #
                </Text>
                <Text
                    style={{
                        fontSize: 16,
                        color: colors.postAction,
                        fontFamily: fonts.bold,
                        marginStart: 10,
                    }}>
                    Find by Phone Number
                </Text>
                <View
                    style={{
                        borderColor: 'orange',
                        borderWidth: 0,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        width: '30%',
                    }}>
                    <Text style={{color: colors.maxFaded, fontSize: 20}}>
                        >
                    </Text>
                </View>
            </TouchableOpacity>
            */
