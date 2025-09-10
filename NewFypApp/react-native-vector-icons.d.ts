declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { ComponentType } from 'react';
  interface MaterialCommunityIconsProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }
  const MaterialCommunityIcons: ComponentType<MaterialCommunityIconsProps>;
  export default MaterialCommunityIcons;
}
