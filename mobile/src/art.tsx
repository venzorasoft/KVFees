import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Line, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { Drift, Float, Spin } from './anim';

/** Original vector illustration of a school campus (no photos / no third-party artwork). */
function Campus() {
  const windows = [118, 138, 208, 228];
  return (
    <Svg width="100%" height="100%" viewBox="0 0 360 150" preserveAspectRatio="xMidYMax slice">
      <Defs>
        <LinearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4BB649" />
          <Stop offset="1" stopColor="#2F8A3A" />
        </LinearGradient>
        <LinearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#F5F1DE" />
        </LinearGradient>
      </Defs>

      {/* ground */}
      <Rect x="0" y="126" width="360" height="24" fill="url(#grass)" />
      <Path d="M150 150 L168 126 L192 126 L210 150 Z" fill="#E9D3A3" />

      {/* trees */}
      {[24, 62, 300, 336].map((x, i) => (
        <G key={x}>
          <Rect x={x - 2} y={104} width="4" height="24" fill="#5B242C" />
          <Circle cx={x} cy={96} r={i % 2 ? 15 : 18} fill="#3FA044" />
          <Circle cx={x - 8} cy={104} r="10" fill="#4BB649" />
          <Circle cx={x + 9} cy={103} r="10" fill="#2F8A3A" />
        </G>
      ))}

      {/* side wings */}
      <Rect x="70" y="92" width="62" height="36" fill="url(#wall)" />
      <Rect x="66" y="86" width="70" height="8" rx="2" fill="#FA8311" />
      <Rect x="228" y="92" width="62" height="36" fill="url(#wall)" />
      <Rect x="224" y="86" width="70" height="8" rx="2" fill="#FA8311" />
      {[82, 104, 240, 262].map((x) => <Rect key={x} x={x} y={102} width="14" height="14" rx="3" fill="#F3DFAE" />)}

      {/* main block */}
      <Rect x="112" y="72" width="136" height="56" fill="url(#wall)" />
      <Polygon points="104,72 180,44 256,72" fill="#FA8311" />
      <Polygon points="104,72 180,44 180,50 112,74" fill="#E0720A" />
      {/* clock tower */}
      <Rect x="164" y="40" width="32" height="34" fill="url(#wall)" />
      <Polygon points="158,42 180,22 202,42" fill="#5B242C" />
      <Circle cx="180" cy="55" r="9" fill="#fff" stroke="#5B242C" strokeWidth="2" />
      <Line x1="180" y1="55" x2="180" y2="49" stroke="#5B242C" strokeWidth="1.8" />
      <Line x1="180" y1="55" x2="185" y2="57" stroke="#5B242C" strokeWidth="1.8" />
      {/* flag */}
      <Line x1="180" y1="22" x2="180" y2="4" stroke="#fff" strokeWidth="1.6" />
      <Path d="M180 4 L198 7 L180 11 Z" fill="#FA8311" />
      <Path d="M180 7.4 L192 8.6 L180 10 Z" fill="#fff" />
      <Path d="M180 9.6 L190 10.2 L180 11.2 Z" fill="#4BB649" />
      {/* windows + door */}
      {windows.map((x) => <Rect key={x} x={x} y={82} width="14" height="16" rx="3" fill="#F3DFAE" />)}
      <Rect x="168" y="96" width="24" height="32" rx="12" fill="#5B242C" />
      <Line x1="180" y1="100" x2="180" y2="128" stroke="#fff" strokeWidth="1.2" />
      {[116, 244].map((x) => <Rect key={x} x={x - 3} y={100} width="6" height="28" fill="#fff" />)}

      {/* books on the lawn */}
      <Rect x="248" y="132" width="26" height="6" rx="1.5" fill="#5B242C" />
      <Rect x="251" y="126" width="22" height="6" rx="1.5" fill="#D5AA60" />
      <Rect x="254" y="120" width="18" height="6" rx="1.5" fill="#4BB649" />
    </Svg>
  );
}

function Sun() {
  return (
    <Svg width={74} height={74} viewBox="-37 -37 74 74">
      {Array.from({ length: 12 }).map((_, i) => (
        <Line key={i} x1="0" y1="-22" x2="0" y2={i % 2 ? -29 : -34} stroke="#D5AA60" strokeWidth="3" strokeLinecap="round" rotation={i * 30} originX="0" originY="0" />
      ))}
      <Circle r="16" fill="#E4B65E" />
      <Circle r="16" fill="#F5E2B0" opacity="0.5" cx="-4" cy="-4" />
    </Svg>
  );
}

function Cloud({ w = 74 }: { w?: number }) {
  return (
    <Svg width={w} height={w * 0.5} viewBox="0 0 80 40">
      <Path d="M18 34 Q4 34 6 22 Q8 12 20 14 Q24 2 38 4 Q52 2 56 14 Q74 12 74 26 Q74 34 62 34 Z" fill="#fff" opacity="0.9" />
    </Svg>
  );
}

/** Animated scene: spinning sun, drifting clouds, campus on the ground. Fills its parent. */
export function CampusScene({ height = 150 }: { height?: number }) {
  return (
    <View style={[s.scene, { height }]} pointerEvents="none">
      <Spin style={s.sun}><Sun /></Spin>
      <Drift from={-90} to={460} duration={42000} style={{ position: 'absolute', top: 18 }}><Cloud w={80} /></Drift>
      <Drift from={-200} to={380} duration={58000} delay={4000} style={{ position: 'absolute', top: 54, opacity: 0.8 }}><Cloud w={56} /></Drift>
      <Float dy={3} duration={3200} style={StyleSheet.absoluteFill}><Campus /></Float>
    </View>
  );
}

const s = StyleSheet.create({
  scene: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  sun: { position: 'absolute', right: 20, top: 6 },
});
