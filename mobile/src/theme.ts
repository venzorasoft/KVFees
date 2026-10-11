// Palette sampled from the Kendriya Vidyalaya emblem (assets/kv-logo.png):
// gold sun rays, saffron + green tricolour stripes, maroon lettering, cream page.
export const kv = {
  maroon: '#5B242C',
  maroonDeep: '#501F24',
  gold: '#D5AA60',
  saffron: '#FA8311',
  green: '#4BB649',
  cream: '#F5F1DE',
};

export const colors = {
  primary: kv.maroon,
  primaryDark: kv.maroonDeep,
  primarySoft: kv.cream,
  accent: kv.gold,
  bg: '#FAF7EC',
  card: '#FFFFFF',
  text: '#2B1417',
  muted: '#7C6A62',
  line: '#EBE4D2',
  green: kv.green,
  red: kv.maroon,
  amber: kv.saffron,
  onHeader: '#F3E3BC',       // light gold-cream text on the maroon header
  onHeaderDim: '#E6CF9A',
};

export const radius = { card: 20, tile: 16, pill: 999 };

export const shadow = {
  shadowColor: '#3A1519',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};
