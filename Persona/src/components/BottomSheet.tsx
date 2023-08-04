import React, {PropsWithChildren, useCallback, useEffect} from 'react';
import {BlurView} from '@react-native-community/blur';
import {View, Keyboard, KeyboardEventListener, Platform} from 'react-native';
import {
    BottomSheetModal,
    BottomSheetView,
    BottomSheetScrollView,
    BottomSheetBackdropProps,
    BottomSheetBackdrop,
    BottomSheetBackgroundProps,
    useBottomSheetInternal,
} from '@gorhom/bottom-sheet';
import {propsAreEqual} from 'utils/propsAreEqual';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const BottomSheetMemo = React.memo(BottomSheet, propsAreEqual);
export default BottomSheetMemo;

const Backdrop = React.memo((props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        {...props}
        onPress={() => Keyboard.dismiss()}
    />
));

const CustomBackground: React.FC<BottomSheetBackgroundProps> = ({style}) => {
    if (Platform.OS === 'ios') {
        return (
            <BlurView
                blurType={'dark'}
                blurRadius={3}
                blurAmount={8}
                reducedTransparencyFallbackColor="black"
                // style={[style]}
                style={style}
            />
        );
    }

    return <View style={style} />;
};

const KeyboardHandler: React.FC<{}> = () => {
    const {shouldHandleKeyboardEvents} = useBottomSheetInternal();

    const keyboardWillShow: KeyboardEventListener = useCallback(() => {
        shouldHandleKeyboardEvents.value = true;
    }, [shouldHandleKeyboardEvents]);
    const keyboardWillHide: KeyboardEventListener = useCallback(() => {
        shouldHandleKeyboardEvents.value = true;
    }, [shouldHandleKeyboardEvents]);

    React.useEffect(() => {
        const willShow = Keyboard.addListener(
            'keyboardWillShow',
            keyboardWillShow,
        );
        const willHide = Keyboard.addListener(
            'keyboardWillHide',
            keyboardWillHide,
        );
        const didShow = Keyboard.addListener(
            'keyboardDidShow',
            keyboardWillShow,
        );
        const didHide = Keyboard.addListener(
            'keyboardDidHide',
            keyboardWillHide,
        );
        return () => {
            willShow && willShow.remove();
            willHide && willHide.remove();
            didShow && didShow.remove();
            didHide && didHide.remove();
        };
    }, [keyboardWillHide, keyboardWillShow]);

    return <></>;
};

function BottomSheet({
    showToggle,
    touchAnywhereToClose = false,
    shouldHandleKeyboard = true,
    snapPoints = ['80%'],
    toggleModalVisibility,
    scrollable = false,
    showHandle = true,
    children,
}: PropsWithChildren<{
    showToggle: boolean;
    snapPoints?: string[];
    touchAnywhereToClose?: boolean; // TODO: Clearer name
    shouldHandleKeyboard?: boolean; // TODO: Clearer name
    scrollable?: boolean;
    showHandle?: boolean;
    toggleModalVisibility: () => void;
}>): JSX.Element {
    const bottomSheetModalRef = React.useRef<BottomSheetModal | null>(null);
    const insets = useSafeAreaInsets();

    const onDismiss = React.useCallback(() => {
        if (showToggle) {
            toggleModalVisibility();
        }
    }, [showToggle, toggleModalVisibility]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | null = null;

        if (showToggle) {
            bottomSheetModalRef.current?.present();
            timeout = setTimeout(() => {
                bottomSheetModalRef.current?.snapToPosition(snapPoints[0]);
            }, 100);
        } else {
            bottomSheetModalRef.current?.close();
        }

        return () => {
            if (timeout !== null) {
                clearTimeout(timeout);
            }
        };
    }, [showToggle, snapPoints]);

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={-1}
            snapPoints={snapPoints}
            // topInset={insets.top}
            keyboardBehavior={'interactive'}
            keyboardBlurBehavior={'restore'}
            backdropComponent={Backdrop}
            backgroundComponent={CustomBackground}
            enablePanDownToClose={true}
            enableDismissOnClose
            onDismiss={onDismiss}
            enableOverDrag={false}
            handleIndicatorStyle={{
                backgroundColor: '#ddd',
                borderTopRightRadius: 16,
                borderTopLeftRadius: 16,
            }}
            handleStyle={{
                borderWidth: 0,
                borderTopRightRadius: 16,
                borderTopLeftRadius: 16,
            }}
            handleComponent={showHandle ? undefined : null}
            style={{
                borderTopRightRadius: 16,
                borderTopLeftRadius: 16,
            }}
            backgroundStyle={{
                ...(Platform.OS === 'ios'
                    ? {}
                    : {backgroundColor: 'rgba(30, 30, 30, 0.9)'}),
                borderTopRightRadius: 16,
                borderTopLeftRadius: 16,
            }}>
            {showToggle && shouldHandleKeyboard && <KeyboardHandler />}
            {scrollable ? (
                <BottomSheetScrollView
                    keyboardDismissMode={'interactive'}
                    style={{flex: 1, paddingBottom: insets.bottom}}>
                    {children}
                </BottomSheetScrollView>
            ) : (
                <BottomSheetView
                    style={{flex: 1, paddingBottom: insets.bottom}}>
                    {children}
                </BottomSheetView>
            )}
        </BottomSheetModal>
    );
}
