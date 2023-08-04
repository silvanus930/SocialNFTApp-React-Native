import {StyleSheet} from 'react-native';

export const PROFILE_TOP_OFFSET = -40;
const HEADER_IMAGE_HEIGHT = 202;

const styles = StyleSheet.create({
    container: {paddingHorizontal: 20},

    // NEW // OLD //
    innerContainer: {
        paddingHorizontal: 20,
        top: PROFILE_TOP_OFFSET,
    },
    headerImageContainer: {
        height: HEADER_IMAGE_HEIGHT,
    },
    headerImage: {
        height: HEADER_IMAGE_HEIGHT,
        opacity: 1,
    },
    uploadHeaderImageContainer: {
        zIndex: 9999999,
    },

    profileImageContainer: {
        width: 105,
    },

    profilePic: {
        width: 105,
        height: 105,
        borderRadius: 100,
        borderColor: '#111314',
        borderWidth: 4,
    },

    username: {
        color: 'white',
        fontSize: 24,
        fontWeight: '500',
    },
    bio: {
        color: 'white',
        fontSize: 16,
        fontWeight: '400',
        marginTop: 7,
        marginBottom: 5,
    },
    localtime: {
        color: '#868B8F',
        fontSize: 14,
        fontWeight: '400',
    },

    //

    interactionContainer: {
        borderColor: 'red',
        marginTop: 20,
        backgroundColor: '#1B1D1F',
        borderRadius: 8,
        marginBottom: 6,
        padding: 12,
        flex: 1,
        flexDirection: 'row',
        gap: 12,
    },

    interactionSection: {
        backgroundColor: '#2E3133',
        padding: 10,
        borderRadius: 6,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
    },

    interactionText: {
        color: '#D8D3D6',
        fontSize: 14,
        fontWeight: '500',
    },

    interactionIconMessage: {
        width: 17.5,
        height: 16.25,
        marginBottom: 3,
    },

    interactionIconCall: {
        width: 16,
        height: 16,
        marginBottom: 3,
    },

    interactionIconDeposit: {
        width: 16.25,
        height: 16.25,
        marginBottom: 3,
    },

    //

    buttonContainer: {
        position: 'absolute',
        right: 60,
        top: 20,
        borderColor: 'red',
        borderWidth: 0,
        width: 150,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#AAAEB2',
        backgroundColor: '#292C2E',
        padding: 7,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 0,
    },

    buttonText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14,
    },

    //
    contentContainer: {
        borderColor: 'red',
        marginTop: 12,
        backgroundColor: '#1B1D1F',
        borderRadius: 8,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    contentContainerHeaderText: {
        color: '#AAAEB2',
        fontSize: 14,
        fontWeight: '500',
    },

    contentContainerRoles: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#424547',
    },
    contentContainerNFTs: {
        padding: 12,
    },

    //
    contentContainerRolePills: {
        flexDirection: 'row',
        gap: 10,
        marginVertical: 10,
        marginBottom: 0,
    },
    rolePill: {
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rolePillText: {
        color: '#EFE9DF',
        fontWeight: '500',
        fontSize: 14,
    },

    rolePillFounder: {
        backgroundColor: '#694F28',
    },
    rolePillAdmin: {
        backgroundColor: '#48275D',
    },
    rolePillEngineer: {
        backgroundColor: '#27405D',
    },
    rolePillDesigner: {
        backgroundColor: '#205241',
    },

    //
    cameraIcon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        color: 'rgba(255,255,255,0.777)',
    },
    cameraIconHeader: {
        position: 'absolute',
        bottom: -8,
        right: 5,
        color: 'white',
        zIndex: 9999,
    },

    // ------------------------------------------------------------------------
    // -- SMALL ---------------------------------------------------------------
    // ------------------------------------------------------------------------

    smallContainer: {
        margin: 12,
        borderWidth: 1,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 8,
        borderStyle: 'dashed',
        borderColor: '#868B8F',
    },

    smallInnerTopContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    smallInnerBottomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },

    smallTotalBalanceText: {
        fontSize: 14,
        fontWeight: '400',
        color: '#BFC3C7',
    },

    smallSpacerText: {
        fontSize: 14,
        fontWeight: '400',
        marginHorizontal: 5,
        color: '#BFC3C7',
    },
    smallViewAllAssetsText: {
        fontSize: 14,
        fontWeight: '400',
        color: '#FFF',
        textDecorationLine: 'underline',
    },

    smallActionButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 6,
        borderColor: '#AAAEB2',
        padding: 7,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        alignItems: 'center',
    },

    smallActionButtonWithdraw: {
        marginLeft: 12,
    },

    smallActionButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#FFF',
    },

    reportButton: {
        right: 0,
        margin: 20,
        position: 'absolute',
    },
});

export default styles;
