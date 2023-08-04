import React from 'react';
import fonts from 'resources/fonts';
import baseText from 'resources/text';
import {View, Linking, Text, StyleSheet, Animated} from 'react-native';
import colors from 'resources/colors';
import {FeedMenuDispatchContext} from 'state/FeedStateContext';
import {GlobalStateRefContext} from 'state/GlobalStateRef';
import {ProfileModalStateRefContext} from 'state/ProfileModalStateRef';
import useDebounce from 'hooks/useDebounce';
import {useNavigation} from '@react-navigation/native';
import Latex from 'react-native-latex';
import MathJax from 'react-native-mathjax';

var linkify = require('linkify-it')();

// Reload full tlds list & add unofficial `.onion` domain.
linkify
    .tlds(require('tlds')) // Reload with full tlds list
    .tlds('onion', true) // Add unofficial `.onion` domain
    .add('git:', 'http:') // Add `git:` protocol as "alias"
    .add('ftp:', null) // Disable `ftp:` protocol
    .set({fuzzyIP: true}); // Enable IPs in fuzzy links (without schema)

// NOTE: If you change this regex you must update the corresponding
// regexes in the @-mention activity listeners
const MENTION = /(@\w+)/gi;
const BOLD = /\*([^*]+)\*/gi;
const ITALICS = /_([^_]+)_/gi;
const QUOTE = /`([^`]+)`/gi;
const BIG = /(#\w+)/gi;
const LATEX = /\$\$([^$]+)\$\$/gi;

// todo - inefficient - implement a real text parser not based on regex lol
function parseStaticRichText(
    mutableListToAddTo,
    textToParse,
    disableStaticRichText,
    groupCounter,
) {
    const latexSplit = disableStaticRichText
        ? [textToParse]
        : textToParse.split(LATEX);
    [...latexSplit.entries()].map(([latexIndex, maybeLatexSegment]) => {
        const isLatex = latexIndex % 2;
        if (isLatex) {
            mutableListToAddTo.push({
                latex: true,
                text: maybeLatexSegment,
            });
            mutableListToAddTo.push([]);
            groupCounter += 2;
        } else {
            const bigSplit = disableStaticRichText
                ? [maybeLatexSegment]
                : maybeLatexSegment.split(BIG);
            [...bigSplit.entries()].map(([bigIndex, maybeBigSegment]) => {
                const isBig = bigIndex % 2;
                if (isBig) {
                    mutableListToAddTo.push({
                        heading: true,
                        text: maybeBigSegment,
                    });
                    mutableListToAddTo.push([]);
                    groupCounter += 2;
                } else {
                    const italicsSplit = disableStaticRichText
                        ? [maybeBigSegment]
                        : maybeBigSegment.split(ITALICS);
                    [...italicsSplit.entries()].map(
                        ([italicsIndex, maybeItalicsSegment]) => {
                            const isItalics = italicsIndex % 2;
                            if (isItalics) {
                                mutableListToAddTo[groupCounter].push({
                                    part: 'textItalics',
                                    text: maybeItalicsSegment,
                                });
                            } else {
                                const boldSplit = disableStaticRichText
                                    ? [maybeItalicsSegment]
                                    : maybeItalicsSegment.split(BOLD);
                                [...boldSplit.entries()].map(
                                    ([boldIndex, maybeBoldSegment]) => {
                                        const isBold = boldIndex % 2;
                                        if (isBold) {
                                            mutableListToAddTo[
                                                groupCounter
                                            ].push({
                                                part: 'textBold',
                                                text: maybeBoldSegment,
                                            });
                                        } else {
                                            const quoteSplit =
                                                disableStaticRichText
                                                    ? [maybeBoldSegment]
                                                    : maybeBoldSegment.split(
                                                          QUOTE,
                                                      );
                                            [...quoteSplit.entries()].map(
                                                ([
                                                    quoteIndex,
                                                    maybeQuoteSegment,
                                                ]) => {
                                                    const isQuote =
                                                        quoteIndex % 2;
                                                    if (isQuote) {
                                                        mutableListToAddTo[
                                                            groupCounter
                                                        ].push({
                                                            part: 'textQuote',
                                                            text:
                                                                '“' +
                                                                maybeQuoteSegment +
                                                                '”',
                                                        });
                                                    } else {
                                                        mutableListToAddTo[
                                                            groupCounter
                                                        ].push({
                                                            part: 'text',
                                                            text: maybeQuoteSegment,
                                                        });
                                                    }
                                                },
                                            );
                                        }
                                    },
                                );
                            }
                        },
                    );
                }
            });
        }
    });
}

function parseText(userMap, text, disableStaticRichText) {
    const mentionSplit = text.split(MENTION);
    let textSnippetGroups = [[]];
    let groupCounter = 0;
    [...mentionSplit.entries()].map(([mentionIndex, textSegment]) => {
        const maybeUserName = textSegment.slice(1);
        const foundUser =
            Object.values(userMap).find(
                ({userName}) => userName === maybeUserName,
            ) !== undefined;
        const isMention = mentionIndex % 2 && foundUser;
        if (isMention) {
            textSnippetGroups[groupCounter].push({
                part: 'mention',
                text: textSegment,
            });
        } else {
            const matches = linkify.match(textSegment) || [];
            let currentIndex = 0;
            for (const match of matches) {
                const {index: startMatch, lastIndex: endMatch} = match;
                parseStaticRichText(
                    textSnippetGroups,
                    textSegment.slice(currentIndex, startMatch),
                    disableStaticRichText,
                    groupCounter,
                );
                textSnippetGroups[groupCounter].push({
                    part: 'link',
                    text: textSegment.slice(startMatch, endMatch),
                });
                currentIndex = endMatch;
            }
            if (currentIndex < textSegment.length) {
                parseStaticRichText(
                    textSnippetGroups,
                    textSegment.slice(currentIndex, textSegment.length),
                    disableStaticRichText,
                    groupCounter,
                );
            }
        }
    });
    return textSnippetGroups;
}

function ParseText({
    style = {},
    size = 18,
    text,
    disabled = false,
    onPressDefault = null,
    onLongPressDefault = null,
    disableStaticRichText = false,
}) {
    const handleUrlPress = async url => {
        await Linking.openURL(url);
    };
    const navigation = useNavigation();

    const profileModalContextRef = React.useContext(
        ProfileModalStateRefContext,
    );
    const navToProfile = useDebounce(
        userID => {
            profileModalContextRef.current.csetState({
                showToggle: true,
                userID: userID,
            });
        },
        [navigation],
    );

    const {
        current: {userMap},
    } = React.useContext(GlobalStateRefContext);

    const handleMentionPress = name => {
        const maybeUserName = name.slice(1);
        const foundUser = Object.values(userMap).find(
            ({userName}) => userName === maybeUserName,
        );
        if (foundUser !== undefined) {
            navToProfile(foundUser.uid);
        }
    };

    const partConfig = {
        text: {
            style: {},
            onPress:
                !disabled && onPressDefault !== null
                    ? (partText, {nativeEvent: {pageY}}) =>
                          onPressDefault({partText, pageY})
                    : null,
            onLongPress:
                onLongPressDefault !== null ? onLongPressDefault : null,
        },
        textBold: {
            style: {fontFamily: fonts.bold},
            onPress:
                !disabled && onPressDefault !== null
                    ? (partText, {nativeEvent: {pageY}}) =>
                          onPressDefault({partText, pageY})
                    : null,
            onLongPress:
                onLongPressDefault !== null ? onLongPressDefault : null,
        },
        textItalics: {
            style: {fontStyle: 'italic'},
            onPress:
                !disabled && onPressDefault !== null
                    ? (partText, {nativeEvent: {pageY}}) =>
                          onPressDefault({partText, pageY})
                    : null,
            onLongPress:
                onLongPressDefault !== null ? onLongPressDefault : null,
        },
        textQuote: {
            style: {color: colors.textFaded2, fontStyle: 'italic'},
            onPress:
                !disabled && onPressDefault !== null
                    ? (partText, {nativeEvent: {pageY}}) =>
                          onPressDefault({partText, pageY})
                    : null,
            onLongPress:
                onLongPressDefault !== null ? onLongPressDefault : null,
        },
        link: {
            style: {
                color: colors.actionText,
                textDecorationLine: 'underline',
            },
            onPress: disabled ? null : handleUrlPress,
            onLongPress: null,
        },
        heading: {
            style: {
                marginTop: 7,
                marginBottom: 7,
                fontFamily: fonts.semibold,
            },
            onPress:
                !disabled && onPressDefault !== null
                    ? (partText, {nativeEvent: {pageY}}) =>
                          onPressDefault({partText, pageY})
                    : null,
            onLongPress:
                onLongPressDefault !== null ? onLongPressDefault : null,
        },
        mention: {
            style: {
                color: colors.actionText,
                fontFamily: fonts.semibold,
            },
            onPress: disabled ? null : handleMentionPress,
            onLongPress: null,
        },
    };

    const textSnippetLatexGroups = parseText(
        userMap,
        text,
        disableStaticRichText,
    );

    return disableStaticRichText ? (
        <Text style={{...baseText, fontFamily: fonts.system}}>
            {[...textSnippetLatexGroups[0].entries()].map(
                ([key, {part, text: partText}]) => (
                    <Text
                        key={key}
                        onPress={
                            !disabled && partConfig[part].onPress !== null
                                ? e => partConfig[part].onPress(partText, e)
                                : null
                        }
                        onLongPress={
                            partConfig[part].onLongPress !== null
                                ? e => partConfig[part].onLongPress(partText, e)
                                : null
                        }
                        style={{
                            ...baseText,
                            ...styles.text,
                            ...style,
                            ...partConfig[part].style,
                            fontFamily: fonts.system,
                        }}>
                        {partText}
                    </Text>
                ),
            )}
        </Text>
    ) : (
        <View>
            {[...textSnippetLatexGroups.entries()].map(([key, group]) =>
                group.hasOwnProperty('latex') ? (
                    <MathJax
                        key={key}
                        html={`$$\\color{white}{${group.text}}$$`}
                        mathJaxOptions={{
                            messageStyle: 'none',
                            extensions: ['tex2jax.js'],
                            jax: ['input/TeX', 'output/HTML-CSS'],
                            tex2jax: {
                                inlineMath: [
                                    ['$', '$'],
                                    ['\\(', '\\)'],
                                ],
                                displayMath: [
                                    ['$$', '$$'],
                                    ['\\[', '\\]'],
                                ],
                                processEscapes: true,
                            },
                            TeX: {
                                extensions: [
                                    'AMSmath.js',
                                    'AMSsymbols.js',
                                    'noErrors.js',
                                    'noUndefined.js',
                                ],
                            },
                        }}
                        style={{backgroundColor: 'transparent', flex: 1}}
                    />
                ) : group.hasOwnProperty('heading') ? (
                    <Text
                        key={key}
                        onPress={
                            !disabled && partConfig.heading.onPress !== null
                                ? e => partConfig.heading.onPress(group.text, e)
                                : null
                        }
                        onLongPress={
                            partConfig.heading.onLongPress !== null
                                ? e =>
                                      partConfig.heading.onLongPress(
                                          group.text,
                                          e,
                                      )
                                : null
                        }
                        style={{
                            ...baseText,
                            lineHeight: null,
                            ...styles.text,
                            ...style,
                            ...partConfig.heading.style,
                            fontFamily: fonts.system,
                        }}>
                        {group.text}
                    </Text>
                ) : (
                    <Text
                        style={{
                            ...baseText,
                            fontFamily: fonts.system,
                            lineHeight: null,
                        }}
                        key={key}>
                        {[...group.entries()].map(
                            ([key, {part, text: partText}]) => (
                                <Text
                                    key={key}
                                    onPress={
                                        !disabled &&
                                        partConfig[part].onPress !== null
                                            ? e =>
                                                  partConfig[part].onPress(
                                                      partText,
                                                      e,
                                                  )
                                            : null
                                    }
                                    onLongPress={
                                        partConfig[part].onLongPress !== null
                                            ? e =>
                                                  partConfig[part].onLongPress(
                                                      partText,
                                                      e,
                                                  )
                                            : null
                                    }
                                    style={{
                                        ...styles.text,
                                        ...style,
                                        ...partConfig[part].style,
                                    }}>
                                    {partText}
                                </Text>
                            ),
                        )}
                    </Text>
                ),
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    text: {
        ...baseText,
        fontFamily: fonts.system,
        color: colors.text,
        fontSize: 21,
    },
});

export default ParseText;
