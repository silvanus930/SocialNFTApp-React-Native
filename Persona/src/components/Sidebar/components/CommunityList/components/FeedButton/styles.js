import {StyleSheet} from 'react-native';
import {constants} from 'resources';

const styles = StyleSheet.create({
    container: {
        borderColor: 'magenta',
        borderWidth: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subContainer: selected => ({
        borderWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 2,
        paddingBottom: 1,
        opacity: selected ? 1 : 0.4,
        borderColor: selected ? 'red' : null,
    }),
    icon: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 2,
        height: constants.personaProfileSize + 4,
        width: constants.personaProfileSize + 4,
        borderRadius: 6,
    },
});

export default styles;
