// URL params, lighting variants, shared constants and ground rules.
// Every module reads these; nothing here touches the scene.
var qs = new URLSearchParams(location.search);
var cover = qs.get('cover') === '1';
var screen = qs.get('screen') || 'splash';
var variant = qs.get('v') || ((screen === 'game' || screen === 'drive' || screen === 'dialogue') ? 'day' : 'sunset');
// Debug flags: ?fps=1 exposes window.__fps (frames per second) for
// performance probes; ?dbg=1 enables the window.__dbg state hook.
var showFps = qs.get('fps') === '1';

// Lighting variants: sunset for the menu/dialogue mood, day for clear
// gameplay, golden for the low-sun chase shots the top entries use.
var V = {
  sunset: { bg: 0x3a1a5e, fog: 0xff7a6b, skyTop: 0x7a3aff, skyMid: 0xff5a8a, skyLow: 0xffb36b, sun: 0xffc27a, sunI: 2.0, fill: 0xffe0e8, fillI: 1.1, amb: 0x9a7ac8, ambI: 1.0, hemiS: 0xff9a7a, hemiG: 0x3a2a5a, disc: 0xff7a1a, far: 0x4a2a5a, mtn: 0x6a3a7a, road: 0x5a5470, ocean: 0x7a4a8a, city: 0x4a3a5a },
  day: { bg: 0x7ac8ff, fog: 0xcfe4ff, skyTop: 0x2a6aff, skyMid: 0x7ac8ff, skyLow: 0xe8f4ff, sun: 0xffffff, sunI: 2.2, fill: 0xffffff, fillI: 1.0, amb: 0xffffff, ambI: 1.1, hemiS: 0xbfd9ff, hemiG: 0x8a7a5a, disc: 0xfff6c8, far: 0x93a9c9, mtn: 0x5a7a9a, road: 0x4a4a55, ocean: 0x1a7ac8, city: 0x6a6a7a },
  golden: { bg: 0x7a4a6a, fog: 0xff9a7a, skyTop: 0x5a3aff, skyMid: 0xff7a8a, skyLow: 0xff9a3a, sun: 0xffb36b, sunI: 4.5, fill: 0xffd9c8, fillI: 0.22, amb: 0xc8a8b8, ambI: 0.3, hemiS: 0xff9a7a, hemiG: 0x5a3a5a, disc: 0xff8a1a, far: 0x9a6a72, mtn: 0x8a5a7a, road: 0x5a4a55, ocean: 0x8a5a8a, city: 0x6a5a6a }
};
var C = V[variant] || V.sunset;

var W = window.innerWidth, H = window.innerHeight;

// The street grid: coast road x -8..8, Avenue 1 x -37..-27, Avenue 2 x -85..-75,
// Avenue 3 x -133..-123, four cross streets. The whole map runs
// z -205..205, x -158..30 on land.
var crossZs = [-163, -61, 41, 143];

function onRoad(x, z) {
  if (x >= -8 && x <= 8) return true;
  if (x >= -37 && x <= -27) return true;
  if (x >= -85 && x <= -75) return true;
  if (x >= -133 && x <= -123) return true;
  for (var i = 0; i < crossZs.length; i++) if (z >= crossZs[i] - 5 && z <= crossZs[i] + 5 && x >= -158 && x <= 8) return true;
  return false;
}
function walkable(x, z) {
  if (onRoad(x, z)) return true;
  if (x >= -13 && x <= 13) return true;
  if (x >= -40 && x <= -24) return true;
  if (x >= -158 && x <= -60) return true;
  if (x >= 13 && x <= 34) return true; // beach + shallows
  // SA alleys (round 15): the four east-west lanes through the block row.
  if (x >= -75 && x <= -37 && z >= -121 && z <= -117) return true;
  if (x >= -75 && x <= -37 && z >= -101 && z <= -97) return true;
  if (x >= -75 && x <= -37 && z >= 67.63 && z <= 71.63) return true;
  if (x >= -75 && x <= -37 && z >= 104 && z <= 108) return true;
  return false;
}
// Ground height under a character's feet: promenade tiles sit highest,
// then the left sidewalk, then sand; roads and city are flat.
function groundY(x, z) {
  if (x >= 8 && x < 14) return 0.16;
  if (x >= -14 && x < -8) return 0.145;
  if (x >= 14 && x < 30) return 0.06;
  return 0;
}
