import fonts from 'resources/fonts';
import styled from 'styled-components';

const baseText = {
    color: '#fbfbfb',
    fontFamily: fonts.regular,
    lineHeight: 21,
    fontSize: 16,
};

export const BaseText = styled.Text`
    color: #fbfbfb;
    font-family: ${fonts.regular};
    line-height: 21px;
    font-size: 16px;
`;

export const CenteredText = styled(BaseText)`
    text-align: center;
`;

export default baseText;
