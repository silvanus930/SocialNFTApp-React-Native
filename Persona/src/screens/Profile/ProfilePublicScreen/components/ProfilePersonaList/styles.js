import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
    container: {
        borderColor: 'purple',
        margin: 0,
        marginBottom: 0,
        padding: 0,
        flex: 1,
        backgroundColor: '#111314',
    },
    flatListColumnWrapper: {
        marginStart: 0,
        marginEnd: 0,
        borderColor: 'yellow',
        borderWidth: 0,
        flex: 1,
        flexDirection: 'row',
    },
    flatListFooterContainer: {
        height: 20,
        marginHorizontal: 20,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        backgroundColor: '#1B1D1F',
        marginBottom: 20,
    },

    //
    profileItemContainer: (index, filteredPersonaList) => {
        let marginLeft = index % 2 == 0 ? 20 : 0;
        let marginRight = index % 2 == 0 ? 0 : 20;

        // special case for a single NFT on the last row
        if (
            index == filteredPersonaList.length - 1 &&
            filteredPersonaList.length % 2 == 1
        ) {
            marginLeft = marginRight = 20;
        }

        return {
            borderWidth: 0,
            borderColor: 'purple',
            flex: 1,
            backgroundColor: '#1B1D1F',
            marginLeft: marginLeft,
            marginRight: marginRight,
            paddingBottom: 12,
        };
    },
});

export default styles;
