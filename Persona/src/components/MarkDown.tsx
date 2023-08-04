import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Markdown, {RenderRules} from 'react-native-markdown-display';
import colors from 'resources/colors';
import fonts from 'resources/fonts';
import baseText from 'resources/text';
import {propsAreEqual} from 'utils/propsAreEqual';
import ParseText from 'components/MarkDownParseText';

interface MarkDownMemoProps {
    style: any;
    elementStyles: any;
    fontFamily: any;
    numColumns?: number;
    text: string;
    hasMedia?: boolean;
    fontSize?: number;
}

const rules: RenderRules = {
    body: (node, children, parent, styles) => (
        <View key={node.key} style={[styles.body]}>
            {children}
        </View>
    ),
    paragraph: (node, children, parent, styles) => (
        <View key={node.key} style={[styles.paragraph]}>
            {children}
        </View>
    ),
    text: (node, children, parent, styles) =>
        typeof node.content === 'string' &&
        (!children || children.length < 1) ? (
            <ParseText
                key={node.key}
                styles={[styles.textDefault, styles.text]}
                text={node.content}>
                {node.content}
            </ParseText>
        ) : (
            <Text key={node.key} style={[styles.text]}>
                {node.content}
            </Text>
        ),
    heading1: (node, children, parent, styles) => (
        <View key={node.key} style={[styles.heading, styles.heading1]}>
            {children}
        </View>
    ),
    heading2: (node, children, parent, styles) => (
        <View key={node.key} style={[styles.heading, styles.heading2]}>
            {children}
        </View>
    ),
    heading3: (node, children, parent, styles) => (
        <View key={node.key} style={[styles.heading, styles.heading3]}>
            {children}
        </View>
    ),
    heading4: (node, children, parent, styles) => (
        <View key={node.key} style={[styles.heading, styles.heading4]}>
            {children}
        </View>
    ),
    heading5: (node, children, parent, styles) => (
        <View key={node.key} style={[styles.heading, styles.heading5]}>
            {children}
        </View>
    ),
    heading6: (node, children, parent, styles) => (
        <View key={node.key} style={[styles.heading, styles.heading6]}>
            {children}
        </View>
    ),
};

const MarkDown = React.memo(MarkDownMemo, propsAreEqual);
export default MarkDown;
function MarkDownMemo({
    style,
    elementStyles,
    fontFamily = null,
    numColumns = 2,
    text,
    hasMedia = true,
    fontSize = 16,
}: MarkDownMemoProps) {
    const styles = StyleSheet.create({
        textDefault: {
            ...baseText,
            lineHeight: numColumns === 3 ? 11 : null,
            color: colors.text,
            fontSize: fontSize,
            fontFamily: fontFamily ? fontFamily : fonts.mono,
            ...elementStyles?.textDefault,
        },
        body: {
            ...baseText,
            lineHeight: numColumns === 3 ? 11 : null,
            color: colors.text,
            fontSize: fontSize,
            fontFamily: fontFamily ? fontFamily : fonts.mono,
            ...style,
        },
        code_inline: {
            marginTop: 0,
            borderWidth: 0.5,
            borderRadius: 25,
            color: '#B0B000',
        },
        code_block: {
            marginTop: 20,
            borderWidth: 0.5,
            borderRadius: 25,
        },
        blockquote: {
            borderWidth: 0.5,
            borderRadius: 25,
            fontStyle: 'italic',
            marginStart: 15,
            marginEnd: 15,
            padding: 5,
            paddingLeft: 15,
            marginTop: 10,
            marginBottom: 15,
        },
        text: {},
        textgroup: {},
        inline: {},
        paragraph: {
            ...elementStyles?.paragraph,
        },
        heading1: {
            marginTop: 15,
            fontSize: numColumns === 3 ? 11 : 20,
            fontFamily: fonts.bold,
        },
        heading2: {
            marginTop: 15,
            fontFamily: fonts.bold,
            fontSize: numColumns === 3 ? 10 : 19,
        },
        heading3: {
            marginTop: 15,
            fontSize: numColumns === 3 ? 10 : 18,
            fontFamily: fonts.medium,
        },
        heading4: {
            marginTop: 15,
            fontSize: numColumns === 3 ? 10 : 17,
            fontFamily: fonts.medium,
        },
        heading5: {
            marginTop: 15,
            fontSize: numColumns === 3 ? 10 : 16,
            fontFamily: fonts.regular,
        },
        heading6: {
            marginTop: 15,
            fontSize: numColumns === 3 ? 10 : 15,
            fontFamily: fonts.regular,
        },
        ordered_list: {
            marginTop: 10,
        },
        list_item: {
            marginTop: 5,
        },
    });
    return (
        // @ts-ignore start
        <Markdown style={styles} rules={rules}>
            {text}
        </Markdown>
    );
}
