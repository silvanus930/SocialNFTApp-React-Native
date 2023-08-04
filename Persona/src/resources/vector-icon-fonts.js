import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import Fontisto from 'react-native-vector-icons/Fontisto';

export const loadVectorIconFonts = () => {
    Feather.loadFont();
    Ionicons.loadFont();
    FontAwesome.loadFont();
    AntDesign.loadFont();
    MaterialCommunityIcons.loadFont();
    Entypo.loadFont();
    Fontisto.loadFont();
};
