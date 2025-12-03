import React from 'react';
import { useGlobalHotkeys } from '../hooks/useGlobalHotkeys';

const GlobalHotkeys: React.FC = () => {
  useGlobalHotkeys();
  return null; // This component doesn't render anything
};

export default GlobalHotkeys;
