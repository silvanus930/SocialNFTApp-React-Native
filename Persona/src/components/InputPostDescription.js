import baseText from 'resources/text';
import colors from 'resources/colors';
import React, {useEffect, useCallback} from 'react';
import {View, StyleSheet, TextInput, KeyboardAvoidingView} from 'react-native';
import _ from 'lodash';
import {UserAutocompleteContext} from 'state/UserAutocompleteState';
import {getClosestWord} from 'utils/helpers';

export default function InputPostDescription({
    localPostText,
    setLocalPostText,
    personaName,
}) {
    const cursorPositionRef = React.useRef(null);
    const keyPressRef = React.useRef(false);
    const postFlavorText = `Submit post for @${personaName}...`;
    const {
        query: autocompleteQuery,
        setQuery: setAutocompleteQuery,
        selectedUser: autocompleteSelectedUser,
        setSelectedUser: setAutocompleteSelectedUser,
        setDialogAllowed: setAutocompleteDialogAllowed,
    } = React.useContext(UserAutocompleteContext);

    const maybeUpdateAutocomplete = useCallback(
        (text, cursor) => {
            const {closestWord} = getClosestWord(text, cursor);
            if (
                closestWord.startsWith('@') &&
                closestWord.length > 1 &&
                (closestWord.slice(1) !== autocompleteQuery ||
                    autocompleteQuery === null)
            ) {
                setAutocompleteQuery(closestWord.slice(1));
            } else if (
                autocompleteQuery !== null &&
                closestWord.slice(1) !== autocompleteQuery
            ) {
                setAutocompleteQuery(null);
            }
        },
        [autocompleteQuery, setAutocompleteQuery],
    );

    const onChangePostText = useCallback(
        text => {
            setLocalPostText(text);
            if (cursorPositionRef.current !== null) {
                maybeUpdateAutocomplete(text, cursorPositionRef.current);
                keyPressRef.current = false;
            }
        },
        [maybeUpdateAutocomplete],
    );

    const onPostTextSelectionChange = useCallback(
        event => {
            // Runs before onChangeText
            const cursor = event.nativeEvent.selection.start;
            cursorPositionRef.current = cursor;
            // If the user is typing only update autocompleteQuery in the change
            // text handler.
            if (!keyPressRef.current) {
                maybeUpdateAutocomplete(localPostText, cursor);
            }
        },
        [localPostText, maybeUpdateAutocomplete],
    );

    useEffect(() => {
        if (
            cursorPositionRef.current !== null &&
            autocompleteSelectedUser !== null
        ) {
            const cursor = cursorPositionRef.current;
            const {start, closestWord} = getClosestWord(localPostText, cursor);
            const end = start + closestWord.length;
            const replacementText =
                localPostText.substring(0, start) +
                `@${autocompleteSelectedUser} ` +
                localPostText.substring(end);
            setLocalPostText(replacementText);
            setAutocompleteSelectedUser(null);
        }
    }, [autocompleteSelectedUser, localPostText, setAutocompleteSelectedUser]);

    return (
        <KeyboardAvoidingView>
            <TextInput
                editable={true}
                autofocus={true}
                autoCapitalize="none"
                multiline={true}
                height={20000}
                placeholder={postFlavorText}
                placeholderTextColor={colors.timestamp}
                textAlign={'left'}
                keyboardAppearance={'dark'}
                textAlignVertical={'top'}
                justifyContext={'left'}
                onChangeText={onChangePostText}
                onSelectionChange={onPostTextSelectionChange}
                onFocus={() => setAutocompleteDialogAllowed(true)}
                onBlur={() => setAutocompleteDialogAllowed(false)}
                onKeyPress={() => (keyPressRef.current = true)}
                inputAccessoryViewID="captionInput"
                value={localPostText}
                style={Styles.captionInput}
            />
            <View style={{height: 200}} />
        </KeyboardAvoidingView>
    );
}

const Styles = StyleSheet.create({
    captionInput: {
        ...baseText,
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        flex: 1,
        color: 'white',
        fontSize: 19,
        marginLeft: 20,
        marginRight: 20,
        paddingRight: 40,
        marginTop: 15,
        marginBottom: 280,
    },
});
