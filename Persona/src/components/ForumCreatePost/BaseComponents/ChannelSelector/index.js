import React, {useState, useContext, useMemo} from 'react';
import {Platform} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import FastImage from 'react-native-fast-image';
import {images, colors} from 'resources';
import auth from '@react-native-firebase/auth';
import getResizedImageUrl from 'utils/media/resize';
import styles from './styles';
import {CommunityStateRefContext} from 'state/CommunityStateRef';
import {GlobalStateRefContext} from 'state/GlobalStateRef';

const ChannelImage = uri => {
    return (
        <FastImage
            style={styles.profileImageStyle}
            source={{
                uri:
                    (uri?.uri || images.personaDefaultProfileUrl) ===
                    images.personaDefaultProfileUrl
                        ? images.personaDefaultProfileUrl
                        : getResizedImageUrl({
                              origUrl: uri?.uri,
                              width: 30,
                              height: 30,
                          }),
            }}
        />
    );
};

const ChannelSelector = ({
    selectedValue,
    setSelectedValue,
    setIsCommunitySelected,
    isDisabled,
}) => {
    const {
        current: {communityMap, currentCommunity},
    } = useContext(CommunityStateRefContext);
    const {
        current: {personaMap},
    } = useContext(GlobalStateRefContext);

    const communityProjectsList = useMemo(() => {
        const community = communityMap[currentCommunity];
        const cpl = community?.projects
            .filter(projectID => {
                const project = personaMap[projectID];
                return (
                    !project?.deleted &&
                    (!project?.private ||
                        (project?.private &&
                            project?.authors?.includes(auth().currentUser.uid)))
                );
            })
            .map(projectID => {
                const project = personaMap[projectID];
                return {
                    label: project?.name,
                    value: projectID,
                    ...(Platform.OS === 'android' && {
                        color: 'black',
                    }),
                    // eslint-disable-next-line react/no-unstable-nested-components
                    icon: () => (
                        <ChannelImage
                            uri={
                                project?.profileImgUrl ||
                                images.personaDefaultProfileUrl
                            }
                        />
                    ),
                };
            });
        return [
            {
                label: community?.name,
                value: currentCommunity,
                ...(Platform.OS === 'android' && {
                    color: 'black',
                }),
                // eslint-disable-next-line react/no-unstable-nested-components
                icon: () => (
                    <ChannelImage
                        uri={
                            community?.profileImgUrl ||
                            images.personaDefaultProfileUrl
                        }
                    />
                ),
            },
        ].concat(cpl);
    }, [communityMap, currentCommunity, personaMap]);

    const [open, setOpen] = useState(false);

    return (
        <DropDownPicker
            open={open}
            value={selectedValue}
            items={communityProjectsList}
            setOpen={setOpen}
            setValue={setSelectedValue}
            onChangeValue={value => {
                setIsCommunitySelected(value === communityProjectsList[0]);
            }}
            containerStyle={{height: 60}}
            disabled={isDisabled}
            disabledStyle={{opacity: 0.5}}
            dropDownContainerStyle={{
                backgroundColor: '#2E3133',
                borderColor: '#2E1211',
            }}
            style={{backgroundColor: '#2E3133', borderWidth: 0, height: 20}}
            textStyle={{
                fontSize: 15,
                color: 'white',
            }}
            arrowIconStyle={{
                tintColor: '#868B8F',
            }}
            tickIconStyle={{tintColor: '#868B8F'}}
        />
    );
};

export default ChannelSelector;
