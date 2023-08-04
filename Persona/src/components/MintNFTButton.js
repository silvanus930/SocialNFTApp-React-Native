import React from 'react';
import fonts from 'resources/fonts';
import auth from '@react-native-firebase/auth';
import baseText from 'resources/text';
import colors from 'resources/colors';
import images from 'resources/images';
import palette from 'resources/palette';
import {
    Image,
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
    Platform,
    Linking,
} from 'react-native';
import {BASE_API_URL} from '../../config/urls';

const SERVER_URL = BASE_API_URL;

//export default React.memo(MintNFTButton, propsAreEqual);
export default function MintNFTButton({
    numColumns = 2,
    containerStyle = {},
    isCurrentUserAuthor = false,
    dim = false,
    style = {},
    background = true,
    post,
    postID,
    personaID,
    size = palette.icon.size / 2,
}) {
    let userID = auth().currentUser.uid;

    const [minting, setMinting] = React.useState(false);
    let mintHash = post?.minted
        ? post?.mintHash
            ? post?.mintHash
            : '0xc1cdb4de9c1a3856c94154aedc49467284e86f527760951c400ba6e2033d439d'
        : '';
    let contractHash = post?.contractHash
        ? post?.contractHash
        : '0x4F95d03B733f2dD2Cf24BD8417a7e5dD4f84bF91';
    const displayOnPressMemoized = async () => {
        console.log(
            'display token button: for post',
            `${personaID}/posts/${postID}`,
        );
        // Reset back to defaults

        if (post?.minted) {
            if (post?.mintHash) {
                Linking.openURL(
                    `https://testnets.opensea.io/assets/mumbai/${contractHash}/${post?.nftCounter}`,
                ).catch(err => console.error("Couldn't load page", err));
            }

            return;
        }
    };
    const mintOnPressMemoized = async () => {
        console.log('mint button: for post', `${personaID}/posts/${postID}`);
        // Reset back to defaults

        if (post?.minted || minting) {
            if (post?.mintHash) {
                Linking.openURL(
                    `https://mumbai.polygonscan.com/tx/${mintHash}`,
                ).catch(err => console.error("Couldn't load page", err));
            }

            return;
        }

        setMinting(true);
        try {
            const token = await auth().currentUser.getIdToken(true);

            let response = await fetch(
                `${SERVER_URL}/mint/${personaID}/${postID}/${userID}`,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        personaid: personaID,
                        postid: postID,
                        userid: userID,
                    }),
                },
            );
            let responseJson = await response.json();
            console.log(responseJSon);
            return responseJson;
        } catch (error) {
            console.error(error);
        }
    }; /*, [
  minting,
  //setMinting,
    postID,
    mintHash,
    post,
    post?.minted,
    post?.subPersonaID,
    post?.pid,
    persona?.pid,
    persona,
    personaID,
  ]);*/

    const monoOrRegular = true || post?.minted ? fonts.mono : fonts.regular;

    let red = dim ? colors.maxFaded : colors.emphasisRed;
    let tiny = numColumns === 3;

    return <></>;
    return !minting && dim && !post?.mintHash ? (
        <></>
    ) : minting && !post?.mintHash ? (
        <View style={{...Styles.optionsButton, ...containerStyle}}>
            <Text
                style={{
                    ...baseText,
                    color: isCurrentUserAuthor ? red : colors.maxFaded,
                    fontFamily: monoOrRegular,
                    fontSize: tiny ? 10 : dim ? 9 : 12,
                }}>
                minting
            </Text>
        </View>
    ) : (
        <View style={{...Styles.optionsButton, ...containerStyle}}>
            <View
                style={{
                    padding: 0.5,
                    backgroundColor: background ? '' : colors.topBackground,
                    borderRadius: size * 1.7,
                    borderColor: 'magenta',
                    borderWidth: 0,
                    borderColor: colors.maxFaded,
                    zIndex: 9999,
                    flexDirection: dim && numColumns !== 3 ? 'row' : 'column',
                }}>
                {false && (
                    <TouchableOpacity
                        hitSlop={{top: 10, bottom: 30, left: 20, right: 20}}
                        disabled={
                            (!isCurrentUserAuthor && !post?.minted) ||
                            dim ||
                            minting
                        }
                        style={{flex: 1, borderWidth: 0, borderColor: 'blue'}}
                        onPress={mintOnPressMemoized}>
                        <View
                            style={{
                                flexDirection: 'row',
                                padding: 4,
                                paddingLeft: 7,
                                borderRadius: 25,
                                width: post?.minted
                                    ? dim
                                        ? '300%'
                                        : '100%'
                                    : isCurrentUserAuthor
                                    ? Platform.OS === 'android'
                                        ? 80
                                        : 75
                                    : Platform.OS === 'android'
                                    ? 85
                                    : 78,
                                ...style,
                                borderColor: isCurrentUserAuthor
                                    ? red
                                    : colors.maxFaded,
                                borderWidth:
                                    !post?.minted && isCurrentUserAuthor && !dim
                                        ? 0.4
                                        : 0,
                            }}>
                            {Boolean(post?.minted && post?.mintHash) && (
                                <Image
                                    source={images.polygon}
                                    style={{
                                        top: dim ? 2 : 3,
                                        width: 18,
                                        height: 18,
                                        marginRight: 7,
                                    }}
                                />
                            )}
                            <Text
                                style={{
                                    ...baseText,
                                    color: isCurrentUserAuthor
                                        ? red
                                        : colors.maxFaded,
                                    fontFamily: monoOrRegular,
                                    fontSize: tiny ? 10 : dim ? 9 : 12,
                                }}>
                                {!post?.minted
                                    ? isCurrentUserAuthor && !dim
                                        ? 'mint nft'
                                        : 'unminted'
                                    : post?.mintHash
                                    ? dim
                                        ? mintHash.substring(0, 8)
                                        : mintHash
                                    : 'minting'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}

                {Boolean(post?.minted && post?.mintHash && post?.ipfs_cid) && (
                    <TouchableOpacity
                        hitSlop={{top: 10, bottom: 30, left: 20, right: 20}}
                        disabled={!isCurrentUserAuthor && !post?.minted}
                        style={{flex: 1, borderWidth: 0, borderColor: 'red'}}
                        onPress={displayOnPressMemoized}>
                        <View
                            style={{
                                flexDirection: 'row',
                                top: dim ? 3 : 0,
                                marginLeft: dim ? 7 : 0,
                                padding: dim ? 0 : 4,
                                paddingLeft: dim
                                    ? numColumns === 3
                                        ? 1.5
                                        : 4
                                    : 7,
                                borderRadius: 25,
                                width: dim ? 48 : 68,
                                ...style,
                                borderColor: isCurrentUserAuthor
                                    ? red
                                    : colors.maxFaded,
                                borderWidth: 0,
                            }}>
                            <Image
                                source={images.opensea}
                                style={{
                                    marginRight: 6,
                                    top: dim ? 2.5 : 2,
                                    width: 18,
                                    height: 18,
                                }}
                            />
                            <Text
                                style={{
                                    ...baseText,
                                    color: isCurrentUserAuthor
                                        ? red
                                        : colors.maxFaded,
                                    fontFamily: monoOrRegular,
                                    fontSize: tiny
                                        ? 10
                                        : dim
                                        ? Platform.OS === 'android'
                                            ? 8
                                            : 9
                                        : 12,
                                }}>
                                {'opensea'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

export const Styles = StyleSheet.create({
    container: {
        borderColor: 'purple',
        borderWidth: 0,
        zIndex: 99,
        elevation: 99,
        borderRadius: 25,
        padding: 8,
        marginStart: 10,
        marginEnd: 10,
        backgroundColor: colors.studioBtn,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        marginBottom: -20,
        marginTop: 15,
        marginTop: 20,
        alignItems: 'center',
    },
    personImage: {
        width: 30,
        height: 30,
        borderRadius: 30,
    },
    personName: {
        color: colors.text,
        marginStart: 10,
        fontWeight: 'bold',
    },
    iconMore: {
        height: 15,
        width: 15,
    },
    selectPersonaForHomeIcon: {
        width: 25,
        height: 25,
    },
    optionsButton: {
        marginLeft: 5,
    },
});
