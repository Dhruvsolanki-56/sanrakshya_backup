import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle } from 'react-native-svg';

const LoginIllustration = () => {
  return (
    <View style={{ width: 300, height: 250 }}>
      <Svg height="100%" width="100%" viewBox="0 0 300 250">
        <Defs>
          <LinearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#667eea" stopOpacity="1" />
            <Stop offset="100%" stopColor="#764ba2" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#10ac84" stopOpacity="1" />
            <Stop offset="100%" stopColor="#06d6a0" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {/* Background shapes */}
        <Circle cx="50" cy="50" r="80" fill="url(#grad1)" opacity="0.1" />
        <Circle cx="250" cy="200" r="100" fill="url(#grad2)" opacity="0.1" />

        {/* Main Illustration Elements */}
        <Rect x="50" y="80" width="200" height="120" rx="15" fill="#FFFFFF" stroke="#E1E8ED" strokeWidth="2" />
        <Path d="M 50 100 L 250 100" stroke="#E1E8ED" strokeWidth="2" />
        
        {/* Stethoscope Icon */}
        <Path 
          d="M 140 110 C 120 110, 120 140, 140 140 L 160 140 C 180 140, 180 110, 160 110 Z" 
          fill="none" 
          stroke="url(#grad1)" 
          strokeWidth="4"
        />
        <Path d="M 150 140 L 150 160" stroke="url(#grad1)" strokeWidth="4" strokeLinecap="round" />
        <Circle cx="150" cy="170" r="10" fill="url(#grad1)" />

        {/* Plus Icon */}
        <Path d="M 210 120 L 230 120 M 220 110 L 220 130" stroke="url(#grad2)" strokeWidth="4" strokeLinecap="round" />

        {/* Heart Icon */}
        <Path 
          d="M 80 140 A 10 10 0 0 1 90 130 A 10 10 0 0 1 100 140 Q 100 150 90 160 Q 80 150 80 140 Z" 
          fill="#ff6b6b"
        />
      </Svg>
    </View>
  );
};

export default LoginIllustration;
