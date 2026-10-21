import { BlurView } from 'expo-blur';
import React, { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type GlassViewProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
};

// Real blur on iOS. On Android, expo-blur needs a BlurTargetView around the content, and that
// container stopped its children from painting in Expo Go, so Android gets a frosted tint instead.
export function GlassView({ children, style, intensity = 40 }: GlassViewProps) {
  return (
    <View style={[styles.wrap, Platform.OS === 'android' && styles.androidFrost, style]}>
      {Platform.OS === 'ios' && (
        <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <View style={[StyleSheet.absoluteFill, styles.tint]} />
      {children}
    </View>
  );
}

export const glass = {
  fill: 'rgba(255, 255, 255, 0.06)',
  fillStrong: 'rgba(255, 255, 255, 0.1)',
  border: 'rgba(255, 255, 255, 0.12)',
  borderBright: 'rgba(0, 214, 255, 0.35)',
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: glass.border,
  },
  androidFrost: {
    backgroundColor: 'rgba(120, 170, 220, 0.16)',
  },
  tint: {
    backgroundColor: 'rgba(10, 28, 48, 0.35)',
  },
});
