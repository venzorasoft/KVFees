import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, PressableProps, StyleProp, Text, TextStyle, ViewStyle } from 'react-native';

export const ND = Platform.OS !== 'web'; // native driver only on phones

/** Fades and slides its children up when mounted; `delay` staggers siblings. */
export function FadeInUp({ children, delay = 0, distance = 18, style }: {
  children: ReactNode; delay?: number; distance?: number; style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 520, delay, easing: Easing.out(Easing.cubic), useNativeDriver: ND }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Springy pop-in (logos, badges). */
export function PopIn({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, delay, friction: 5, tension: 70, useNativeDriver: ND }).start();
  }, [v, delay]);
  return <Animated.View style={[style, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]}>{children}</Animated.View>;
}

/** Pressable that squishes slightly while pressed. */
export function PressScale({ children, style, ...rest }: PressableProps & { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (x: number) => Animated.spring(s, { toValue: x, friction: 6, tension: 160, useNativeDriver: ND }).start();
  return (
    <Pressable {...rest} onPressIn={() => to(0.96)} onPressOut={() => to(1)}>
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Gentle endless float (clouds, badges). */
export function Float({ children, dx = 0, dy = 6, duration = 2600, style }: {
  children: ReactNode; dx?: number; dy?: number; duration?: number; style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
      Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: ND }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  return (
    <Animated.View style={[style, { transform: [
      { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-dx, dx] }) },
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-dy, dy] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Endless rotation (sun rays). */
export function Spin({ children, duration = 24000, style }: { children: ReactNode; duration?: number; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: ND }));
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  return <Animated.View style={[style, { transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>{children}</Animated.View>;
}

/** Slow left-to-right drift that wraps around (clouds). */
export function Drift({ children, from, to, duration = 30000, delay = 0, style }: {
  children: ReactNode; from: number; to: number; duration?: number; delay?: number; style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.linear, useNativeDriver: ND }));
    loop.start();
    return () => loop.stop();
  }, [v, duration, delay]);
  return <Animated.View style={[style, { transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [from, to] }) }] }]}>{children}</Animated.View>;
}

/** Number that counts up from 0 on mount / when the target changes. */
export function CountUp({ to, prefix = '', duration = 900, style }: { to: number; prefix?: string; duration?: number; style?: StyleProp<TextStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setN(Math.round(value)));
    v.setValue(0);
    Animated.timing(v, { toValue: to, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => v.removeListener(id);
  }, [to, v, duration]);
  return <Text style={style}>{prefix}{n.toLocaleString('en-IN')}</Text>;
}

/** Bar that grows to `ratio` (0..1) of `max` pixels tall. */
export function GrowBar({ ratio, max, color, delay = 0, width = 26 }: { ratio: number; max: number; color: string; delay?: number; width?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: ratio, duration: 800, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [ratio, v, delay]);
  return <Animated.View style={{ width, borderRadius: 8, backgroundColor: color, height: v.interpolate({ inputRange: [0, 1], outputRange: [4, max] }) }} />;
}
