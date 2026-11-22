// Gameplay state, entering vehicles, missions and dialogue.
// All dialogue text is locked — it is presented, never edited.
var onFoot = true, speed = 0, px = -2.5, pz = 12, heading = 0, steer = 0;
// Round 18: smoothed on-foot movement state — footSpeed eases toward the
// target instead of snapping, walkPhase advances with signed distance so
// the leg swing follows the feet, turnVel eases the turn rate.
var footSpeed = 0, walkPhase = 0, turnVel = 0;
var carX = 0, carZ = 10, carHeading = 0;
// Which vehicle Gito is in: 'none' on foot, 'car' in the yellow coupe,
// 'boat' / 'jetski' on the water, 'bike' on a parked bike.
var rideMode = 'none', rideObj = null, rideHeading = 0, rideSpeed = 0;
// Read-only state hook for drive tests (no gameplay effect).
window.__dbg = function () { return { carX: carX, carZ: carZ, carHeading: carHeading, speed: speed, steer: steer, rideMode: rideMode, rideSpeed: rideSpeed, onFoot: onFoot, px: px, pz: pz, heading: heading, frontWheelY: (player.userData.frontWheels ? player.userData.frontWheels[0].rotation.y : null) }; };
var sparkT = 0, panicT = 0;
// Wanted level 0-5: a collision or speeding raises it, it decays after
// 25 s without an incident. It drives the stars, the dispatch panel,
// police aggression and the heli spotlight. Car condition falls on hits.
var wanted = 0, wantedT = 0, carCond = 100;
// Health + armour: collisions damage armour first, then health; health
// regens slowly once the heat is off. Ammo is the real pistol loadout.
var health = 100, armour = 50, ammo = 12, reserve = 60, lastHitT = -99;
function damagePlayer(n) { lastHitT = t; if (armour > 0) { var a = Math.min(armour, n); armour -= a; n -= a; } if (n > 0) health = Math.max(5, health - n); }
// Round 19: combat — the game shipped with weapon slots on the HUD but NO
// way to attack at all (no input, no hit code), so Gito could not punch.
// Weapon 1..7, picked with keys 1-7 or by tapping a slot; fist/bat are
// melee, the guns fire. Pistol keeps the real ammo/reserve loadout.
var weapon = 1;
var attackT = 0, attackCd = 0;
var smgAmmo = 24, smgReserve = 120, sgAmmo = 6, sgReserve = 24, rfAmmo = 20, rfReserve = 80, snAmmo = 5, snReserve = 20;
var WEAPON_DEFS = {
  1: { name: 'PISTOL', range: 30, dmg: 15, cd: 0.3, gun: true },
  2: { name: 'SMG', range: 25, dmg: 8, cd: 0.12, gun: true },
  3: { name: 'SHOTGUN', range: 12, dmg: 30, cd: 0.9, gun: true },
  4: { name: 'RIFLE', range: 50, dmg: 25, cd: 0.5, gun: true },
  5: { name: 'SNIPER', range: 80, dmg: 50, cd: 1.2, gun: true },
  6: { name: 'BAT', range: 2.8, dmg: 20, cd: 0.5 },
  7: { name: 'FIST', range: 2.4, dmg: 10, cd: 0.35 }
};
function weaponAmmo() {
  if (weapon === 1) return { a: ammo, r: reserve };
  if (weapon === 2) return { a: smgAmmo, r: smgReserve };
  if (weapon === 3) return { a: sgAmmo, r: sgReserve };
  if (weapon === 4) return { a: rfAmmo, r: rfReserve };
  if (weapon === 5) return { a: snAmmo, r: snReserve };
  return { a: Infinity, r: Infinity };
}
// Spend one round of the selected gun: 'fire', 'reload' (mag refilled
// from reserve, longer cooldown), 'dry' (nothing left) or 'melee'.
function spendAmmo() {
  var pools = { 1: ['ammo', 'reserve', 12], 2: ['smgAmmo', 'smgReserve', 24], 3: ['sgAmmo', 'sgReserve', 6], 4: ['rfAmmo', 'rfReserve', 20], 5: ['snAmmo', 'snReserve', 5] };
  var p = pools[weapon];
  if (!p) return 'melee';
  if (window[p[0]] > 0) { window[p[0]]--; return 'fire'; }
  if (window[p[1]] > 0) { var n = Math.min(p[2], window[p[1]]); window[p[1]] -= n; window[p[0]] = n - 1; return 'reload'; }
  return 'dry';
}
// Attack the nearest NPC in front of the player, in range and in arc.
// Melee needs a wide arc, guns a narrow one. A hit knocks the NPC back,
// raises their arms in panic, flashes the spark and draws the police;
// at 0 hp they fall over and get back up after 8 s.
function tryAttack() {
  if (screen !== 'game' && screen !== 'drive') return;
  if (!onFoot || talking || cover) return;
  if (attackCd > 0) return;
  var def = WEAPON_DEFS[weapon];
  var res = def.gun ? spendAmmo() : 'melee';
  if (res === 'dry') { attackCd = 0.3; return; }
  attackT = 0.25; attackCd = res === 'reload' ? 0.9 : def.cd;
  var fx = -Math.sin(heading), fz = -Math.cos(heading);
  var best = null, bd = def.range;
  peds.concat(chatters).concat(beachgoers).forEach(function (pd) {
    if (pd.userData.downT > 0) return;
    var dx = pd.position.x - px, dz = pd.position.z - pz;
    var d = Math.hypot(dx, dz);
    if (d > def.range) return;
    var dot = (dx * fx + dz * fz) / (d || 1);
    if (def.gun ? dot < 0.94 : dot < 0.5) return;
    if (d < bd) { bd = d; best = pd; }
  });
  if (best) {
    if (best.userData.hp === undefined) best.userData.hp = 100;
    best.userData.hp -= def.dmg;
    best.userData.hitT = 0.6;
    var kx = (best.position.x - px) / (bd || 1), kz = (best.position.z - pz) / (bd || 1);
    var nx = best.position.x + kx * 1.4, nz = best.position.z + kz * 1.4;
    if (walkable(nx, nz)) { best.position.x = nx; best.position.z = nz; }
    sparkT = 0.3;
    if (best.userData.hp <= 0) { best.userData.downT = 8; best.userData.hp = 100; best.rotation.z = Math.PI / 2; }
    raiseWanted(1);
  }
  if (def.gun) playShot(); else playThud();
}
// Mission stage timer (real elapsed time on the current stage).
var stageStartT = 0, lastStageKey = '';
function raiseWanted(n) { if (wanted < n) wanted = n; wantedT = 25; }
var enterEl = document.getElementById('enter');
// Nearest rideable vehicle to the player within maxD (or null).
function nearestVeh(list, maxD) {
  var best = null, bd = maxD;
  list.forEach(function (v) { var d = Math.hypot(v.position.x - px, v.position.z - pz); if (d < bd) { bd = d; best = v; } });
  return best;
}
function tryEnter() {
  if (screen !== 'game' && screen !== 'drive') return;
  if (talking) { advanceTalk(); return; }
  var m = curMission();
  if (onFoot && m && missionStage === 'talk' && Math.hypot(m.giverObj.position.x - px, m.giverObj.position.z - pz) < 3.5) { startTalk(m); return; }
  if (onFoot) {
    var d = Math.hypot(carX - px, carZ - pz);
    if (d < 4) { onFoot = false; rideMode = 'car'; gito.visible = false; speed = 0; return; }
    // Boats + jetskis: board from the shallows (radius 6, wade to x 34).
    // Gito stays visible on water vehicles and bikes — the per-frame rider
    // pose seats him on the vehicle (the car hides him, he's inside).
    var wv = nearestVeh(motorboats.concat(jetskis), 6);
    if (wv) { onFoot = false; rideMode = wv.userData.kind; rideObj = wv; rideHeading = wv.rotation.y; rideSpeed = 0; return; }
    var bk = nearestVeh(bikes, 4);
    if (bk) { onFoot = false; rideMode = 'bike'; rideObj = bk; rideHeading = bk.rotation.y; rideSpeed = 0; return; }
  } else {
    if (rideMode === 'car') { px = carX + 2; pz = carZ + 2; heading = carHeading; }
    else if (rideMode === 'boat' || rideMode === 'jetski') { px = 29; pz = Math.max(-205, Math.min(205, rideObj.position.z)); heading = rideHeading; }
    else if (rideMode === 'bike') { px = rideObj.position.x + 2; pz = rideObj.position.z + 2; heading = rideHeading; rideObj.rotation.z = 0; }
    onFoot = true; gito.visible = true; speed = 0; rideSpeed = 0; rideMode = 'none'; rideObj = null;
  }
}

// ---- Missions ----
var money = 5000;
var moneyEl = document.getElementById('money');
function setMoney(v) { money = v; if (moneyEl) moneyEl.textContent = '$' + money.toLocaleString('en-US'); }
var missions = [
  { name: 'Welcome Back', giver: 'Luna', giverObj: woman,
    lines: [
      ['Luna', "Gito! You're back! I knew you'd come home."],
      ['Gito', "Luna! This place hasn't changed a bit."],
      ['Luna', 'Your yellow car is still parked on the promenade. Take it for a spin — the city missed you.']
    ],
    objective: 'Get in your car', reward: 200, check: 'car' },
  { name: 'Harbor Delivery', giver: 'Ray', giverObj: dockWorker,
    lines: [
      ['Ray', 'Hey! You must be Gito. Luna radioed ahead — I got a package for the Night Club.'],
      ['Gito', 'On it. Anything I should know?'],
      ['Ray', "Just don't keep Max waiting. He hates waiting. Drive safe, kid."]
    ],
    objective: 'Deliver the package to the Night Club', reward: 500, check: { x: -80, z: 125, r: 10 } },
  { name: 'Night Out', giver: 'Max', giverObj: bouncer,
    lines: [
      ['Max', 'The package! Finally. Luna owes me a drink for this.'],
      ['Gito', "So, what's next? The night's still young."],
      ['Max', 'The pier. Sunset, sea breeze, cold drinks at the Beach Bar. Go — I will catch up later.']
    ],
    objective: 'Drive to the Pier', reward: 800, check: { x: 30, z: 52, r: 6 } }
];
var missionIdx = 0, missionStage = 'talk'; // 'talk' -> 'do' -> next mission
var talking = false, talkLines = [], talkIdx = 0, talkAfter = null;
var objectiveEl = document.getElementById('objective');
var talkEl = document.getElementById('talk');
var talkDlgEl = document.getElementById('talkDlg');
var talkNameEl = document.getElementById('talkName');
var talkPortraitEl = document.getElementById('talkPortrait');
var talkRoleEl = document.getElementById('talkRole');
var talkBoxEl = document.getElementById('talkBox');
var bannerEl = document.getElementById('missionBanner');
var bannerT = 0;
function curMission() { return missions[missionIdx] || null; }
function updateObjective() {
  if (!objectiveEl) return;
  var m = curMission();
  objectiveEl.textContent = m ? ('★ ' + m.name + ': ' + (missionStage === 'talk' ? 'Talk to ' + m.giver : m.objective)) : '★ Free roam — enjoy Tropical Coast!';
}
// Dialogue portrait + NPC role (presentation only — the dialogue text is
// locked). Luna and Gito use generated portrait pictures; Ray and Max keep
// a letter fallback on their role colour.
var NPC_ROLES = { Luna: 'CHILDHOOD FRIEND', Ray: 'DOCK WORKER', Max: 'BOUNCER', Gito: 'HOMETOWN HERO' };
var NPC_COLORS = { Luna: '#ff5a9a', Ray: '#ff8a2a', Max: '#2a2a4a', Gito: '#ffd23f' };
var NPC_PORTRAITS = { Luna: 'textures/portrait-luna.jpg', Gito: 'textures/portrait-gito.jpg' };
function showTalk(name, text) {
  if (talkNameEl) talkNameEl.textContent = name;
  if (talkPortraitEl) {
    if (NPC_PORTRAITS[name]) { talkPortraitEl.textContent = ''; talkPortraitEl.style.backgroundImage = 'url(' + NPC_PORTRAITS[name] + ')'; talkPortraitEl.style.backgroundColor = NPC_COLORS[name] || '#888888'; }
    else { talkPortraitEl.textContent = name.charAt(0); talkPortraitEl.style.backgroundImage = 'none'; talkPortraitEl.style.backgroundColor = NPC_COLORS[name] || '#888888'; }
  }
  if (talkRoleEl) talkRoleEl.textContent = NPC_ROLES[name] || '';
  if (talkBoxEl) talkBoxEl.innerHTML = text + '<span class="dlgArrow">▼</span>';
  if (talkDlgEl) talkDlgEl.style.display = 'block';
}
function hideTalk() { if (talkDlgEl) talkDlgEl.style.display = 'none'; }
function startTalk(m) {
  talking = true; talkLines = m.lines; talkIdx = 0;
  talkAfter = function () { missionStage = 'do'; updateObjective(); };
  showTalk(talkLines[0][0], talkLines[0][1]);
}
function advanceTalk() {
  if (!talking) return;
  talkIdx++;
  if (talkIdx >= talkLines.length) { talking = false; hideTalk(); if (talkAfter) { var f = talkAfter; talkAfter = null; f(); } }
  else showTalk(talkLines[talkIdx][0], talkLines[talkIdx][1]);
}
if (talkBoxEl) talkBoxEl.addEventListener('click', advanceTalk);
function completeMission() {
  var m = curMission(); if (!m) return;
  setMoney(money + m.reward);
  missionIdx++; missionStage = 'talk';
  if (bannerEl) {
    bannerEl.textContent = missionIdx >= missions.length ? 'All Missions Complete! +$' + m.reward : 'Mission Complete! +$' + m.reward;
    bannerEl.style.display = 'block';
  }
  bannerT = 3;
  try { localStorage.setItem('tc-save', JSON.stringify({ mission: missionIdx, money: money })); } catch (e) {}
  updateObjective();
}
// Load saved progress (not in cover renders).
if (!cover) { try { var sv = JSON.parse(localStorage.getItem('tc-save') || 'null'); if (sv) { missionIdx = sv.mission || 0; if (sv.money) setMoney(sv.money); } } catch (e) {} }
updateObjective();

// ---- Screen flow: splash -> menu -> dialogue -> game ----
function setScreen(s) {
  screen = s;
  document.body.className = 'mode-' + s;
  document.getElementById('splash').style.display = s === 'splash' ? 'block' : 'none';
  document.getElementById('menu').style.display = s === 'menu' ? 'block' : 'none';
  document.getElementById('dialogue').style.display = s === 'dialogue' ? 'block' : 'none';
  document.getElementById('skipBtn').style.display = s === 'dialogue' ? 'block' : 'none';
  document.getElementById('menuDlg').style.display = s === 'menu' ? 'block' : 'none';
  if (s === 'game' || s === 'drive') { onFoot = true; gito.visible = true; px = -2.5; pz = 12; heading = 0; speed = 0; carX = 0; carZ = 10; carHeading = 0; }
}
document.getElementById('startBtn').addEventListener('click', function () { setScreen('menu'); });
document.getElementById('newGameBtn').addEventListener('click', function () { setScreen('dialogue'); });
document.getElementById('skipBtn').addEventListener('click', function () { setScreen('game'); });
document.getElementById('dlgbox').addEventListener('click', function () { setScreen('game'); });
document.getElementById('menuDlgBox').addEventListener('click', function () { setScreen('dialogue'); });
// Initial screen from the URL.
document.body.className = 'mode-' + screen;
document.getElementById('splash').style.display = screen === 'splash' ? 'block' : 'none';
document.getElementById('menu').style.display = screen === 'menu' ? 'block' : 'none';
document.getElementById('dialogue').style.display = screen === 'dialogue' ? 'block' : 'none';
document.getElementById('skipBtn').style.display = screen === 'dialogue' ? 'block' : 'none';
document.getElementById('menuDlg').style.display = screen === 'menu' ? 'block' : 'none';
