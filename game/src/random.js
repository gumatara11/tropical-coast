// Seeded RNG — one fixed seed drives every random placement in the city,
// so the map is identical on every load. The call order during world
// building must never change: adding, removing or reordering a call
// reshuffles every building, pedestrian and beach ball placed after it.
// New features must use fixed coordinates or their own local generator,
// never this shared sequence.
var seed = 20261118;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function resetSeed() { seed = 20261118; }
