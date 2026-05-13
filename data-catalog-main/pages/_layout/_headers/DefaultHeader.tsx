import React from 'react';
import Header, { HeaderLeft, HeaderRight } from '../../../layout/Header/Header';
import Navigation from '../../../layout/Navigation/Navigation';
import { pageLayoutTypesPagesMenu } from '../../../menu';
import useDeviceScreen from '../../../hooks/useDeviceScreen';
import Popovers from '../../../components/bootstrap/Popovers';

const DefaultHeader = () => {
	const deviceScreen = useDeviceScreen();
	return (
		<Header>
			<HeaderLeft>
				<Navigation
					menu={{ ...pageLayoutTypesPagesMenu }}
					id='header-top-menu'
					horizontal={
						!!deviceScreen?.width &&
						deviceScreen.width >= Number(process.env.NEXT_PUBLIC_MOBILE_BREAKPOINT_SIZE)
					}
				/>
			</HeaderLeft>
			<HeaderRight>
				<Popovers
					title='DefaultHeader.tsx'
					desc={<code>pages/_layout/_headers/DefaultHeader.tsx</code>}>
					HeaderRight
				</Popovers>
				<code>DefaultHeader.tsx</code>
			</HeaderRight>
		</Header>
	);
};

export default DefaultHeader;
