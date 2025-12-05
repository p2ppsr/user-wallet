import React from 'react';
import Logo from './Logo';

interface AppLogoProps {
  className?: string;
  size?: string | number;
  color?: string;
  rotate?: boolean;
}

const AppLogo: React.FC<AppLogoProps> = ({
  rotate = true,
  ...rest
}) => {
  return <Logo rotate={rotate} {...rest} />;
};

export default AppLogo;
