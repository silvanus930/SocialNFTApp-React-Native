import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
    container: {
        borderColor: 'purple',
        borderWidth: 0,
        display: 'flex',
        backgroundColor: '#292C2E',
    },
    subContainer: {
        height: 180,
        marginStart: 5,
        display: 'flex',
        flexDirection: 'row',
        paddingTop: 60,
        paddingLeft: 10,
    },
    profileImage: {
        marginLeft: 5,
        marginRight: 0,
        marginTop: 10,
        paddingTop: 2,
        borderColor: 'white',
        borderWidth: 0,
        width: 30,
        height: 30,
        borderRadius: 30,
    },
    channelNameContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
    channelNameText: {
        marginTop: 0,
        padding: 10,
        paddingBottom: 5,
        fontSize: 22,
        color: '#D0D3D6',
    },
    subChannelNameText: {
        fontSize: 18,
        color: '#A0AEB2',
        padding: 10,
        paddingTop: 0,
    },
});

export default styles;
