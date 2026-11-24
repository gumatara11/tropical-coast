// Gameplay state, entering vehicles, missions and dialogue.
// All dialogue text is locked — it is presented, never edited.
var onFoot = true, speed = 0, px = 10, pz = 12, heading = 0, steer = 0;
// Round 18: smoothed on-foot movement state — footSpeed eases toward the
// target instead of snapping, walkPhase advances with signed distance so
// the leg swing follows the feet, turnVel eases the turn rate.
var footSpeed = 0, walkPhase = 0, turnVel = 0;
var carX = 0, carZ = 10, carHeading = 0;
// Which vehicle Gito is in: 'none' on foot, 'car' in the yellow coupe,
// 'boat' / 'jetski' on the water, 'bike' on a parked bike.
var rideMode = 'none', rideObj = null, rideHeading = 0, rideSpeed = 0;
// Round 22: which car mesh Gito drives — his yellow coupe (player) by
// default, or a parked car he adopted (parked1 / parked2). carX/carZ
// always track the ACTIVE car; the inactive cars keep their own mesh
// positions and stay enterable + solid.
var carMesh = player;
// Read-only state hook for drive tests (no gameplay effect).
window.__dbg = function () { return { carX: carX, carZ: carZ, carHeading: carHeading, speed: speed, steer: steer, rideMode: rideMode, rideSpeed: rideSpeed, onFoot: onFoot, px: px, pz: pz, heading: heading, frontWheelY: (carMesh.userData.frontWheels ? carMesh.userData.frontWheels[0].rotation.y : null), footSpeed: footSpeed, walkPhase: walkPhase, carMesh: carMesh === player ? 'coupe' : (carMesh === parked1 ? 'parked1' : (carMesh === parked2 ? 'parked2' : (carMesh.userData.driveName || 'adopted'))), wantedT: wantedT }; };
var sparkT = 0, panicT = 0;
// Wanted level 0-5: a collision or speeding raises it, it decays after
// 25 s without an incident. It drives the stars, the dispatch panel,
// police aggression and the heli spotlight. Car condition falls on hits.
var wanted = 0, wantedT = 0, carCond = 100;
// Round 25 (bug #1): the old spawn (-2.5, 12) sat ON the coast-road
// traffic lane — 0.5 m from the x=-3 lane, the taxi lane and the
// police-2 patrol line — so a car drove through the player within
// ~10 s of loading and raised wanted with no violation. The spawn
// moved to the promenade (10, 12), clear of every lane and post, and
// the first 6 s after entering the game are a grace window: traffic
// contact cannot knock the player or raise wanted while he walks from
// the spawn to his car.
var spawnSafeT = 6;
// Round 25 (bug #4): the car Gito adopted from traffic/police — the AI
// must not keep driving it while he does. Null while he drives his own
// coupe or a parked car; cleared when he gets out, so the AI resumes.
var adoptedCar = null;
var lastRaiseT = -99;
// Health + armour: collisions damage armour first, then health; health
// regens slowly once the heat is off. Ammo is the real pistol loadout.
// Round 26 (item 4): BUSTED — health CAN reach 0 now (the old floor at
// 5 made Gito unkillable); render.js freezes the sim and shows the
// BUSTED overlay when health hits 0, hud.js clears this on respawn.
var health = 100, armour = 50, ammo = 12, reserve = 60, lastHitT = -99;
var busted = false;
function damagePlayer(n) { lastHitT = t; if (armour > 0) { var a = Math.min(armour, n); armour -= a; n -= a; } if (n > 0) health = Math.max(0, health - n); }
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
// Round 22: NPCs flee gunfire — a fired gun scares every NPC within
// earshot (18 m), and any NPC hit directly flees too. Melee never
// triggers the mass flee, only the NPC actually hit. Downed NPCs stay
// down; rapid fire does not extend a flee already running.
var FLEE_RADIUS = 18, FLEE_TIME = 4;
function startFlee(pd) {
  if (pd.userData.downT > 0 || pd.userData.fleeT > 0) return;
  pd.userData.fleeT = FLEE_TIME; pd.userData.fleeRotY = pd.rotation.y;
}
function gunshotHeard() {
  peds.concat(chatters).concat(beachgoers).forEach(function (pd) {
    if (Math.hypot(pd.position.x - px, pd.position.z - pz) < FLEE_RADIUS) startFlee(pd);
  });
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
  // Round 25 (bug #9): officers are targets too — a cop shot before
  // did nothing at all (no hp, no fall), so combat against the police
  // could never be verified. They take damage and fall like any NPC.
  peds.concat(chatters).concat(beachgoers).concat(officers).forEach(function (pd) {
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
    // Officers never flee — they chase back. Civilians run.
    if (officers.indexOf(best) < 0) startFlee(best);
    raiseWanted(1);
  }
  if (def.gun) playShot(); else playThud();
  // Round 22: the shot itself is mayhem — even a miss draws the police
  // (a hit already raised it above; the 4 s cooldown stops double count).
  if (def.gun) raiseWanted(1);
  if (def.gun) gunshotHeard();
}
// Mission stage timer (real elapsed time on the current stage).
var stageStartT = 0, lastStageKey = '';
// Round 22: wanted escalates — every NEW incident while already wanted
// adds one star (up to 5), with a 4 s cooldown so one burst of shots
// does not jump straight to 5. The timer refreshes on every incident,
// so stars only fall once the player stops making trouble for 25 s.
function raiseWanted(n) {
  wantedT = 25;
  if (t - lastRaiseT < 4) return;
  lastRaiseT = t;
  if (wanted < n) wanted = n;
  else if (wanted < 5) wanted++;
}
var enterEl = document.getElementById('enter');
// Nearest rideable vehicle to the player within maxD (or null).
function nearestVeh(list, maxD) {
  var best = null, bd = maxD;
  list.forEach(function (v) { var d = Math.hypot(v.position.x - px, v.position.z - pz); if (d < bd) { bd = d; best = v; } });
  return best;
}
// Round 25 (bug #4): cars the player can adopt with E — the 6 police
// cars, the taxi, the 12 avenue/coast traffic cars and the 4
// cross-street cars. Parked cars, bikes, boats and jetskis have their
// own branches in tryEnter.
var ADOPTABLE = null;
function adoptableList() {
  if (!ADOPTABLE) ADOPTABLE = [police, police2, police3, police4, police5, police6, taxi].concat(traffic, aveTraffic, ave2Traffic, ave3Traffic, crossTraffic);
  return ADOPTABLE;
}
function nearestAdoptable(maxD) {
  var best = null, bd = maxD;
  adoptableList().forEach(function (v) {
    if (v === carMesh) return;
    var d = Math.hypot(v.position.x - px, v.position.z - pz);
    if (d < bd) { bd = d; best = v; }
  });
  return best;
}
// Round 26 (item 8): the nearest rideable vehicle of ANY kind within
// its own enter radius, or null. Own car / parked cars / adoptable cars
// (police, taxi, traffic) share radius 4; boats + jetskis board from
// radius 6; bikes radius 4. Strictly nearest — no kind outranks another.
function nearestRideable() {
  var best = null, bd = 1e9;
  function consider(kind, obj, x, z, r, adopt) {
    var d = Math.hypot(x - px, z - pz);
    if (d < r && d < bd) { bd = d; best = { kind: kind, obj: obj, x: x, z: z, adopt: !!adopt }; }
  }
  consider('car', null, carX, carZ, 4, false);
  if (carMesh !== player) consider('car', player, player.position.x, player.position.z, 4, false);
  if (carMesh !== parked1) consider('car', parked1, parked1.position.x, parked1.position.z, 4, false);
  if (carMesh !== parked2) consider('car', parked2, parked2.position.x, parked2.position.z, 4, false);
  adoptableList().forEach(function (v) {
    if (v !== carMesh) consider('car', v, v.position.x, v.position.z, 4, true);
  });
  motorboats.concat(jetskis).forEach(function (v) {
    consider(v.userData.kind, v, v.position.x, v.position.z, 6, false);
  });
  bikes.forEach(function (v) { consider('bike', v, v.position.x, v.position.z, 4, false); });
  // Round 27 (P3 20): the parked tour heli boards from radius 6, like
  // the boats. The circling tour heli and the police heli are NOT here
  // — they fly too high to board.
  if (typeof parkedHeli !== 'undefined' && parkedHeli) consider('heli', parkedHeli, parkedHeli.position.x, parkedHeli.position.z, 6, false);
  return best;
}
function tryEnter() {
  if (screen !== 'game' && screen !== 'drive') return;
  if (talking) { advanceTalk(); return; }
  var m = curMission();
  // Round 25 (bug #3): the talk radius was 3.5 m while Luna stands
  // 74 m from the spawn — close did not count, and nothing told the
  // player how close was close enough. 4.5 m now, with a beacon and a
  // distance readout (hud.js) pointing the way.
  if (onFoot && m && missionStage === 'talk' && Math.hypot(m.giverObj.position.x - px, m.giverObj.position.z - pz) < 4.5) { startTalk(m); return; }
  if (onFoot) {
    // Round 26 (item 8): enter the NEAREST rideable vehicle of any kind
    // — the old first-match cascade let a police car 2.5 m away win over
    // a bike 1.5 m away, so MASUK + the arrow always pointed at the
    // police car even when the bike was closer. One helper feeds both
    // tryEnter and the prompt, so they can never disagree.
    var nr = nearestRideable();
    if (nr) {
      if (nr.kind === 'car') {
        // Round 25 (bug #4): adopt a police car, the taxi or a traffic
        // car — the README always said "drive anything". Taking one stops
        // its AI (userData.adopted) so it drives exactly like the coupe;
        // the drive branch + solid-body list already run off carX/carZ.
        // A moving car is taken from where it is, at its heading. The
        // parked cars work the same way — adopting one makes it the
        // active car and the yellow coupe stays parked where it was,
        // still enterable itself.
        if (nr.adopt) {
          var adopt = nr.obj;
          if (adopt === taxi) adopt.userData.driveName = 'TAXI';
          else if (adopt === police || adopt === police2 || adopt === police3 || adopt === police4 || adopt === police5 || adopt === police6) adopt.userData.driveName = 'POLICE CRUISER';
          else adopt.userData.driveName = 'CITY CAR';
          adoptedCar = adopt; carMesh = adopt;
          adopt.userData.adopted = true;
          carX = adopt.position.x; carZ = adopt.position.z; carHeading = adopt.rotation.y;
        } else if (nr.obj) {
          carMesh = nr.obj; carX = nr.obj.position.x; carZ = nr.obj.position.z; carHeading = nr.obj.rotation.y;
        }
        onFoot = false; rideMode = 'car'; gito.visible = true; speed = 0; return;
      }
      // Boats + jetskis: board from the shallows (radius 6, wade to x 34).
      // Gito stays visible on water vehicles and bikes — the per-frame
      // rider pose seats him on the vehicle.
      if (nr.kind === 'boat' || nr.kind === 'jetski') { onFoot = false; rideMode = nr.kind; rideObj = nr.obj; rideHeading = nr.obj.rotation.y; rideSpeed = 0; return; }
      if (nr.kind === 'bike') { onFoot = false; rideMode = 'bike'; rideObj = nr.obj; rideHeading = nr.obj.rotation.y; rideSpeed = 0; return; }
      // Round 27 (P3 20): the parked tour heli — same board radius as
      // the boats; the heli branch in render.js flies it.
      if (nr.kind === 'heli') { onFoot = false; rideMode = 'heli'; rideObj = nr.obj; rideHeading = nr.obj.rotation.y; rideSpeed = 0; heliAlt = 0; return; }
    }
  } else {
    // Hand an adopted car back to its AI when Gito gets out — it
    // resumes patrolling/driving once it is no longer the active car.
    if (adoptedCar) { adoptedCar.userData.adopted = false; adoptedCar = null; }
    if (rideMode === 'car') { px = carX + 2; pz = carZ + 2; heading = carHeading; }
    else if (rideMode === 'boat' || rideMode === 'jetski') { px = 29; pz = Math.max(-205, Math.min(205, rideObj.position.z)); heading = rideHeading; }
    else if (rideMode === 'bike') { px = rideObj.position.x + 2; pz = rideObj.position.z + 2; heading = rideHeading; rideObj.rotation.z = 0; }
    // Round 27 (P3 20): getting out of the heli drops Gito on the ground
    // below — on walkable ground beside it, or at the beach edge if the
    // heli is over water / a rooftop (never stranded in the sea).
    else if (rideMode === 'heli') {
      if (walkable(rideObj.position.x + 2, rideObj.position.z + 2)) { px = rideObj.position.x + 2; pz = rideObj.position.z + 2; }
      else { px = 29; pz = Math.max(-205, Math.min(205, rideObj.position.z)); }
      heading = rideHeading; heliAlt = 0;
      // Round 27 (P3 20 fix): land the heli itself — without this it
      // kept hovering at 12 m after Gito got out, floating mid-air.
      rideObj.position.y = groundY(rideObj.position.x, rideObj.position.z);
    }
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
    objective: 'Drive to the Pier', reward: 800, check: { x: 30, z: 52, r: 6 } },
  // Round 27 (A): missions 4-6. M4 flies the tour heli, M5 sails the
  // boat south, M6 is the Coast Sprint time trial (also item C).
  { name: 'Island Tour', giver: 'Luna', giverObj: woman,
    lines: [
      ['Luna', 'Gito! There is a tour heli parked on the south beach. Take it up — the whole coast looks different from the sky.'],
      ['Gito', 'A heli? Now we are talking.'],
      ['Luna', 'Fly out over the Pier, nice and slow. The boats will love the show.']
    ],
    objective: 'Fly the tour heli over the Pier', reward: 1000, check: { x: 45, z: 52, r: 10, vehicle: 'heli' } },
  { name: 'Harbor Run', giver: 'Ray', giverObj: dockWorker,
    lines: [
      ['Ray', 'One more run, kid. A crate needs to reach the far buoy, south end of the bay.'],
      ['Gito', 'By boat, I guess. The coupe does not float.'],
      ['Ray', 'The white boat at the harbor is yours. Mind the waves — and the tourists.']
    ],
    objective: 'Take the boat to the far south buoy', reward: 1200, check: { x: 38, z: 170, r: 10, vehicle: 'boat' } },
  { name: 'Coast Sprint', giver: 'Max', giverObj: bouncer,
    lines: [
      ['Max', 'Alright, hotshot. Coast Road, end to end — north gate in 45 seconds or you are slow.'],
      ['Gito', '45 seconds? The GT can do it in her sleep.'],
      ['Max', 'Then stop talking and drive. Clock starts when you leave the Pier.']
    ],
    objective: 'Race the coupe to the north end — beat 45s!', reward: 1500, par: 45, check: { x: 0, z: -190, r: 10, vehicle: 'car' } }
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
  // Round 27 (C): the Coast Sprint is a time trial — the stage timer
  // (stageStartT) is the clock; finishing under par pays a $500 bonus.
  var elapsed = (typeof t !== 'undefined' && typeof stageStartT !== 'undefined') ? Math.max(0, Math.floor(t - stageStartT)) : 0;
  var bonus = (m.par && elapsed > 0 && elapsed <= m.par) ? 500 : 0;
  setMoney(money + m.reward + bonus);
  addRespect(m.name === 'Coast Sprint' ? 15 : 10);
  missionIdx++; missionStage = 'talk';
  if (bannerEl) {
    if (m.par) bannerEl.textContent = 'Coast Sprint finished in ' + elapsed + 's' + (bonus ? ' — UNDER PAR! +$500 bonus' : ' (par ' + m.par + 's)') + ' · All Missions Complete! +$' + (m.reward + bonus);
    else bannerEl.textContent = missionIdx >= missions.length ? 'All Missions Complete! +$' + m.reward : 'Mission Complete! +$' + m.reward;
    bannerEl.style.display = 'block';
  }
  bannerT = 3;
  saveGame();
  updateObjective();
}
// Round 27 (B): respect — one progression number for the whole game.
// +10 per mission (+15 for the Sprint). Levels are display-only titles;
// the HUD chip (hud.js) shows the number + title after every change.
var respect = 0;
var RESPECT_LEVELS = [[0, 'NOBODY'], [10, 'LOCAL'], [25, 'REGULAR'], [40, 'RESPECTED'], [60, 'COAST LEGEND'], [80, 'KING OF THE COAST']];
function respectLevel() {
  var lv = RESPECT_LEVELS[0][1];
  RESPECT_LEVELS.forEach(function (r) { if (respect >= r[0]) lv = r[1]; });
  return lv;
}
function addRespect(n) {
  respect = Math.min(100, respect + n);
  if (typeof respectEl !== 'undefined' && respectEl) respectEl.textContent = '★ RESPECT ' + respect + ' — ' + respectLevel();
}
// Round 25 (bug #5): one save call for every save path — mission
// complete, the pause menu's Save button.
// Round 26 (worker A, item 1): the old save only kept {mission, money},
// so Continue restored a mission number and cash but NOT the stage,
// health, armour, weapon or ammo — a mid-Mission-1 save reloaded as a
// fresh game ($5,000, pistol 12/60, timer 00:00, Mission 1). The save
// now keeps the full combat + mission state, and the stage timer.
function saveGame() {
  try {
    localStorage.setItem('tc-save', JSON.stringify({
      mission: missionIdx, stage: missionStage, money: money,
      health: Math.round(health), armour: Math.round(armour),
      weapon: weapon, ammo: ammo, reserve: reserve,
      smgAmmo: smgAmmo, smgReserve: smgReserve,
      sgAmmo: sgAmmo, sgReserve: sgReserve,
      rfAmmo: rfAmmo, rfReserve: rfReserve,
      snAmmo: snAmmo, snReserve: snReserve,
      carCond: carCond, respect: respect,
      stageElapsed: (typeof t !== 'undefined') ? Math.max(0, Math.floor(t - stageStartT)) : 0
    }));
  } catch (e) {}
}
// Apply a parsed save onto live state. Missing fields (old saves) fall
// back to the defaults, so a {mission, money} save still loads.
function applySave(sv) {
  if (!sv) return;
  missionIdx = sv.mission || 0;
  missionStage = (sv.stage === 'do' || sv.stage === 'talk') ? sv.stage : 'talk';
  if (sv.money) setMoney(sv.money);
  if (typeof sv.health === 'number') health = sv.health;
  if (typeof sv.armour === 'number') armour = sv.armour;
  if (typeof sv.weapon === 'number') weapon = sv.weapon;
  if (typeof sv.ammo === 'number') ammo = sv.ammo;
  if (typeof sv.reserve === 'number') reserve = sv.reserve;
  if (typeof sv.smgAmmo === 'number') smgAmmo = sv.smgAmmo;
  if (typeof sv.smgReserve === 'number') smgReserve = sv.smgReserve;
  if (typeof sv.sgAmmo === 'number') sgAmmo = sv.sgAmmo;
  if (typeof sv.sgReserve === 'number') sgReserve = sv.sgReserve;
  if (typeof sv.rfAmmo === 'number') rfAmmo = sv.rfAmmo;
  if (typeof sv.rfReserve === 'number') rfReserve = sv.rfReserve;
  if (typeof sv.snAmmo === 'number') snAmmo = sv.snAmmo;
  if (typeof sv.snReserve === 'number') snReserve = sv.snReserve;
  if (typeof sv.carCond === 'number') carCond = sv.carCond;
  if (typeof sv.respect === 'number') { respect = sv.respect; if (typeof respectEl !== 'undefined' && respectEl) respectEl.textContent = '★ RESPECT ' + respect + ' — ' + respectLevel(); }
  // Keep the stage timer running from the saved elapsed time instead of
  // restarting at 00:00 (only once the clock exists — at boot load the
  // Continue handler re-applies the save with the clock running).
  if (typeof t !== 'undefined' && typeof sv.stageElapsed === 'number') {
    stageStartT = t - sv.stageElapsed;
    lastStageKey = missionIdx + '/' + missionStage;
  }
  updateObjective();
}
function hasSave() { try { return !!localStorage.getItem('tc-save'); } catch (e) { return false; } }
// Load saved progress (not in cover renders).
if (!cover) { try { applySave(JSON.parse(localStorage.getItem('tc-save') || 'null')); } catch (e) {} }
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
  hidePanels();
  var pm = document.getElementById('pauseMenu');
  if (pm) pm.style.display = 'none';
  if (s !== 'game' && s !== 'drive') paused = false;
  if (s === 'menu') refreshMenuBtns();
  if (s === 'game' || s === 'drive') { onFoot = true; gito.visible = true; px = 10; pz = 12; heading = 0; speed = 0; carX = 0; carZ = 10; carHeading = 0; spawnSafeT = t + 6; }
}
// Round 25 (bug #5/#6): the menu buttons other than New Game had no
// handler at all — Continue, Settings, Credits and Exit were dead.
// New Game also never reset progress: it kept the loaded save.
function newGame() {
  missionIdx = 0; missionStage = 'talk'; setMoney(5000);
  try { localStorage.removeItem('tc-save'); } catch (e) {}
  updateObjective();
  setScreen('dialogue');
}
function refreshMenuBtns() {
  var cb = document.getElementById('continueBtn');
  if (cb) { cb.style.opacity = hasSave() ? '1' : '0.45'; cb.disabled = !hasSave(); }
}
function showPanel(id) { hidePanels(); var el = document.getElementById(id); if (el) el.style.display = 'block'; }
function hidePanels() { ['settingsPanel', 'creditsPanel'].forEach(function (id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; }); }
// Round 25 (bug #5): pause — Esc/P or the ☰ button. Freezes the sim
// (render.js), offers Resume / Save / Quit to Menu. Never while
// talking, so a dialogue cannot be paused mid-line.
var paused = false;
function setPaused(v) {
  if (v && (screen !== 'game' && screen !== 'drive')) return;
  if (v && talking) return;
  paused = v;
  var pm2 = document.getElementById('pauseMenu');
  if (pm2) pm2.style.display = v ? 'block' : 'none';
  // Round 26 (worker A, item 1): the Save button reads '💾 Save' again
  // each time the pause menu opens, so a '✓ Saved' from the last pause
  // never leaks into the next one.
  if (v) { var sb2 = document.getElementById('pauseSaveBtn'); if (sb2) sb2.textContent = '💾 Save'; }
  if (v) Object.keys(keys).forEach(function (k) { keys[k] = false; });
}
function togglePause() { setPaused(!paused); }
document.getElementById('startBtn').addEventListener('click', function () { startAudio(); setScreen('menu'); });
document.getElementById('newGameBtn').addEventListener('click', function () { startAudio(); newGame(); });
document.getElementById('continueBtn').addEventListener('click', function () { startAudio(); if (hasSave()) { try { applySave(JSON.parse(localStorage.getItem('tc-save') || 'null')); } catch (e) {} setScreen('game'); } });
document.getElementById('settingsBtn').addEventListener('click', function () { startAudio(); showPanel('settingsPanel'); });
document.getElementById('creditsBtn').addEventListener('click', function () { startAudio(); showPanel('creditsPanel'); });
document.getElementById('exitBtn').addEventListener('click', function () { startAudio(); setScreen('splash'); });
document.getElementById('settingsClose').addEventListener('click', function () { hidePanels(); });
document.getElementById('creditsClose').addEventListener('click', function () { hidePanels(); });
document.getElementById('settingsMuteBtn').addEventListener('click', function () { startAudio(); var mm = toggleMute(); document.getElementById('settingsMuteBtn').textContent = mm ? 'Sound: OFF' : 'Sound: ON'; });
// Round 27 (Settings): brightness slider — a CSS filter on the canvas,
// persisted in localStorage and applied on load. The HUD stays crisp
// because only the 3D canvas is filtered.
function applyBrightness(v) {
  var c = document.getElementById('c');
  if (c) c.style.filter = 'brightness(' + v + '%)';
  var bv = document.getElementById('brightVal'); if (bv) bv.textContent = v + '%';
  var bs = document.getElementById('brightSlider'); if (bs && String(bs.value) !== String(v)) bs.value = v;
}
var _bv = 100;
try { _bv = parseInt(localStorage.getItem('tc-brightness') || '100', 10) || 100; } catch (e) {}
if (_bv < 50) _bv = 50; if (_bv > 150) _bv = 150;
applyBrightness(_bv);
var _bs = document.getElementById('brightSlider');
if (_bs) _bs.addEventListener('input', function () { var v = parseInt(_bs.value, 10); try { localStorage.setItem('tc-brightness', String(v)); } catch (e) {} applyBrightness(v); });
document.getElementById('resumeBtn').addEventListener('click', function () { setPaused(false); });
document.getElementById('pauseSaveBtn').addEventListener('click', function () { saveGame(); var b2 = document.getElementById('pauseSaveBtn'); b2.textContent = '✓ Saved'; });
document.getElementById('pauseQuitBtn').addEventListener('click', function () { saveGame(); setPaused(false); setScreen('menu'); });
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
refreshMenuBtns();
