import {StyleSheet} from 'react-native';

import {colors, palette} from 'resources';

const styles = StyleSheet.create({
    artistTimeline: {
        ...palette.timeline.line,
        position: 'absolute',
        top: -5,
        width: 2,
        height: 70,
        left: -64,
        marginTop: -11.5,
        zIndex: 4,
    },
    artistPost: {
        flex: 1,
        paddingRight: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.timeline,
        marginRight: 22,
        marginLeft: 33,
        marginTop: 10,
        paddingLeft: -20,
        marginBottom: 15,
        backgroundColor: colors.homeBackground,
    },
    artistPostBreakout: {
        position: 'absolute',
        marginLeft: -29,
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderBottomLeftRadius: 25,
        width: 70,
        height: 40,
        top: -15,
        borderBottomColor: colors.timeline,
        borderLeftColor: colors.timeline,
        zIndex: 3,
    },
});

export default styles;
