import { StyleSheet } from 'react-native';
import fonts from 'resources/fonts';
import styled from 'styled-components';

const textInputStyle = {
	fontFamily: fonts.light,
	fontSize: 16,
	fontWeight: '500',
	color: '#868B8F',
	borderRadius: 8,
	backgroundColor: '#111314',
	padding: 10,
	marginBottom: 10,
	width: '100%',
};

const styles = StyleSheet.create({
	textInput: {
		...textInputStyle,
		height: 44,
	},
	descriptionInput: {
		...textInputStyle,
		height: 96,
		paddingTop: 10,
	},
	title: {
		color: '#fff',
		fontSize: 20,
		marginBottom: 10,
	},
	dropdownMenu: {
		...textInputStyle,
		backgroundColor: '#2E3133',
		height: 44,
	},
	dropdownText: {
		color: '#D0D3D6',
		fontSize: 16,
		alignItems: 'flex-end',
	},
	scrollView: {
		position: 'relative',
		flexDirection: 'column',
		alignSelf: 'center',
		alignItems: 'flex-start',
		width: '90%',
		height: '100%',
		borderRadius: 12,
		paddingLeft: 16,
		paddingTop: 12,
		paddingRight: 12,
		paddingBottom: 50,
		backgroundColor: '#1B1D1F',
	}
});

export const SubView = styled.View`
	width: 100%;
	padding-left: 3px;
	padding-right: 3px;
`;

export const SubtitleText = styled.Text`
	font-family: ${fonts.light};
	font-weight: 500;
	font-size: 14px;
	color: #AAAEB2;
	line-height: 19px;
	padding-bottom: 6px;
	padding-left: 3px;
`;

export const BaseText = styled.Text`
    color: #fbfbfb;
    font-family: ${fonts.bold};
    line-height: 21px;
    font-size: 16px;
`;

export default styles;
