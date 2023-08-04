import React, {Component} from 'react';
import baseText from 'resources/text';
import {
    Image,
    View,
    ListView,
    StyleSheet,
    Text,
    TouchableHighlight,
} from 'react-native';

import SelectedPicture from './SelectedPicture';

class ViewPictures extends Component {
    state = {
        ds: new ListView.DataSource({
            rowHasChanged: (r1, r2) => r1 !== r2,
        }),
        showSelectedPicture: false,
        uri: '',
    };

    renderRow(rowData) {
        const {uri} = rowData.node.image;
        return (
            <TouchableHighlight
                onPress={() =>
                    this.setState({showSelectedPicture: true, uri: uri})
                }>
                <Image
                    source={{uri: rowData.node.image.uri}}
                    style={styles.image}
                />
            </TouchableHighlight>
        );
    }

    render() {
        const {showSelectedPicture, uri} = this.state;

        if (showSelectedPicture) {
            return <SelectedPicture uri={uri} />;
        }
        return (
            <View style={{flex: 1}}>
                <View style={{alignItems: 'center', marginTop: 15}}>
                    <Text
                        style={{...baseText, fontSize: 30, fontWeight: '700'}}>
                        Pick A Picture !
                    </Text>
                </View>
                <ListView
                    contentContainerStyle={styles.list}
                    dataSource={this.state.ds.cloneWithRows(
                        this.props.pictureArray,
                    )}
                    renderRow={rowData => this.renderRow(rowData)}
                    enableEmptySections={true}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    list: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },

    image: {
        width: 120,
        height: 130,
        marginLeft: 15,
        marginTop: 15,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#efefef',
    },
});

export default ViewPictures;
