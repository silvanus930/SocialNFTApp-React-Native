import React, {useCallback} from 'react';
import {View, Pressable, TextInput, Keyboard} from 'react-native';
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {connectSearchBox} from 'react-instantsearch-native';

import {images} from 'resources';

import styles from './styles';

const SearchBox = connectSearchBox(
    ({
        setSearchVal,
        searchVal,
        prevSearch,
        setPrevSearch,
        refine,
        query,
        inputRef,
    }) => {
        const handleInput = useCallback(
            value => {
                setSearchVal(value);
                refine(value);
            },
            [refine, setSearchVal],
        );

        const handleSaveDataToStorage = useCallback(() => {
            if (searchVal?.length > 2) {
                (async () => {
                    let prevStates = [
                        ...new Set([...prevSearch, searchVal]),
                    ].slice(-6);
                    setPrevSearch(prevStates);
                    await AsyncStorage.setItem(
                        'prevSearch',
                        JSON.stringify(prevStates),
                    );
                })();
            }
        }, [searchVal, setPrevSearch, prevSearch]);

        const handleAltSearch = useCallback(() => {
            Keyboard.dismiss();
            inputRef?.current?.clear();
            refine('');
            setSearchVal('');
            handleSaveDataToStorage();
        }, [handleSaveDataToStorage, inputRef, setSearchVal, refine]);

        return (
            <View style={styles.searchContainer}>
                <TextInput
                    ref={inputRef}
                    style={styles.searchTextInput}
                    autoComplete={'off'}
                    autoCapitalize={'none'}
                    placeholder="Search"
                    placeholderTextColor="#D0D3D6"
                    onChangeText={handleInput}
                    value={query}
                />
                <Pressable
                    onPress={handleAltSearch}
                    style={styles.searchIconContainer}>
                    <FastImage
                        style={styles.searchIcon}
                        source={
                            searchVal ? images.close : images.magnifyingGlass
                        }
                    />
                </Pressable>
            </View>
        );
    },
);

export default React.memo(SearchBox);
