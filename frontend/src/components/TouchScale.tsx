import React, { useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

interface TouchScaleProps extends TouchableOpacityProps {
  scaleTo?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function TouchScale({ scaleTo = 0.97, style, children, activeOpacity = 0.82, onPressIn, onPressOut, ...props }: TouchScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.spring(scale, { toValue: scaleTo, friction: 8, useNativeDriver: true }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scale, { toValue: 1, friction: 8, useNativeDriver: true }).start();
    onPressOut?.(e);
  };

  return (
    <AnimatedTouchable
      activeOpacity={activeOpacity}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
      style={[{ transform: [{ scale }] }, style]}
    >
      {children}
    </AnimatedTouchable>
  );
}
