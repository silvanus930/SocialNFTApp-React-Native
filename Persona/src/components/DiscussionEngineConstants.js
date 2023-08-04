import DeviceInfo from 'react-native-device-info';

const iphoneNotchSafeAreaOffset = 38;
export const safeAreaOffset = DeviceInfo.hasNotch()
    ? iphoneNotchSafeAreaOffset
    : 0;
const iphoneNotchSafeAreaOffsetOpen = 32;
export const safeAreaOffsetKeyboardOpen = DeviceInfo.hasNotch()
    ? iphoneNotchSafeAreaOffsetOpen
    : 0;
