// The main loop: cover-shot staging, ambient life, traffic, police,
// the player (on foot, car, bike, boat, jetski), missions, the HUD and
// the camera director. One frame() call per animation frame.
var clock = new THREE.Clock(); var t = 0;
// Round 26 (item 6): jump — J key / ⬆ button (input.js, hud.js).
// Space stays Attack, so jump is separate. Vertical velocity with
// gravity; jumpH is the height above the ground, added to the on-foot
// position each frame. Grounded only: no double jump.
var jumpVy = 0, jumpH = 0;
// Round 27 (P3 20): heli altitude above the ground (eases 0 -> 12 after
// boarding, holds there while flying, resets on exit).
var heliAlt = 0;
function tryJump() {
  if (screen !== 'game' && screen !== 'drive') return;
  if (!onFoot || talking || cover) return;
  if (typeof paused !== 'undefined' && paused) return;
  if (typeof busted !== 'undefined' && busted) return;
  if (jumpH > 0 || jumpVy !== 0) return;
  jumpVy = 5.4;
  jumpH = 0.001;
}
// Round 26 (item 7): bike riders — tryAttack (missions.js) only ever
// targeted peds / chatters / beachgoers / officers, so a Vespa rider
// could be shot at all day and nothing happened (Gito's report: the
// rider just rode off). The wrapper below runs the original attack
// first, then — only if the shot actually fired and hit no
// pedestrian — applies the same range / arc / damage rules to the
// riders on the moving bikes.
var _riderTmp = null;
function bikeRiders() {
  var out = [];
  bikeTraffic.forEach(function (bk) {
    bk.children.forEach(function (ch) {
      if (ch.userData && ch.userData.legL) out.push(ch);
    });
  });
  return out;
}
function riderWorldPos(r) {
  if (!_riderTmp) _riderTmp = new THREE.Vector3();
  r.getWorldPosition(_riderTmp);
  return _riderTmp;
}
function _npcHpSum() {
  var s = 0;
  peds.concat(chatters).concat(beachgoers).concat(officers).forEach(function (pd) { if (pd.userData.hp !== undefined) s += pd.userData.hp; });
  return s;
}
var _tryAttackOrig = tryAttack;
tryAttack = function () {
  var atk0 = attackT;
  var hp0 = _npcHpSum();
  _tryAttackOrig();
  if (attackT === atk0) return;
  if (_npcHpSum() !== hp0) return;
  var def = WEAPON_DEFS[weapon];
  var fx = -Math.sin(heading), fz = -Math.cos(heading);
  var best = null, bd = def.range;
  bikeRiders().forEach(function (r) {
    if (r.userData.downT > 0) return;
    var wp = riderWorldPos(r);
    var dx = wp.x - px, dz = wp.z - pz;
    var d = Math.hypot(dx, dz);
    if (d > def.range) return;
    var dot = (dx * fx + dz * fz) / (d || 1);
    if (def.gun ? dot < 0.94 : dot < 0.5) return;
    if (d < bd) { bd = d; best = r; }
  });
  if (!best) return;
  if (best.userData.hp === undefined) best.userData.hp = 100;
  best.userData.hp -= def.dmg;
  best.userData.hitT = 0.6;
  best.userData.armL.rotation.x = -2.4; best.userData.armR.rotation.x = -2.4;
  sparkT = 0.3;
  if (best.userData.hp <= 0) {
    best.userData.downT = 8; best.userData.hp = 100; best.rotation.z = Math.PI / 2;
    // Round 28 (item 1, T-pose): same arm reset as tryAttack — a rider
    // shot off his bike mid-pose must fall with arms along the body.
    if (best.userData.armL) { best.userData.armL.rotation.x = 0; best.userData.armR.rotation.x = 0; }
  }
  raiseWanted(1);
};
// Round 26 (item 7): hit feedback polling — tryAttack (missions.js)
// applies damage silently, so the frame loop watches every target's
// hp: a drop since last frame means a hit landed, and shows the
// hitmarker + damage number (hud.js). A fresh downT means the target
// fell: DOWN tag with the finishing damage. Riders get their
// down-timer counted here too — they are not in the NPC down-timer
// loop, so without this a shot-down rider would lie tipped over
// forever (and the bike would keep driving under him).
var _lastHp = new Map();
function watchHits(dt) {
  function check(pd) {
    var u = pd.userData;
    if (u.downT > 0) {
      if (!u._downSeen) {
        u._downSeen = true;
        if (typeof showHitmarker === 'function') {
          var prev = _lastHp.get(pd);
          showHitmarker(prev !== undefined ? prev : 0, true);
        }
      }
      return;
    }
    if (u._downSeen) { u._downSeen = false; _lastHp.set(pd, u.hp === undefined ? 100 : u.hp); return; }
    if (u.hp !== undefined) {
      var prev2 = _lastHp.get(pd);
      if (prev2 === undefined) prev2 = 100;
      if (u.hp < prev2 && typeof showHitmarker === 'function') showHitmarker(prev2 - u.hp, false);
      _lastHp.set(pd, u.hp);
    }
  }
  peds.forEach(check); chatters.forEach(check); beachgoers.forEach(check); officers.forEach(check);
  bikeRiders().forEach(function (r) {
    var u = r.userData;
    if (u.downT > 0) {
      u.downT -= dt;
      if (u.downT <= 0) {
        r.rotation.z = 0; u.hp = 100;
        var sh = (r.parent && r.parent.userData.type === 'sport') ? -1.0 : -0.6;
        u.armL.rotation.x = sh; u.armR.rotation.x = sh;
      }
    }
    check(r);
  });
}
// Cover staging: every cover shot pins the player, the car and the camera
// subject to fixed positions so the frame is repeatable. Gameplay is
// untouched — this only runs with ?cover=1.
function applyCoverSpot() {
  if (screen === 'drive') { onFoot = false; gito.visible = false; speed = 35.55; px = 0; pz = -40; heading = 0; steer = 0; }
  else if (screen === 'dialogue') { onFoot = true; speed = 0; px = 0; pz = 8; heading = 0; steer = 0; carX = 8; carZ = -2; carHeading = 0.12; }
  else if (screen === 'menu') { onFoot = true; speed = 0; px = 20; pz = -70; heading = Math.PI; steer = 0; carX = 3; carZ = -42; carHeading = 0.12; }
  else if (screen === 'game') {
    onFoot = true; speed = 0; heading = 0; steer = 0; carX = 3; carZ = -42; carHeading = 0.12;
    var spot = qs.get('spot');
    if (spot === 'residential') { px = -80; pz = -95; }
    else if (spot === 'harbor') { px = -80; pz = -150; }
    else if (spot === 'club') { px = -110; pz = 125; heading = Math.PI / 2; }
    else if (spot === 'promenade') { px = 11.5; pz = -60; carX = 3; carZ = -80; }
    else if (spot === 'talk') { px = 20; pz = -55; heading = Math.PI / 4; carX = 3; carZ = -42; carHeading = 0.12; if (!talking) { talking = true; talkLines = missions[0].lines; talkIdx = 0; showTalk(talkLines[0][0], talkLines[0][1]); } }
    else if (spot === 'boats') { px = 20; pz = 30; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'bikes') { px = -6; pz = 16; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'vespa') { px = -17; pz = -23; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'heli') { px = 22; pz = 10; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'wide') { px = 20; pz = 60; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'fjetski') { px = 34; pz = -60; heading = 0.3; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'fbike') { px = 6; pz = 12; heading = -1.2; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'fvespa') { px = -14; pz = -20; heading = 0.4; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'sbike') { px = 6; pz = 12; heading = -1.2; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'svespa') { px = -12; pz = -20; heading = 0.4; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'carside') { px = 0; pz = 10; heading = 0; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'carfront') { px = 0; pz = 10; heading = 0; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'fboat') { px = 48; pz = 30; heading = -0.4; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'fheli') { px = 22; pz = 10; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'signs-house') { px = -75; pz = -96; }
    else if (spot === 'signs-promenade') { px = 24; pz = 110; }
    else if (spot === 'signs-harbor') { px = -70; pz = -160; }
    else if (spot === 'signs-towers') { px = 14; pz = -10; }
    else if (spot === 'signs-club') { px = -70; pz = 125; }
    else if (spot === 'rboat') { px = 34; pz = 30; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'rbike') { px = 4; pz = 12; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'rjet') { px = 34; pz = 10; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'rtraffic') { px = 20; pz = 60; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'carrear') { px = 20; pz = 60; carX = 12.5; carZ = -55.5; carHeading = -Math.PI / 2 + 0.15; }
    else if (spot === 'bikesmany') { px = 20; pz = 60; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'bikestraffic') { px = 20; pz = 60; carX = 0; carZ = 10; carHeading = 0; }
    else if (spot === 'chase') { onFoot = false; rideMode = 'car'; gito.visible = false; speed = 35; px = 0; pz = -40; heading = Math.PI; steer = 0; carX = 0; carZ = -40; carHeading = Math.PI; wanted = 4; }
    else if (spot === 'sunset') { onFoot = false; rideMode = 'car'; gito.visible = false; speed = 30; px = 0; pz = -80; heading = Math.PI; steer = 0; carX = 0; carZ = -80; carHeading = Math.PI; }
    else { px = 13.5; pz = -54; carX = 12.5; carZ = -55.5; carHeading = -Math.PI / 2 + 0.15; }
  }
}
// Round 18: a car that just hit the player brakes hard for a moment
// instead of driving on through the body. brakeK is its speed factor.
// Round 19 — mobile smoothness: the city ships ~9700 meshes and ~7900
// shadow casters (~2000 draw calls a frame in view). Merge the static
// same-material boxes/planes into one mesh per material (zero visual
// change: identical material, baked world transforms), and stop tiny
// static meshes from casting shadows. Animated things are never merged:
// characters, vehicles, the wheel, helis, boats, markers, glints, buoys
// and the HUD meshes are excluded by reference or by geometry.
function mergeGeoms(list) {
  var pos = [], norm = [], uv = [], idx = [], vBase = 0;
  list.forEach(function (m) {
    m.updateMatrixWorld(true);
    var g = m.geometry.clone().applyMatrix4(m.matrixWorld);
    var p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
    for (var i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      norm.push(n.getX(i), n.getY(i), n.getZ(i));
      uv.push(u.getX(i), u.getY(i));
    }
    if (g.index) { for (var j = 0; j < g.index.count; j++) idx.push(g.index.getX(j) + vBase); }
    else { for (var k = 0; k < p.count; k++) idx.push(vBase + k); }
    vBase += p.count;
  });
  var out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}
function optimizeScene() {
  var exclude = new Set([enterArrow, beacon, spark, volleyNet, sunDisc, sunGlow]);
  marks.forEach(function (mk) { exclude.add(mk.mesh); });
  glints.forEach(function (g2) { exclude.add(g2); });
  buoys.forEach(function (b3) { exclude.add(b3); });
  var groups = {};
  var merged = 0, mergedMeshes = 0;
  scene.children.slice().forEach(function (m) {
    if (!m.isMesh || exclude.has(m)) return;
    var gt = m.geometry && m.geometry.type;
    if (gt !== 'PlaneGeometry' && gt !== 'BoxGeometry') return;
    var mt = m.material;
    if (!mt || mt.map) return;
    if (mt.type !== 'MeshBasicMaterial' && mt.type !== 'MeshLambertMaterial') return;
    var key = mt.type + '|' + (mt.color ? mt.color.getHexString() : '') + '|' + !!mt.transparent + '|' + mt.opacity + '|' + mt.side + '|' + !!mt.fog + '|' + !!mt.depthWrite;
    (groups[key] = groups[key] || []).push(m);
  });
  Object.keys(groups).forEach(function (key) {
    var list = groups[key];
    if (list.length < 2) return;
    var mat = list[0].material;
    var cast = false, recv = false;
    list.forEach(function (m) { if (m.castShadow) cast = true; if (m.receiveShadow) recv = true; });
    var mergedMesh = new THREE.Mesh(mergeGeoms(list), mat);
    mergedMesh.castShadow = cast; mergedMesh.receiveShadow = recv;
    list.forEach(function (m) { scene.remove(m); mergedMeshes++; });
    scene.add(mergedMesh); merged++;
  });
  // Shadow pruning: static meshes smaller than ~1 m across do not cast —
  // their shadows are invisible at this sun frustum, but each one costs
  // a draw call in the shadow pass. Characters and vehicles keep theirs.
  var dynamicRoots = [gito, woman, player].concat(traffic, aveTraffic, ave2Traffic, ave3Traffic, crossTraffic, bikeTraffic, bikes, motorboats, jetskis, [police, police2, police3, police4, police5, police6, taxi, heli, tourHeli], peds, chatters, beachgoers, officers);
  missions.forEach(function (mm) { if (mm.giverObj) dynamicRoots.push(mm.giverObj); });
  function isDynamic(o) { while (o) { if (dynamicRoots.indexOf(o) >= 0) return true; o = o.parent; } return false; }
  var pruned = 0;
  scene.updateMatrixWorld(true);
  scene.traverse(function (o) {
    if (!o.isMesh || !o.castShadow || isDynamic(o)) return;
    var g = o.geometry;
    if (!g.boundingSphere) g.computeBoundingSphere();
    var sc = new THREE.Vector3().setFromMatrixScale(o.matrixWorld);
    var r = g.boundingSphere.radius * Math.max(sc.x, sc.y, sc.z);
    if (r < 1.0) { o.castShadow = false; pruned++; }
  });
  window.__r19opt = { mergedGroups: merged, mergedMeshes: mergedMeshes, prunedCasters: pruned };
}
optimizeScene();
function brakeK(o) { return o.userData.brakeT > 0 ? 0.25 : 1; }
// Round 24: traffic separation — same-lane cars used to rear-end each
// other (each lane runs several cars at DIFFERENT speeds: coast x=-3 runs
// 6/8/10 m/s, x=3 runs 7/9, every avenue runs 5/7/9, bikes up to 23 —
// with no spacing logic the fast car behind always caught the slow car
// ahead, and patrol police cars at 5 m/s sat IN the traffic lanes).
// After every traffic move, enforce a 6.5 m circular gap (track wraps
// z 210 -> -210, so the gap is measured on the 420 m loop) between any
// two vehicles in the same lateral band (|dx| < 2.5): the follower is
// held back to leader.z - 6.5, so it effectively matches the leader's
// speed instead of driving through it. No speed is changed, no rnd().
var ZTRACK = 420, ZGAP = 6.5;
function separateTraffic(list) {
  for (var i = 0; i < list.length; i++) {
    var f = list[i];
    for (var j = 0; j < list.length; j++) {
      if (i === j) continue;
      var l = list[j];
      if (Math.abs(l.position.x - f.position.x) >= 2.5) continue;
      var g = l.position.z - f.position.z;
      if (g < 0) g += ZTRACK;
      if (g > 0 && g < ZGAP) {
        f.position.z = l.position.z - ZGAP;
        if (f.position.z < -210) f.position.z += ZTRACK;
      }
    }
  }
}
// Round 24: a cross-street car yields instead of driving through
// north-south traffic at the intersection — true while any z-vehicle is
// inside the crossing box ahead of it.
function crossBlocked(cx, cz) {
  var all = traffic.concat(aveTraffic, ave2Traffic, ave3Traffic, bikeTraffic, [taxi, police, police2, police3, police4, police5, police6]);
  for (var i = 0; i < all.length; i++) {
    var o = all[i];
    if (Math.abs(o.position.z - cz) < 5 && Math.abs(o.position.x - cx) < 10) return true;
  }
  return false;
}
// Round 24: shared cop-gunfire visuals — one muzzle flash + one tracer,
// repositioned per shot (never created per shot). The flash is a bright
// ball at the officer's gun; the tracer is a thin yellow box stretched
// from the gun to the player's chest for one frame-window.
var copFlash = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe97a }));
copFlash.visible = false; scene.add(copFlash);
var copTracer = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1), new THREE.MeshBasicMaterial({ color: 0xffe97a, transparent: true, opacity: 0.85 }));
copTracer.visible = false; scene.add(copTracer);
var copShots = 0, copHits = 0, copFlashT = 0;
// Round 24: aim the shared tracer from (fx,fy,fz) at the player and show
// the flash at the gun for 0.08 sim-s.
function copFireFx(fx, fy, fz) {
  copFlash.position.set(fx, fy, fz); copFlash.visible = true;
  var dx = px - fx, dy = 1.1 - fy, dz = pz - fz;
  var d = Math.hypot(dx, dy, dz) || 1;
  copTracer.position.set((fx + px) / 2, (fy + 1.1) / 2, (fz + pz) / 2);
  copTracer.scale.set(1, 1, d);
  copTracer.lookAt(px, 1.1, pz);
  copTracer.visible = true;
  copFlashT = 0.12;
}
// Round 22: on-foot police pursuit — a unit closes on a target point at
// a capped speed (m/s), sliding along walkable ground so it never clips
// through buildings or into the sea. 7 m/s for the lead unit: faster
// than walking (5), slower than the player's run (8.5), so Gito can
// still escape on foot by running.
function chaseOnFoot(pu, tx, tz, spd, dt) {
  var dx = tx - pu.position.x, dz = tz - pu.position.z;
  var d = Math.hypot(dx, dz);
  if (d < 0.01) return;
  var step = Math.min(spd * dt, d);
  var nx = pu.position.x + (dx / d) * step, nz = pu.position.z + (dz / d) * step;
  if (walkable(nx, nz)) { pu.position.x = nx; pu.position.z = nz; }
  else if (walkable(nx, pu.position.z)) pu.position.x = nx;
  else if (walkable(pu.position.x, nz)) pu.position.z = nz;
  pu.rotation.y = Math.atan2(-dx / d, -dz / d);
}
// Round 26 (item 3): the police response scales with the stars, so one
// shot does not bring the whole department — 1 star is 2 cars + 2 foot
// officers, each extra star adds one car and one officer, and the heli
// only joins at 3 stars. At 5 stars this is still the old full
// response: 6 cars + 6 officers + heli = 13. Top-level so hud.js can
// read the same table for the dispatch panel — the panel never
// disagrees with what is actually chasing.
function policeResponse(w) {
  if (w <= 0) return { cars: 0, officers: 0, heli: false, total: 0 };
  var n = Math.min(6, w + 1);
  return { cars: n, officers: n, heli: w >= 3, total: n * 2 + (w >= 3 ? 1 : 0) };
}
// Round 26 (worker A, patrol exception; coordinator: knockback without
// stars): a police car still on patrol — below its chase star in
// policeResponse, so it is lane traffic, not a pursuer — never raises
// wanted on contact, but it still knocks Gito clear (thud + brake),
// so it does not ghost through the player. The Round 25 lead-car hold
// (3.5 m) fixed only the lead unit; police2-6 patrolling the coast-road
// lanes could still run Gito down and raise wanted out of nowhere
// (probe: police2 contact at 2.35 m, wanted 0 -> 1, no other car within
// 18 m). A car that IS chasing (index < policeResponse cars) still hits
// AND raises wanted, as before.
function policePatrolling(o) {
  var units = [police, police2, police3, police4, police5, police6];
  var idx = units.indexOf(o);
  if (idx < 0) return false;
  return idx >= policeResponse(wanted).cars;
}
// Round 22: fleeing NPCs — run away from the player at ~2x walk speed
// with a fast leg cycle, arms raised, head bowed; walkable-checked per
// step so they never clip through buildings. Runs after the normal NPC
// loops so the flee pose wins while fleeT runs; when it ends the NPC
// faces its old direction and walks normally again.
function endFlee(pd) {
  var u = pd.userData;
  u.fleeT = 0; pd.rotation.y = u.fleeRotY || 0;
  if (u.head) u.head.rotation.x = 0;
  // Round 28 (item 1): the flee pose raises both arms (-1.8), but
  // beachgoers have no per-frame arm loop and chatters only drive the
  // right arm — after a flee their arms stayed raised forever, a
  // permanent arms-up statue on the beach. Arms hang again now.
  if (u.armL) { u.armL.rotation.x = 0; u.armR.rotation.x = 0; }
}
function updateFlee(list, dt) {
  list.forEach(function (pd) {
    var u = pd.userData;
    if (!(u.fleeT > 0)) return;
    if (u.downT > 0) { endFlee(pd); return; }
    var dx = pd.position.x - px, dz = pd.position.z - pz;
    var d = Math.hypot(dx, dz) || 1;
    if (d > 18) { endFlee(pd); return; }
    var sp = (u.sp || 1) * 3;
    var nx = pd.position.x + (dx / d) * sp * dt, nz = pd.position.z + (dz / d) * sp * dt;
    if (walkable(nx, nz)) { pd.position.x = nx; pd.position.z = nz; }
    else if (walkable(nx, pd.position.z)) pd.position.x = nx;
    else if (walkable(pd.position.x, nz)) pd.position.z = nz;
    pd.position.y = groundY(pd.position.x, pd.position.z);
    pd.rotation.y = Math.atan2(dx / d, dz / d);
    u.walk = (u.walk || 0) + dt * 9;
    var sw = Math.sin(u.walk) * 0.55;
    if (u.legL) { u.legL.rotation.x = sw; u.legR.rotation.x = -sw; }
    // Round 29 (item 4, Gito live 17:11 WIB): the old flee pose held
    // both arms stiff at -1.8 (raised forward-up) for the whole run —
    // from the side/behind that reads as a T-pose statue, and every
    // gunshot triggered it again ("berulang kali"). A fleeing person
    // RUNS: arms pump opposite the legs, like the walk swing but
    // bigger and faster. The bowed head stays — the panic read now
    // comes from the run itself, not from frozen raised arms.
    if (u.armL) { u.armL.rotation.x = -sw * 1.4; u.armR.rotation.x = sw * 1.4; }
    if (u.head) u.head.rotation.x = 0.25;
    u.fleeT -= dt;
    if (u.fleeT <= 0) endFlee(pd);
  });
}
// Round 22: smoothed follow heading — the camera swings behind the
// player gradually instead of snapping to the facing every frame.
var camHead = 0, camHeadInit = false;
function frame() {
  requestAnimationFrame(frame);
  var dt = Math.min(clock.getDelta(), 0.05);
  // Round 25: pause — freeze the sim (Esc/P or the ☰ button), keep
  // rendering the frozen frame so the pause menu sits over the game.
  // The clock delta is already consumed, so resuming does not jump.
  // Round 26 (item 4): BUSTED freezes the sim the same way until the
  // player respawns or quits to the menu (hud.js clears `busted`).
  if ((typeof paused !== 'undefined' && paused) || (typeof busted !== 'undefined' && busted)) { renderer.render(scene, cam); return; }
  t += dt;
  var playing = (screen === 'game' || screen === 'drive');
  // Golden-hour sun rig follows the player so the long shadows stay in
  // frame wherever the chase goes, at ~15° elevation nearly straight
  // south — shadows point north, toward the camera.
  if (variant === 'golden') {
    sun.position.set(px + 12, 20, pz + 78);
    sun.target.position.set(px, 0, pz);
    sun.target.updateMatrixWorld();
  }
  if (cover) applyCoverSpot();

  // Ambient animation: birds circle (hidden in cover shots), glints
  // shimmer, buoys bob, the ferris wheel turns, the police heli hovers
  // (and hunts the player while wanted), boats and jetskis bob, the tour
  // heli circles the beach, mission "!" markers bob above the giver.
  birds.forEach(function (bd, i) {
    bd.visible = !cover;
    var a = t * bd.userData.sp + bd.userData.ph;
    bd.position.set(Math.cos(a) * bd.userData.r, bd.userData.h + Math.sin(t * 0.7 + i) * 2, -120 + Math.sin(a) * bd.userData.r);
    bd.rotation.y = -a;
    var fl2 = Math.sin(t * 9 + i * 2) * 0.5;
    bd.userData.wl.rotation.z = fl2; bd.userData.wr.rotation.z = -fl2;
  });
  heli.visible = cover ? qs.get('spot') === 'chase' : wanted >= 3;
  glints.forEach(function (g2, i) { g2.material.opacity = 0.2 + 0.25 * Math.abs(Math.sin(t * 1.5 + i * 1.3)); });
  buoys.forEach(function (b3, i) { b3.position.y = 0.2 + Math.sin(t * 1.5 + i) * 0.15; });
  wheel.rotation.z += dt * 0.15;
  heli.userData.rotor.rotation.y += dt * 20;
  heli.position.y = 26 + Math.sin(t * 0.8) * 0.8;
  if (wanted >= 3 && !cover) { heli.position.x += (px - heli.position.x) * dt * 0.5; heli.position.z += ((pz - 15) - heli.position.z) * dt * 0.5; }
  if (heli.userData.spot) heli.userData.spot.material.opacity = wanted >= 3 ? 0.4 : 0.12;
  motorboats.forEach(function (b) { b.position.y = b.userData.baseY + Math.sin(t * 0.9 + b.userData.ph) * 0.05; b.rotation.x = Math.sin(t * 0.7 + b.userData.ph) * 0.02; b.rotation.z = Math.cos(t * 0.6 + b.userData.ph) * 0.02; });
  jetskis.forEach(function (j) { j.position.y = j.userData.baseY + Math.sin(t * 1.1 + j.userData.ph) * 0.06; j.rotation.x = Math.sin(t * 0.9 + j.userData.ph) * 0.03; });
  tourHeli.userData.rotor.rotation.y += dt * 25;
  tourHeli.userData.tailRotor.rotation.x += dt * 30;
  var ha = t * 0.08 + 2.34;
  tourHeli.position.set(48 + 15 * Math.cos(ha), 28 + Math.sin(t * 0.5) * 0.8, 20 + 15 * Math.sin(ha));
  tourHeli.rotation.y = Math.atan2(Math.sin(ha), -Math.cos(ha));
  marks.forEach(function (mk, i) {
    mk.mesh.position.y = 2.75 + Math.sin(t * 3 + i) * 0.15;
    var cm3 = curMission();
    mk.mesh.visible = !cover && !!cm3 && missionStage === 'talk' && cm3.giverObj === mk.obj;
  });
  if (police.userData.lightR) {
    var on = Math.floor(t * 4) % 2 === 0;
    police.userData.lightR.material.color.setHex(on ? 0xff2222 : 0x661111);
    police.userData.lightB.material.color.setHex(on ? 0x111166 : 0x2244ff);
  }

  // Traffic flow (z-flow on the coast road and avenues, x-flow on the
  // cross streets, bikes like cars) and police patrol / chase.
  traffic.forEach(function (tr, i) {
    if (tr.userData.adopted) return;
    tr.position.z += dt * (6 + i) * brakeK(tr);
    if (tr.position.z > 210) tr.position.z = -210;
  });
  aveTraffic.forEach(function (tr, i) {
    if (tr.userData.adopted) return;
    tr.position.z += dt * (5 + i * 2) * brakeK(tr);
    if (tr.position.z > 210) tr.position.z = -210;
  });
  ave2Traffic.forEach(function (tr, i) {
    if (tr.userData.adopted) return;
    tr.position.z += dt * (5 + i * 2) * brakeK(tr);
    if (tr.position.z > 210) tr.position.z = -210;
  });
  ave3Traffic.forEach(function (tr, i) {
    if (tr.userData.adopted) return;
    tr.position.z += dt * (5 + i * 2) * brakeK(tr);
    if (tr.position.z > 210) tr.position.z = -210;
  });
  // Round 24: every cross street carries a car now (one per street,
  // dir in userData), the full width of the grid (x -158..8), and each
  // car yields at intersections instead of crossing through traffic.
  crossTraffic.forEach(function (ct) {
    if (ct.userData.adopted) return;
    if (crossBlocked(ct.position.x, ct.position.z)) return;
    if (ct.userData.dir > 0) { ct.position.x += dt * 8 * brakeK(ct); if (ct.position.x > 8) ct.position.x = -158; }
    else { ct.position.x -= dt * 8 * brakeK(ct); if (ct.position.x < -158) ct.position.x = 8; }
  });
  bikeTraffic.forEach(function (tr, i) {
    tr.position.z += dt * (7 + i * 2) * brakeK(tr);
    if (tr.position.z > 210) tr.position.z = -210;
  });
  [traffic, aveTraffic, ave2Traffic, ave3Traffic, crossTraffic, bikeTraffic].forEach(function (list) {
    list.forEach(function (o) { if (o.userData.brakeT > 0) o.userData.brakeT -= dt; });
  });
  // Round 24: keep the lanes separated (see separateTraffic above) —
  // AFTER every vehicle has moved this frame, bikes included, so no
  // vehicle renders one frame inside another. Patrol police cars join
  // the coast-road set only while wanted is 0 — once wanted, they
  // chase and are no longer lane traffic.
  var sepList = traffic.concat(aveTraffic, ave2Traffic, ave3Traffic, bikeTraffic, [taxi]);
  if (wanted === 0) sepList = sepList.concat([police, police2, police3, police4, police5, police6]);
  // Round 25 (bug #4): an adopted car is driven by the player, not the
  // lane logic — keep it out of the separation pass.
  sepList = sepList.filter(function (o) { return !o.userData.adopted; });
  separateTraffic(sepList);
  var chaseK = wanted > 0 ? 2.4 : 1.2;
  // Round 25 (bug #4): the lead police car does not patrol or chase
  // while Gito drives it.
  if (!police.userData.adopted && onFoot) {
    // Round 22: wanted on foot means a real pursuit now — the lead unit
    // closes at 7 m/s (outrun it with the run button, not by walking).
    // No wanted, the old slow patrol drift stays.
    if (wanted > 0) chaseOnFoot(police, px + 3.5, pz - 3, 7.0, dt);
    else {
      // Round 24 (self-hunt #11): the old blind lerp to (px-4.2, pz-30)
      // drove straight THROUGH the player whenever he stood between
      // the car's start and its shadow spot (proven in the Round 24
      // probe: police from (3.2,-2) ran over a player at (-8,-80) and
      // raised wanted to 1 out of nowhere). Hold position if the next
      // step would come within 3.5 m of the player.
      var npx2 = police.position.x + ((px - 4.2) - police.position.x) * dt * 0.8;
      var npz2 = police.position.z + ((pz - 30) - police.position.z) * dt * 0.8;
      if (Math.hypot(npx2 - px, npz2 - pz) > 3.5) { police.position.x = npx2; police.position.z = npz2; }
      police.rotation.y = Math.PI;
    }
  } else if (!police.userData.adopted) {
    police.position.x += ((px + 3.5) - police.position.x) * dt * chaseK;
    police.position.z += ((pz - 3) - police.position.z) * dt * chaseK;
    police.rotation.y = heading;
  }
  if (!police2.userData.adopted && wanted > 0 && !onFoot) {
    police2.position.x += ((px - 3.5) - police2.position.x) * dt * 2.0;
    police2.position.z += ((pz - 6) - police2.position.z) * dt * 2.0;
    police2.rotation.y = heading;
  } else if (!police2.userData.adopted && wanted >= 1 && onFoot) { chaseOnFoot(police2, px - 3.5, pz - 6, 6.5, dt); }
  // Round 23: patrol drives +z, so the unit faces +z — without this the
  // car kept whatever yaw the last chase left (usually 0: backwards).
  else if (!police2.userData.adopted) { police2.rotation.y = Math.PI; police2.position.z += dt * 5; if (police2.position.z > 210) police2.position.z = -210; }
  // Round 26 (item 3): staged response — the 3rd car joins at 2 stars,
  // the 4th at 3, the 5th at 4, the 6th at 5 (policeResponse). Below its
  // star a car patrols instead of chasing. Officers stage identically
  // (chaseN below), so a patrolling car never sits beside a chasing
  // officer — the pair stays consistent at every level, which is what
  // the Round 24 all-chase rule was protecting.
  [[police3, 6, -12, 2], [police4, -6, -16, 3], [police5, 2, -20, 4], [police6, -2, -24, 5]].forEach(function (u) {
    var pu = u[0];
    if (pu.userData.adopted) return;
    if (wanted >= u[3] && !onFoot) {
      pu.position.x += ((px + u[1]) - pu.position.x) * dt * 2.0;
      pu.position.z += ((pz + u[2]) - pu.position.z) * dt * 2.0;
      pu.rotation.y = heading;
    } else if (onFoot && wanted >= u[3]) { chaseOnFoot(pu, px + u[1], pz + u[2], 6.5, dt); }
    // Round 23: same backwards-patrol fix as police2 — patrol drives +z.
    else { pu.rotation.y = Math.PI; pu.position.z += dt * 5; if (pu.position.z > 210) pu.position.z = -210; }
  });
  // Round 25 (bug #4): the taxi does not drive itself while adopted.
  if (!taxi.userData.adopted) { taxi.position.z += dt * 7 * brakeK(taxi); if (taxi.position.z > 210) taxi.position.z = -210; }
  if (taxi.userData.brakeT > 0) taxi.userData.brakeT -= dt;
  if (cover && screen === 'drive') {
    police.position.set(-4, 0, pz - 14); police.rotation.y = heading;
    police2.position.set(3.5, 0, pz - 28); police2.rotation.y = heading;
    traffic[0].position.set(3, 0, pz - 26); traffic[0].rotation.y = heading;
  }
  // Chase / sunset cover staging: police flank the player just ahead of
  // the rear bumper, the heli sits above-ahead, traffic stages as a dense
  // column ahead. Runs every frame, after the patrol lerp above.
  if (cover && screen === 'game' && qs.get('spot') === 'chase') {
    police.position.set(-4.5, 0, pz + 6); police.rotation.y = heading;
    police2.position.set(3.5, 0, pz + 8); police2.rotation.y = heading;
    police3.position.set(-4.5, 0, pz + 13); police3.rotation.y = heading;
    police4.position.set(3.5, 0, pz + 18); police4.rotation.y = heading;
    police5.position.set(-4.5, 0, pz + 23); police5.rotation.y = heading;
    police6.position.set(3.5, 0, pz + 28); police6.rotation.y = heading;
    heli.position.set(px + 6, 19, pz + 42);
    traffic[0].position.set(3, 0, pz + 26); traffic[0].rotation.y = heading;
    traffic[1].position.set(-3, 0, pz + 45); traffic[1].rotation.y = heading;
    traffic[2].position.set(-3, 0, pz + 65); traffic[2].rotation.y = heading;
    traffic[3].position.set(3, 0, pz + 85); traffic[3].rotation.y = heading;
    traffic[4].position.set(-3, 0, pz + 105); traffic[4].rotation.y = heading;
    taxi.position.set(-2, 0, pz + 130); taxi.rotation.y = heading;
  }
  if (cover && screen === 'game' && qs.get('spot') === 'sunset') {
    police.position.set(-4, 0, pz + 40); police.rotation.y = heading;
    police2.position.set(3.5, 0, pz + 60); police2.rotation.y = heading;
    police3.position.set(-4, 0, pz + 80); police3.rotation.y = heading;
    police4.position.set(3.5, 0, pz + 100); police4.rotation.y = heading;
    police5.position.set(-4, 0, pz + 120); police5.rotation.y = heading;
    police6.position.set(3.5, 0, pz + 140); police6.rotation.y = heading;
    traffic[0].position.set(3, 0, pz + 70); traffic[0].rotation.y = heading;
    traffic[1].position.set(-3, 0, pz + 90); traffic[1].rotation.y = heading;
    traffic[2].position.set(3, 0, pz + 110); traffic[2].rotation.y = heading;
    traffic[3].position.set(-3, 0, pz + 130); traffic[3].rotation.y = heading;
    traffic[4].position.set(3, 0, pz + 150); traffic[4].rotation.y = heading;
    taxi.position.set(-2, 0, pz + 170); taxi.rotation.y = heading;
  }
  // Police never enter the water: clamp every unit to the land band.
  // Round 26: a car the clamp pinned to x=12 must not patrol that line
  // forever — x=12 IS the promenade, 2 m from the spawn (10,12) and
  // past the billboard viewpoint, so a chase east of x=6 used to leave
  // up to 4 cruisers driving the promenade past Gito (probe: after a
  // 5 s chase at px=20, police/police2/police3/police4 all sat at x=12,
  // still there 10 s after the heat died — police4 at (12,101) in the
  // billboard shot). A patrolling car (police2-6) eases back to its
  // home lane instead; the lead car keeps the plain clamp — its x is
  // steered by the shadow-spot lerp, so it follows the player west
  // on its own.
  [police, police2, police3, police4, police5, police6].forEach(function (pu, i) {
    if (pu.position.x > 12) pu.position.x = 12;
    if (i > 0 && policePatrolling(pu) && !pu.userData.adopted) { var lx = [-3.5, -3.5, 3.5, -3.5, 3.5][i - 1]; pu.position.x += (lx - pu.position.x) * dt * 0.5; }
  });
  // Pedestrians walk their sidewalk; chatters nod and gesture.
  // Round 19: a downed NPC lies still until downT runs out, and a hit
  // NPC throws its arms up for the length of hitT instead of walking.
  peds.forEach(function (pd) {
    if (pd.userData.downT > 0) return;
    if (!(pd.userData.fleeT > 0)) pd.userData.walk += dt * 3;
    var dir = pd.userData.side < 0 ? 1 : -1;
    if (!(pd.userData.hitT > 0) && !(pd.userData.fleeT > 0)) pd.position.z += dir * dt * pd.userData.sp * 1.5;
    if (pd.position.z > 210) pd.position.z = -210;
    if (pd.position.z < -210) pd.position.z = 210;
    pd.position.y = groundY(pd.position.x, pd.position.z);
    var sw = Math.sin(pd.userData.walk) * 0.4;
    pd.userData.legL.rotation.x = sw; pd.userData.legR.rotation.x = -sw;
    pd.userData.armL.rotation.x = -sw; pd.userData.armR.rotation.x = sw;
    if (pd.userData.hitT > 0) { pd.userData.armL.rotation.x = -2.4; pd.userData.armR.rotation.x = -2.4; }
  });
  chatters.forEach(function (ch, i) {
    ch.userData.head.rotation.z = Math.sin(t * 2 + i) * 0.15;
    ch.userData.armR.rotation.x = -0.5 + Math.sin(t * 3 + i) * 0.3;
    if (ch.userData.hitT > 0) ch.userData.armR.rotation.x = -2.4;
  });
  // Round 19: downed NPCs get back up after 8 s (hp restored); hit
  // timers count down for every NPC list, not just the walking peds.
  // Round 25 (bug #9): officers count here too, so a shot-down cop
  // gets back up after 8 s instead of lying there forever.
  [peds, chatters, beachgoers, officers].forEach(function (list) {
    list.forEach(function (pd) {
      if (pd.userData.downT > 0) {
        pd.userData.downT -= dt;
        if (pd.userData.downT <= 0) {
          pd.rotation.z = 0; pd.userData.hp = 100;
          // Round 28 (item 1): belt and braces — a body that gets up
          // never keeps a frozen fall pose in its arms.
          if (pd.userData.armL) { pd.userData.armL.rotation.x = 0; pd.userData.armR.rotation.x = 0; }
        }
      }
      if (pd.userData.hitT > 0) pd.userData.hitT -= dt;
    });
  });
  // Round 26 (item 7): hit feedback — watch hp drops / fresh falls
  // (see watchHits above) and flash the hitmarker + damage number.
  watchHits(dt);
  // Round 22: gunshot flee — after the normal NPC loops, so the run
  // pose + escape movement win while fleeT runs.
  updateFlee(peds, dt); updateFlee(chatters, dt); updateFlee(beachgoers, dt);
  // Round 23: foot officers — always visible on patrol near their post
  // while wanted is 0; when wanted, they chase the player on foot,
  // lead at 7.0 m/s, the rest at 6.5 — both slower than the player's
  // 8.5 m/s run, so Gito can still escape. When the heat dies they walk
  // back to their post and resume patrol. Contact is just a near-miss
  // (no damage from touching an officer) — only their GUNFIRE hurts.
  // Round 26 (item 3): staged chase — 1 star sends 2 officers, each
  // extra star one more, all six only at 5 (policeResponse). The cars
  // stage identically, so the car/officer pair stays consistent.
  // Round 24 (bug #3): from 2 stars (GTA-style: 1 star is chase-only,
  // guns come out at 2) a chasing officer SHOOTS — visible muzzle
  // flash + tracer + gunshot sound, 4 damage a hit through the normal
  // armour/health path, ~1.1 s between shots per officer, hit chance
  // by range (close shots land, long ones often miss), so the player
  // is threatened but can still outrun them at 8.5 m/s. No shooting
  // while talking, in cover staging, or at 0-1 stars.
  // Facing note (#14): chaseOnFoot was built for CARS (front = -z
  // local), so a person steered by it faces backwards. Every branch
  // below re-sets rotation with the PERSON formula (front = +z local):
  // rotation.y = atan2(dx, dz) toward the target.
  (function () {
    var chaseN = policeResponse(wanted).officers;
    officers.forEach(function (of, oi) {
      var u = of.userData;
      if (u.shotCd === undefined) { u.shotCd = oi * 0.37; u.shots = 0; u.shootT = 0; }
      if (u.shotCd > 0) u.shotCd -= dt;
      if (u.shootT > 0) u.shootT -= dt;
      // Round 25 (bug #9): a downed officer lies still — no chase, no
      // gunfire — until the down timer (counted with the other NPCs)
      // runs out and he gets back up.
      if (u.downT > 0) return;
      if (oi < chaseN) {
        var tx = px + (oi % 2 === 0 ? 2.5 : -2.5), tz = pz - 3 - oi * 2;
        chaseOnFoot(of, tx, tz, oi === 0 ? 7.0 : 6.5, dt);
        of.rotation.y = Math.atan2(tx - of.position.x, tz - of.position.z);
        u.walk += dt * 10;
        var sw = Math.sin(u.walk) * 0.55;
        u.legL.rotation.x = sw; u.legR.rotation.x = -sw;
        u.armL.rotation.x = -sw; u.armR.rotation.x = sw;
        // Round 25 (bug #9): a hit officer throws his arms up, like a
        // hit civilian — the chase pose used to overwrite the flinch.
        if (u.hitT > 0) { u.armL.rotation.x = -2.4; u.armR.rotation.x = -2.4; }
        of.position.y = groundY(of.position.x, of.position.z);
        // Round 24: gunfire. Aim pose (right arm forward) while the
        // shot reads; the gun sits at chest height, 0.45 m ahead.
        var od = Math.hypot(px - of.position.x, pz - of.position.z);
        if (u.shootT > 0) { u.armR.rotation.x = -1.4; u.armL.rotation.x = -1.2; }
        if (wanted >= 2 && !cover && playing && !talking && u.shotCd <= 0 && od < 28 && od > 2) {
          u.shotCd = 1.1; u.shootT = 0.35; u.shots++;
          copShots++;
          var fx = of.position.x + Math.sin(of.rotation.y) * 0.45, fz = of.position.z + Math.cos(of.rotation.y) * 0.45;
          copFireFx(fx, 1.35, fz);
          playShot();
          var hit = od < 14 || (u.shots % 2 === 0);
          if (hit) { copHits++; damagePlayer(4); sparkT = 0.2; }
        }
      } else {
        // Round 24 (bug #1, ROOT CAUSE found by probe): the old code
        // ran patrol only inside `else` of `dist-to-post > 1.5` — so
        // the moment the beat carried an officer past 1.5 m, the
        // return branch dragged him straight back. The beat was a
        // 1.5 m cage in EVERY round (that is why Gito saw statues),
        // and widening it to +/-18 m changed nothing. Now the return
        // branch only runs when the officer is FAR from post (a chase
        // just ended, > 19 m away — beyond the beat + margin), and
        // the patrol itself walks INCREMENTALLY (no absolute
        // post.z + pat teleport, which also jumped the officer).
        var dx = u.post.x - of.position.x, dz = u.post.z - of.position.z;
        if (Math.hypot(dx, dz) > 19) {
          chaseOnFoot(of, u.post.x, u.post.z, 3.0, dt);
          of.rotation.y = Math.atan2(u.post.x - of.position.x, u.post.z - of.position.z);
          u.walk += dt * 7;
          var sw2 = Math.sin(u.walk) * 0.4;
          u.legL.rotation.x = sw2; u.legR.rotation.x = -sw2;
          u.armL.rotation.x = -sw2; u.armR.rotation.x = sw2;
          of.position.y = groundY(of.position.x, of.position.z);
        } else {
          // Patrol: a REAL beat — +/-18 m along the sidewalk at
          // 2.2 m/s, a brisk walk that reads as patrolling from
          // across the street. pat is the LIVE offset (recomputed,
          // never teleported); x eases back onto the sidewalk line
          // if a chase left the officer offset sideways.
          u.pat = of.position.z - u.post.z;
          if (u.pat >= 18) u.patDir = -1;
          else if (u.pat <= -18) u.patDir = 1;
          of.position.z += dt * 2.2 * u.patDir;
          if (of.position.z > u.post.z + 18) of.position.z = u.post.z + 18;
          if (of.position.z < u.post.z - 18) of.position.z = u.post.z - 18;
          of.position.x += (u.post.x - of.position.x) * Math.min(1, dt * 2);
          of.position.y = groundY(of.position.x, of.position.z);
          of.rotation.y = u.patDir > 0 ? 0 : Math.PI;
          u.walk += dt * 7;
          var sw3 = Math.sin(u.walk) * 0.45;
          u.legL.rotation.x = sw3; u.legR.rotation.x = -sw3;
          u.armL.rotation.x = -sw3; u.armR.rotation.x = sw3;
        }
      }
    });
  })();
  // Round 24: cop muzzle flash + tracer live 0.12 sim-s per shot.
  if (copFlashT > 0) { copFlashT -= dt; if (copFlashT <= 0) { copFlash.visible = false; copTracer.visible = false; } }

  // Player: on foot vs driving — only while playing or in cover staging.
  var kmh = 0;
  if (playing || cover) {
    if (onFoot) {
      // Round 19: attack timers count down in sim time.
      if (attackT > 0) attackT -= dt;
      if (attackCd > 0) attackCd -= dt;
      // Round 18 — smooth on-foot movement: footSpeed eases toward the
      // target (5 m/s forward, 2.5 m/s back) instead of snapping to full
      // speed and dead-stopping, and the turn rate eases the same way.
      // walkPhase advances with SIGNED distance, so the leg swing
      // follows the feet — backward steps swing backward, no moonwalk.
      var mvT = 0, str = 0;
      if (keys.KeyW || keys.ArrowUp) mvT = 1;
      if (keys.KeyS || keys.ArrowDown) mvT = -0.5;
      if (keys.KeyA || keys.ArrowLeft) str = 1;
      if (keys.KeyD || keys.ArrowRight) str = -1;
      // Round 22: run — hold Shift (keyboard) or the run button (touch)
      // to sprint at 8.5 m/s forward; walking stays 5, reversing 2.5.
      // Round 25 (tambahan P0): faster start (20 up / 14 down) — walking
      // felt unresponsive because every stop forced a slow 0→5 m/s ramp;
      // stopping still eases down gradually, and a slightly slower turn
      // while sprinting so it does not twitch.
      var running = (keys.ShiftLeft || keys.ShiftRight) && mvT > 0;
      var targetSpeed = mvT * (running ? 8.5 : 5);
      var accel = Math.abs(targetSpeed) > Math.abs(footSpeed) ? 20 : 14;
      footSpeed += Math.max(-accel * dt, Math.min(accel * dt, targetSpeed - footSpeed));
      var turnTarget = str * (running ? 1.9 : 2.2);
      turnVel += Math.max(-6 * dt, Math.min(6 * dt, turnTarget - turnVel));
      heading += turnVel * dt;
      // Movement follows the facing direction (-sin h, -cos h), so
      // walking east/west no longer goes backwards against the facing.
      var ox = px, oz = pz;
      var step = footSpeed * dt;
      var mdx = -Math.sin(heading) * step;
      var mdz = -Math.cos(heading) * step;
      // Solid parked cars (round 18, tightened round 25): the player
      // coupe and the two parked cars on Avenue 1 are bodies now —
      // walking into one stops at its flank instead of passing
      // through. Only blocks ENTRY, so a player who spawns inside
      // (dismount) can always walk back out. Round 22: the inactive
      // coupe is listed too, so the car Gito is NOT driving stays
      // solid instead of walk-through. Round 25: the box is 4.8 x 2.4 m
      // (was 5.8 x 3.0 m — the old box stopped the player 1.5 m short
      // of the car's flank), and a blocked step SLIDES along the
      // obstacle instead of dying: try the full step, then X-only,
      // then Z-only, so a diagonal walk along a wall or a parked car
      // keeps moving instead of sticking.
      var carBoxed = function (x, z) {
        var inside = false;
        [[carX, carZ, carHeading], [player.position.x, player.position.z, player.rotation.y], [parked1.position.x, parked1.position.z, parked1.rotation.y], [parked2.position.x, parked2.position.z, parked2.rotation.y]].forEach(function (c) {
          var dx = x - c[0], dz = z - c[1];
          var lf = -dx * Math.sin(c[2]) - dz * Math.cos(c[2]);
          var ls = -dx * Math.cos(c[2]) + dz * Math.sin(c[2]);
          var dx0 = px - c[0], dz0 = pz - c[1];
          var lf0 = -dx0 * Math.sin(c[2]) - dz0 * Math.cos(c[2]);
          var ls0 = -dx0 * Math.cos(c[2]) + dz0 * Math.sin(c[2]);
          if (Math.abs(lf) < 2.4 && Math.abs(ls) < 1.2 && !(Math.abs(lf0) < 2.4 && Math.abs(ls0) < 1.2)) inside = true;
        });
        return inside;
      };
      var stepFree = function (x, z) { return walkable(x, z) && !carBoxed(x, z); };
      if (stepFree(px + mdx, pz + mdz)) { px += mdx; pz += mdz; }
      else if (stepFree(px + mdx, pz)) { px += mdx; }
      else if (stepFree(px, pz + mdz)) { pz += mdz; }
      else footSpeed = 0;
      // Round 24 (bug #2): a sprint steps FASTER, not just further —
      // 3.6 rad/m at a run vs 2.2 walking, so the cadence reads as
      // running even before the pose does.
      // Round 25: advance from the distance ACTUALLY travelled, so the
      // leg swing follows the feet while sliding along a wall or car
      // (a blocked axis contributes nothing); backward stays negative.
      var fwd = (px - ox) * (-Math.sin(heading)) + (pz - oz) * (-Math.cos(heading));
      walkPhase += fwd * (running ? 3.6 : 2.2);
      // Traffic hits the player on foot (round 18): a car no longer
      // passes through the body. On contact the player is knocked clear
      // of the car's path, takes damage through the normal armour/health
      // path, the car brakes hard, and the police notice.
      // Round 25 (bug #1): no hit at all during the spawn grace — and
      // never from the player's own car (an adopted car sits in this
      // list, so without the exclusion it would hit its own driver).
      if (playing && !cover && t > spawnSafeT) {
        var hitCar = null;
        traffic.concat(aveTraffic).concat(ave2Traffic).concat(ave3Traffic).concat(crossTraffic).concat(bikeTraffic).concat([taxi, police, police2, police3, police4, police5, police6]).forEach(function (o) {
          if (!hitCar && o !== carMesh && Math.hypot(o.position.x - px, o.position.z - pz) < 2.6) hitCar = o;
        });
        if (hitCar && sparkT <= 0) {
          // Round 22: a traffic hit knocks Gito clear, plays the thud,
          // brakes the car and draws the police — but it NEVER costs
          // health or armour anymore.
          // Round 26 (coordinator): a patrolling police car still
          // knocks Gito clear, but raises NO wanted — a cruiser
          // ghosting through the player with no reaction looked
          // broken; the brief only forbids raising wanted.
          sparkT = 0.5; panicT = 1.2; playThud();
          if (!policePatrolling(hitCar)) raiseWanted(1);
          var kdx = px - hitCar.position.x, kdz = pz - hitCar.position.z;
          var kl = Math.hypot(kdx, kdz) || 1;
          var kpx = px + (kdx / kl) * 1.6, kpz = pz + (kdz / kl) * 1.6;
          if (walkable(kpx, kpz)) { px = kpx; pz = kpz; }
          footSpeed = 0;
          hitCar.userData.brakeT = 0.8;
        }
      }
      pz = Math.max(-205, Math.min(205, pz));
      // Round 26 (item 6): jump physics — velocity + gravity while
      // airborne; jumpH rides on top of the ground height below.
      if (jumpH > 0 || jumpVy !== 0) {
        jumpVy -= 16 * dt;
        jumpH += jumpVy * dt;
        if (jumpH <= 0) { jumpH = 0; jumpVy = 0; }
      }
      gito.position.set(px, groundY(px, pz) + jumpH, pz);
      gito.rotation.y = heading + Math.PI;
      // A living idle, not a statue: one foot slightly forward, one knee
      // bent, arms hanging asymmetrically, head tilted a touch, soft
      // breathing. While walking, the plain walk cycle.
      var idle = Math.abs(footSpeed) < 0.1;
      // Round 24 (bug #2): a run must READ as a run — bigger leg swing
      // (0.95 rad, thigh to ~55 deg), arms pumping hard in opposite
      // phase, knees actually bending, elbows bent ~90 deg, body
      // leaning INTO the run, and a small bounce. Speed stays 8.5 m/s
      // exactly (verified Round 23); only the pose changes. Walking
      // keeps the old gentle cycle.
      var sprinting = running && Math.abs(footSpeed) > 5.5;
      var wpAmp = sprinting ? 0.95 : 0.5 * Math.min(1.2, 0.25 + Math.abs(footSpeed) / 4);
      var wp = Math.sin(walkPhase) * wpAmp;
      gito.userData.legL.rotation.x = idle ? -0.05 : wp; gito.userData.legR.rotation.x = idle ? 0.03 : -wp;
      var armSw = sprinting ? Math.sin(walkPhase) * 0.85 : wp;
      gito.userData.armL.rotation.x = idle ? -0.04 : -armSw; gito.userData.armR.rotation.x = idle ? 0.05 : armSw;
      // Round 24 (self-hunt): Gito's REAL knee is leg.children[2] and
      // his REAL elbow is arm.children[3]. The old code rotated
      // children[1]/[2] — lathe meshes (thigh skin, cuff) — so knees
      // never bent and elbows never pumped in ANY round; the run was
      // stiff legs + straight arms, i.e. a fast walk. The knee bends
      // most when its leg swings forward (sin negative for the left
      // leg, positive for the right).
      var kneeL = gito.userData.legL.children[2], kneeR = gito.userData.legR.children[2];
      var elbL = gito.userData.armL.children[3], elbR = gito.userData.armR.children[3];
      kneeL.rotation.x = idle ? 0 : (sprinting ? 0.75 * Math.max(0, -Math.sin(walkPhase)) : 0);
      kneeR.rotation.x = idle ? 0.08 : (sprinting ? 0.75 * Math.max(0, Math.sin(walkPhase)) : 0);
      elbL.rotation.x = sprinting ? -1.0 : -0.45; elbR.rotation.x = sprinting ? -1.0 : -0.45;
      if (sprinting) gito.position.y += Math.abs(Math.sin(walkPhase)) * 0.07;
      // Idle arms angle OUTWARD (0.30 rad) — pivot at the shoulder so
      // the sleeve top stays merged with the torso while the hands hang
      // clear of the hips/thighs. Riding/staging poses restore the
      // inward angle via stagePose.
      gito.userData.armL.rotation.z = -0.30; gito.userData.armR.rotation.z = 0.30;
      // Neutral on-foot pose — resets anything a riding pose set (bent
      // knees/elbows, head tilt, YXZ lean). The walk branch only
      // overwrites thighs/shoulders, so a seated pose would otherwise
      // stick after dismounting (elbows rest at their built -0.25 bend).
      // Round 24: a real forward lean at a sprint (YXZ order, so the
      // pitch leans forward instead of rolling sideways under yaw).
      // Positive rotation.x pitches the top of the body toward local
      // +z — the facing direction; the old -0.08 leaned BACKWARD, away
      // from the run, which is why the sprint looked upright/stiff.
      var runLean = Math.min(1, Math.max(0, (Math.abs(footSpeed) - 5.5) / 3));
      gito.rotation.order = runLean > 0 ? 'YXZ' : 'XYZ'; gito.rotation.x = runLean > 0 ? 0.22 * runLean : 0; gito.rotation.z = idle ? Math.sin(t * 1.2) * 0.012 : 0;
      gito.userData.head.rotation.x = 0; gito.userData.head.rotation.z = idle ? 0.03 : 0;
      // Lathe meshes only (thigh skin / cuff): reset any riding tilt.
      gito.userData.legL.children[1].rotation.x = 0; gito.userData.legR.children[1].rotation.x = 0;
      gito.userData.armL.children[2].rotation.x = 0; gito.userData.armR.children[2].rotation.x = 0;
      // Round 19: attack swing — the right arm punches forward (fist/bat)
      // or raises to aim (guns) while attackT runs down.
      if (attackT > 0) {
        var sw19 = Math.sin((0.25 - attackT) / 0.25 * Math.PI);
        if (WEAPON_DEFS[weapon].gun) { gito.userData.armR.rotation.x = -1.4; gito.userData.armL.rotation.x = -1.2; }
        else { gito.userData.armR.rotation.x = -1.9 * sw19; gito.userData.armL.rotation.x = -0.3; }
      }
      // "E Enter Vehicle" prompt + spinning arrow above the nearest
      // rideable vehicle.
      // Round 26 (item 8): the pill + arrow follow nearestRideable
      // (missions.js) — the same nearest pick tryEnter uses — so they
      // never point at a farther police car while a bike is closer.
      var nr = nearestRideable();
      var nearRide = nr ? { x: nr.x, z: nr.z } : null;
      // Round 29 (item 1): the MASUK pill must not invite a tap in
      // ?cover=1 staging — tryEnter ignores E there, so showing the
      // pill would promise an action that never happens. (The drive
      // branches already hide the pill in cover.)
      if (enterEl) { enterEl.style.display = (nearRide && !talking && !cover) ? 'block' : 'none'; if (nearRide && !talking && !cover) enterEl.textContent = 'MASUK'; }
      enterArrow.visible = !!nearRide && !cover;
      if (nearRide && !cover) { enterArrow.position.set(nearRide.x, 2.9 + Math.sin(t * 3) * 0.25, nearRide.z); enterArrow.rotation.y = t * 1.5; }
      // "Talk to NPC" prompt when close to the current mission giver.
      // Dialogue itself starts only on E (tryEnter) — walking up does not
      // auto-start it.
      var mTalk = curMission();
      if (playing && !cover && mTalk && missionStage === 'talk' && Math.hypot(mTalk.giverObj.position.x - px, mTalk.giverObj.position.z - pz) < 4.5) {
        if (talkEl) { document.getElementById('talkLabel').textContent = 'Talk to ' + mTalk.giver; talkEl.style.display = 'block'; }
      } else if (talkEl) talkEl.style.display = 'none';
    } else if (rideMode === 'boat' || rideMode === 'jetski') {
    // Water drive: WASD on the sea surface (y keeps bobbing), x 31..205,
    // z wraps. Shore clamp slides the boat along the beach instead of
    // dead-stopping it.
    if (keys.KeyW || keys.ArrowUp) rideSpeed += 12 * dt;
    if (keys.KeyS || keys.ArrowDown) rideSpeed -= 16 * dt;
    if (rideSpeed > 0 && !(keys.KeyW || keys.ArrowUp) && !cover) rideSpeed -= 6 * dt;
    if (rideSpeed < 0) rideSpeed = 0;
    var wMax = rideMode === 'jetski' ? 34 : 30;
    if (rideSpeed > wMax) rideSpeed = wMax;
    if (keys.KeyA || keys.ArrowLeft) steer = Math.min(steer + dt * 2, 0.6);
    else if (keys.KeyD || keys.ArrowRight) steer = Math.max(steer - dt * 2, -0.6);
    else steer *= (1 - dt * 4);
    // Turn follows the corrected movement formula (-sin h, -cos h) with
    // a tightened turn radius (~8 m at low speed, steadier when fast).
    rideHeading += steer * dt * (rideSpeed / (4 + Math.abs(rideSpeed) * 0.15));
    var nbx = rideObj.position.x - Math.sin(rideHeading) * rideSpeed * dt;
    var nbz = rideObj.position.z - Math.cos(rideHeading) * rideSpeed * dt;
    if (nbx < 31) nbx = 31; if (nbx > 205) nbx = 205;
    if (nbz > 205) nbz = -205; if (nbz < -205) nbz = 205;
    rideObj.position.x = nbx; rideObj.position.z = nbz;
    rideObj.rotation.y = rideHeading;
    px = nbx; pz = nbz; heading = rideHeading;
    // Gito rides VISIBLY — seated on the jetski, seated in the boat's
    // cockpit at the helm (same poses as the f* staging shots, now live
    // gameplay). Bobbing already ran this frame, so rideObj.position.y
    // includes it.
    if (rideMode === 'jetski') {
      stageSeat(rideObj, 0, 0.35, rideObj.position.y + 0.75, 0.35, { hip: -1.5, knee: 1.9, shoulder: -0.8, elbow: -0.4, head: 0.1 });
    } else {
      stageSeat(rideObj, 0.48, 0.35, rideObj.position.y + 0.71, 0.25, { hip: -1.5, knee: 1.7, shoulder: -0.75, elbow: -0.4, head: 0.1 });
    }
    kmh = Math.round(rideSpeed * 3.6);
    if (enterEl) { if (!cover) { enterEl.style.display = 'block'; enterEl.textContent = 'KELUAR'; } else enterEl.style.display = 'none'; }
    if (talkEl) talkEl.style.display = 'none';
  } else if (rideMode === 'bike') {
    // Bike drive: like the car but slower, on walkable ground (roads +
    // beach); leans into turns (rotation.z about the local forward axis).
    // Collision with traffic / police / bike traffic.
    if (keys.KeyW || keys.ArrowUp) rideSpeed += 12 * dt;
    if (keys.KeyS || keys.ArrowDown) rideSpeed -= 18 * dt;
    if (rideSpeed > 0 && !(keys.KeyW || keys.ArrowUp) && !cover) rideSpeed -= 8 * dt;
    if (rideSpeed < 0) rideSpeed = 0; if (rideSpeed > 26) rideSpeed = 26;
    if (keys.KeyA || keys.ArrowLeft) steer = Math.min(steer + dt * 2, 0.6);
    else if (keys.KeyD || keys.ArrowRight) steer = Math.max(steer - dt * 2, -0.6);
    else steer *= (1 - dt * 4);
    rideHeading += steer * dt * (rideSpeed / (4 + Math.abs(rideSpeed) * 0.15));
    var nkx = rideObj.position.x - Math.sin(rideHeading) * rideSpeed * dt;
    var nkz = rideObj.position.z - Math.cos(rideHeading) * rideSpeed * dt;
    if (nkz > 205) nkz = -205; if (nkz < -205) nkz = 205;
    // Round 27 (P3 21): same wall-slide as the car — a bike nose-first
    // into a building used to dead-stop with gas held.
    if (walkable(nkx, nkz)) { rideObj.position.x = nkx; rideObj.position.z = nkz; }
    else if (walkable(nkx, rideObj.position.z)) { rideObj.position.x = nkx; }
    else if (walkable(rideObj.position.x, nkz)) { rideObj.position.z = nkz; }
    else rideSpeed = 0;
    rideObj.rotation.y = rideHeading;
    // A turns left now, so the lean follows +steer. (Gito keeps -steer:
    // he faces +z locally, so his lean sign is the opposite of the
    // bike's — both tilt left together.)
    rideObj.rotation.z = steer * 0.3;
    px = rideObj.position.x; pz = rideObj.position.z; heading = rideHeading;
    // Gito rides VISIBLY — seated on the bike, leaning forward (same
    // pose as the fbike/fvespa staging shots, now live gameplay). The
    // bike's slight roll is not copied — Gito stays upright while the
    // bike leans up to ~0.18 rad, a known minor mismatch.
    if (rideObj.userData.type === 'vespa') stageSeat(rideObj, 0, 0.4, 0.80, 0.12, { hip: -1.3, knee: 1.3, shoulder: -0.6, elbow: -0.5, head: 0.1 });
    else stageSeat(rideObj, 0, 0.45, 1.01, 0.62, { hip: -1.30, knee: 1.20, shoulder: -1.0, elbow: -0.35, head: -0.2, spread: 0.08 });
    // The rider rolls WITH the bike (was upright while the bike leaned).
    gito.rotation.z = -steer * 0.3;
    kmh = Math.round(rideSpeed * 3.6);
    var hitB = false;
    traffic.concat([police, police2, police3, police4, police5, police6, taxi]).concat(bikeTraffic).forEach(function (o) {
      if (o !== carMesh && Math.hypot(o.position.x - px, o.position.z - pz) < 3.0) hitB = true;
    });
    if (hitB && sparkT <= 0 && t > spawnSafeT) { sparkT = 0.5; panicT = 1.2; raiseWanted(1); playThud(); }
    if (enterEl) { if (!cover) { enterEl.style.display = 'block'; enterEl.textContent = 'KELUAR'; } else enterEl.style.display = 'none'; }
    if (talkEl) talkEl.style.display = 'none';
  } else if (rideMode === 'heli') {
    // Round 27 (P3 20): heli flight — W/S throttle, A/D steer, no
    // walkable check (it flies over land and sea). Altitude eases 0 ->
    // 12 after boarding and holds there; the rotor spins up with speed.
    // Getting out drops Gito on the ground below (tryEnter) — no fall
    // damage in this game.
    if (keys.KeyW || keys.ArrowUp) rideSpeed += 14 * dt;
    if (keys.KeyS || keys.ArrowDown) rideSpeed -= 16 * dt;
    if (rideSpeed > 0 && !(keys.KeyW || keys.ArrowUp) && !cover) rideSpeed -= 6 * dt;
    if (rideSpeed < 0) rideSpeed = 0; if (rideSpeed > 30) rideSpeed = 30;
    if (keys.KeyA || keys.ArrowLeft) steer = Math.min(steer + dt * 2, 0.6);
    else if (keys.KeyD || keys.ArrowRight) steer = Math.max(steer - dt * 2, -0.6);
    else steer *= (1 - dt * 4);
    rideHeading += steer * dt * (rideSpeed / (4 + Math.abs(rideSpeed) * 0.15));
    var nhx = rideObj.position.x - Math.sin(rideHeading) * rideSpeed * dt;
    var nhz = rideObj.position.z - Math.cos(rideHeading) * rideSpeed * dt;
    if (nhx < -160) nhx = -160; if (nhx > 205) nhx = 205;
    if (nhz > 205) nhz = -205; if (nhz < -205) nhz = 205;
    heliAlt += (12 - heliAlt) * (1 - Math.exp(-1.2 * dt));
    rideObj.position.x = nhx; rideObj.position.z = nhz;
    rideObj.position.y = Math.max(0, groundY(nhx, nhz)) + 1.0 + heliAlt; // rest altitude: skids on the ground (see parkedHeli), not the body buried
    rideObj.rotation.y = rideHeading;
    if (rideObj.userData.rotor) rideObj.userData.rotor.rotation.y += dt * (8 + rideSpeed);
    if (rideObj.userData.tailRotor) rideObj.userData.tailRotor.rotation.x += dt * 30;
    px = nhx; pz = nhz; heading = rideHeading;
    gito.visible = true;
    stageSeat(rideObj, -0.5, 0.2, rideObj.position.y + 0.05, 0.1, { hip: -1.35, knee: 1.5, shoulder: -0.8, elbow: -0.4, head: 0, spread: 0.12 });
    kmh = Math.round(rideSpeed * 3.6);
    if (enterEl) { if (!cover) { enterEl.style.display = 'block'; enterEl.textContent = 'KELUAR'; } else enterEl.style.display = 'none'; }
    if (talkEl) talkEl.style.display = 'none';
  } else {
    // The car turns for real: movement follows the nose (-sin h,
    // -cos h), A turns left; the car may drive on any walkable surface
    // (roads + sidewalks + promenade + beach), still not into the sea;
    // S reverses (max 8 m/s, steering flips like a real car); the turn
    // radius is tightened (~8 m at low speed, steadier when fast); the
    // front wheels steer; the car follows the ground height.
    if (keys.KeyW || keys.ArrowUp) speed += 14 * dt;
    if (keys.KeyS || keys.ArrowDown) speed -= 20 * dt;
    if (speed > 0 && !(keys.KeyW || keys.ArrowUp) && !cover) speed -= 8 * dt;
    if (speed < 0 && !(keys.KeyS || keys.ArrowDown) && !cover) speed += 8 * dt;
    if (speed < -8) speed = -8; if (speed > 42) speed = 42;
    // Round 22: steering eases in faster when slow, slower when fast —
    // no twitch at speed, still nimble in a parking turn.
    var steerRate = 2.6 - Math.min(1.2, Math.abs(speed) * 0.03);
    if (keys.KeyA || keys.ArrowLeft) steer = Math.min(steer + dt * steerRate, 0.6);
    else if (keys.KeyD || keys.ArrowRight) steer = Math.max(steer - dt * steerRate, -0.6);
    else steer *= (1 - dt * 5);
    carHeading += steer * dt * (speed / (4 + Math.abs(speed) * 0.15));
    var ncx = carX - Math.sin(carHeading) * speed * dt;
    var ncz = carZ - Math.cos(carHeading) * speed * dt;
    if (ncz > 205) ncz = -205; if (ncz < -205) ncz = 205;
    // Round 27 (P3 21): wall-slide — the old code zeroed speed whenever
    // the nose touched anything non-walkable, so holding gas against a
    // building face or the sea edge left the car dead-stuck (gas held,
    // car not moving at all). Slide along the wall instead: full step,
    // else x-only, else z-only; speed only zeroes when fully boxed in.
    if (walkable(ncx, ncz)) { carX = ncx; carZ = ncz; }
    else if (walkable(ncx, carZ)) { carX = ncx; }
    else if (walkable(carX, ncz)) { carZ = ncz; }
    else speed = 0;
    px = carX; pz = carZ; heading = carHeading;
    carMesh.position.set(carX, groundY(carX, carZ), carZ);
    carMesh.rotation.y = carHeading;
    if (carMesh.userData.frontWheels) carMesh.userData.frontWheels.forEach(function (wg) { wg.rotation.y = steer * 0.5; });
    // Round 29 (item 2, Gito live 17:11 WIB): Gito drives INSIDE the car
    // now, not through the roof. The R26 seat (seatTopY 1.10) put his
    // head 0.38 m ABOVE the roof crown — from the side the car read as
    // empty with only a head piercing the roof. Seat top 0.46 puts his
    // head centre ~1.30, inside the side-window band (sport glass
    // 1.02-1.34, sedan cabin 0.88-1.36): he shows through the (now
    // transparent) glass from the side, and the high chase camera still
    // catches the top of his head over the roof — no clipping anywhere.
    // Round 29 (item 2, foot tuck): the REAL knees are leg.children[2] —
    // stageSeat's knee value turns children[1] (thigh skin), so it never
    // moved the shins. The seat is low (hips y 0.47) while thigh+shin is
    // 0.94 long, so a hanging shin puts the soles at y -0.09, clipping
    // the ground under the sill, and straight legs still leave the heel
    // at 0.13. A deep fold (knee 3.4) tucks the feet under the seat —
    // lowest point y 0.35, inside the body (sill bottom 0.32). Legs are
    // inside the slab either way; only torso/head/arms ever show. The
    // on-foot branch overwrites children[2] every frame, so this never
    // sticks after dismounting.
    gito.visible = true;
    stageSeat(carMesh, -0.5, 0.35, carMesh.position.y + 0.46, 0.15, { hip: -1.5, knee: -0.6, shoulder: -0.9, elbow: -0.5, head: 0, spread: 0.12 });
    gito.userData.legL.children[2].rotation.x = 3.4;
    gito.userData.legR.children[2].rotation.x = 3.4;
    kmh = Math.round(speed * 3.6);
    if (kmh > 130) raiseWanted(1); // speeding draws the police
    // Collision with traffic / police (bike traffic included).
    // Round 25 (bug #4): never the car Gito is driving himself.
    var hit = false;
    traffic.concat([police, police2, police3, police4, police5, police6, taxi]).concat(bikeTraffic).forEach(function (o) {
      if (o !== carMesh && Math.hypot(o.position.x - carX, o.position.z - carZ) < 3.4) hit = true;
    });
    // Round 22: a crash dents the CAR (condition falls) and draws the
    // police — it never costs Gito health or armour.
    if (hit && sparkT <= 0) { sparkT = 0.5; panicT = 1.2; raiseWanted(2); carCond = Math.max(40, carCond - 3); playThud(); }
    if (enterEl) { if (!cover) { enterEl.style.display = 'block'; enterEl.textContent = 'KELUAR'; } else enterEl.style.display = 'none'; }
    if (talkEl) talkEl.style.display = 'none';
  }

    // Mission progress + destination beacon (not in cover renders).
    if (playing && !cover && !talking) {
      var cm = curMission();
      if (cm) {
        if (missionStage === 'do' && cm.check === 'car' && !onFoot && rideMode === 'car') completeMission();
        // Round 27 (A): a check can demand a vehicle — 'heli' / 'boat' /
        // 'car' — so the Island Tour must be flown and the Harbor Run
        // sailed; walking to the spot does not count.
        else if (missionStage === 'do' && cm.check && cm.check.x !== undefined && (!cm.check.vehicle || rideMode === cm.check.vehicle) && Math.hypot(cm.check.x - px, cm.check.z - pz) < cm.check.r) completeMission();
      }
    }
    var cmB = curMission();
    if (playing && !cover && cmB && missionStage === 'talk') {
      // Round 25 (bug #3): the giver gets the gold beam too — Luna
      // stands 74 m from the spawn and the only pointer was a minimap
      // dot, so Mission 1 read as stuck at Stage 1/2.
      beacon.visible = true; beacon.position.set(cmB.giverObj.position.x, 0, cmB.giverObj.position.z);
    } else if (playing && !cover && cmB && missionStage === 'do' && cmB.check && cmB.check.x !== undefined) {
      beacon.visible = true; beacon.position.set(cmB.check.x, 0, cmB.check.z);
    } else beacon.visible = false;
    if (playing && !cover && wantedT > 0) { wantedT -= dt; if (wantedT <= 0) wanted = 0; }
    // Health regens slowly once the heat is off and no recent hit.
    // Round 26 (item 4): never regen while BUSTED — a dead player
    // must stay dead until respawn, not climb back from 0.
    if (playing && !cover && !busted && wanted === 0 && t - lastHitT > 5 && health < 100) health = Math.min(100, health + dt * 2);
    // Round 26 (item 4): health 0 means BUSTED — freeze the sim and
    // show the game-over overlay (hud.js). Runs the same frame the
    // killing shot lands; damagePlayer is the only health drain.
    if (playing && !cover && health <= 0 && !busted) { busted = true; showBusted(); }
    if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0 && bannerEl) bannerEl.style.display = 'none'; }
    if (objectiveEl) objectiveEl.style.display = cover ? 'none' : 'block';
    if (sparkT > 0) {
      sparkT -= dt;
      spark.visible = true;
      spark.position.set(px, 1, pz - 2.5);
      spark.rotation.y = t * 5; spark.material.opacity = Math.max(0, sparkT * 1.8);
    } else spark.visible = false;
    // Parked car always sits where Gito left it (follows ground height too).
    // Round 22: this is the ACTIVE car (carMesh) — the coupe or an
    // adopted parked car; the inactive cars keep their own spots.
    carMesh.position.set(carX, groundY(carX, carZ), carZ);
    carMesh.rotation.y = carHeading;
    // Nearby peds panic when the car is close.
    // Round 29 (item 4): the old panic pose pinned both arms at -2
    // (raised forward-up) while the car was near — the same stiff
    // horizontal-arms read as the flee pose. The ped sidesteps away
    // from the car; its arms pump like a run instead, using its live
    // walk phase, so no frozen raised arms ever show here either.
    peds.forEach(function (pd) {
      var dd = Math.hypot(pd.position.x - px, pd.position.z - pz);
      if (!onFoot && dd < 6 && !(pd.userData.fleeT > 0)) {
        pd.position.x += (pd.position.x > px ? 1 : -1) * dt * 3;
        var psw = Math.sin(pd.userData.walk || 0) * 0.8;
        pd.userData.armL.rotation.x = -psw; pd.userData.armR.rotation.x = psw;
      }
    });
    if (panicT > 0) panicT -= dt;
    // HUD: speedometer, minimap, mission panel, stars, car info, radio.
    drawGauge(kmh);
    if (gaugeBoxEl) gaugeBoxEl.style.display = onFoot ? 'none' : 'block';
    // Round 22: the aim circle shows only while holding a gun on foot —
    // fists and the bat get no crosshair, and never while driving.
    if (reticleEl) reticleEl.style.display = (onFoot && playing && !cover && !talking && WEAPON_DEFS[weapon].gun) ? 'block' : 'none';
    drawMap();
    updateHudExtra();
    if (spdNum) spdNum.textContent = kmh;
    updateAudio(kmh, wanted);
  } else {
    // Round 25 (bug #7): the menu had no sound at all because
    // updateAudio only ran while playing — the ambient track was
    // created on the first gesture but its gain was never raised.
    updateAudio(0, wanted);
  }

  // The enter arrow bobs and scales with distance; its glow scales with
  // the bounce so it reads as a pulse, not a wobble.
  if (enterArrow.visible) {
    enterArrow.position.y = 2.8 + Math.sin(t * 3) * 0.15;
    var sd = Math.hypot(enterArrow.position.x - px, enterArrow.position.z - pz);
    var arSc = Math.max(0.8, Math.min(1.5, sd / 6));
    enterArrow.scale.set(arSc, arSc * (1 + Math.sin(t * 3) * 0.08), arSc);
  }
  // ---- Camera director ----
  // Positions the camera for the current screen / cover spot, then
  // re-scales the enter arrow by camera distance (overriding the
  // player-distance scale above) so it never fills the frame up close.
  directCamera(dt);
  if (showFps) { window.__fps = Math.round(1 / Math.max(dt, 0.001)); }
  renderer.render(scene, cam);
}

// Camera director: one camera position per screen and cover spot, in the
// same priority order as the old game. Cover branches also stage the
// rider pose (stageSeat) and hide nearby NPCs so the frame stays clean.
function directCamera(dt) {
  // Round 28 (item 2, ?cover=1 Gito hilang): the staged cameras were
  // framed for a landscape screen. On a portrait phone (aspect ~0.46)
  // the horizontal field is ~4x narrower, so the dialogue camera put
  // Gito at NDC x=1.77 — clean off the right edge, invisible — while
  // the menu and cover frames sat on the edge too. Pull the staged
  // camera back in proportion to the narrowness, so the subject stays
  // in frame at any aspect. Landscape (aspect >= 1) is untouched.
  var camAsp = cam.aspect || 1;
  var zoomOut = camAsp < 1 ? Math.min(2.6, 1.15 / camAsp) : 1;
  if (screen === 'splash') {
    cam.position.copy(splashCamPos); cam.lookAt(splashCamLook);
  } else if (screen === 'menu') {
    // Video menu: Gito + Luna close together in 3/4 profile, tower + sea
    // behind (beachgoers/chatters standing right next to the pair are
    // hidden — the video shows only the two).
    gito.position.set(20, groundY(20, -70), -70); gito.rotation.y = -Math.PI / 4;
    woman.position.set(21.3, groundY(21.3, -70.3), -70.3); woman.rotation.y = -Math.PI / 4;
    beachgoers.forEach(function (b) { if (Math.hypot(b.position.x - 21, b.position.z + 70) < 8) b.visible = false; });
    chatters.forEach(function (b) { if (Math.hypot(b.position.x - 21, b.position.z + 70) < 8) b.visible = false; });
    cam.position.set(21.5 - 6 * zoomOut, 1.7 + 0.7 * zoomOut, -70 + 5.5 * zoomOut); cam.lookAt(21.5, 1.7, -70);
  } else if (screen === 'dialogue') {
    // Video frame 2: Gito from BEHIND, BIG in frame, facing the sea +
    // lifeguard tower (shifted right so the wider 65% dialogue box
    // clears him).
    gito.position.set(16.8, groundY(16.8, -84), -84); gito.rotation.y = Math.PI / 2;
    cam.position.set(15.7 - 2.1 * zoomOut, 1.8 + 0.45 * zoomOut, -85 + 1.3 * zoomOut); cam.lookAt(15.7, 1.8, -85);
  } else if (cover && screen === 'game' && !qs.get('spot')) {
    // Video frame 4: side view — Gito at the driver's door, full yellow
    // coupe beside him (walking peds near the car are hidden — the video
    // shows Gito alone at the car).
    peds.forEach(function (b) { if (Math.hypot(b.position.x - 11, b.position.z + 54) < 7) b.visible = false; });
    beachgoers.forEach(function (b) { if (Math.hypot(b.position.x - 11, b.position.z + 54) < 7) b.visible = false; });
    chatters.forEach(function (b) { if (Math.hypot(b.position.x - 11, b.position.z + 54) < 7) b.visible = false; });
    cam.position.set(12.5, 1.0 + 0.6 * zoomOut, -55.5 + 7 * zoomOut); cam.lookAt(12.5, 1.0, -55.5);
  } else if (cover && screen === 'game' && qs.get('spot') === 'boats') {
    // Sea view — motorboats + jetskis along the beach, from above the umbrellas.
    cam.position.set(24, 8, 52); cam.lookAt(50, 0, 5);
  } else if (cover && screen === 'game' && qs.get('spot') === 'bikes') {
    // Parked bike next to the player coupe, pulled back so both frame.
    cam.position.set(13, 3, 22); cam.lookAt(1, 0.8, 10);
  } else if (cover && screen === 'game' && qs.get('spot') === 'vespa') {
    // Vespa parked by the shops, closer.
    cam.position.set(-11, 2.0, -15); cam.lookAt(-14, 0.6, -20);
  } else if (cover && screen === 'game' && qs.get('spot') === 'heli') {
    // Tour heli circling over the beach, higher + further south, clear of
    // the beach palms.
    cam.position.set(20, 12, -12); cam.lookAt(36, 27, 21);
  } else if (cover && screen === 'game' && qs.get('spot') === 'wide') {
    // Wide coastal view from above the sea.
    cam.position.set(62, 20, 85); cam.lookAt(10, 0, -10);
  } else if (cover && screen === 'game' && qs.get('spot') === 'fjetski') {
    // Gito SEATED on the CYAN jetski — staging pose only, no ride logic.
    // Seat top = jetski y + 0.75 (saddle top 0.65 + 0.10 float for folded legs).
    var jk0 = jetskis[0], jh0 = jk0.rotation.y;
    stageSeat(jk0, 0, 0.35, jk0.position.y + 0.75, 0.35, { hip: -1.5, knee: 1.9, shoulder: -0.8, elbow: -0.4, head: 0.1 });
    if (enterEl) enterEl.style.display = 'none'; // clean frame, no E pill
    var jbx = -Math.sin(jh0), jbz = -Math.cos(jh0), jsx = Math.cos(jh0), jsz = -Math.sin(jh0);
    cam.position.set(jk0.position.x + jbx * 3.2 + jsx * 3.0, 1.7, jk0.position.z + jbz * 3.2 + jsz * 3.0);
    cam.lookAt(jk0.position.x, 0.7, jk0.position.z);
  } else if (cover && screen === 'game' && qs.get('spot') === 'fbike') {
    // Gito SEATED on the red sport bike — staging pose only. Seat top y =
    // 1.05, sat forward (local z 0.45), deep lean 0.62 so the hands reach
    // the clip-ons. 3/4 FRONT: fairing + fork + tank + forward lean read
    // as a sport bike from here.
    var bk0 = bikes[0], bh0 = bk0.rotation.y;
    stageSeat(bk0, 0, 0.45, 1.05, 0.62, { hip: -1.30, knee: 1.20, shoulder: -1.0, elbow: -0.35, head: -0.2, spread: 0.08 });
    if (enterEl) enterEl.style.display = 'none'; // clean frame, no E pill
    var bsx = Math.cos(bh0), bsz = -Math.sin(bh0);
    var bfx = -Math.sin(bh0), bfz = -Math.cos(bh0);
    cam.position.set(bk0.position.x + bfx * 3.5 + bsx * 3.5, 1.9, bk0.position.z + bfz * 3.5 + bsz * 3.5);
    cam.lookAt(bk0.position.x, 1.0, bk0.position.z);
  } else if (cover && screen === 'game' && qs.get('spot') === 'fvespa') {
    // Gito SEATED on the mint Vespa, FRONT 3/4. Seat top y = 0.845 (seat
    // box centre 0.72 + 0.045) + 0.08 float so shoes clear the floorboard.
    var vs0 = bikes[1], vh0 = vs0.rotation.y;
    stageSeat(vs0, 0, 0.4, 0.845, 0.12, { hip: -1.3, knee: 1.3, shoulder: -0.6, elbow: -0.5, head: 0.1 });
    if (enterEl) enterEl.style.display = 'none'; // clean frame, no E pill
    var vbx = -Math.sin(vh0), vbz = -Math.cos(vh0), vsx = Math.cos(vh0), vsz = -Math.sin(vh0);
    cam.position.set(vs0.position.x + vbx * 3.5 + vsx * 2.5, 1.8, vs0.position.z + vbz * 3.5 + vsz * 2.5);
    cam.lookAt(vs0.position.x, 0.9, vs0.position.z);
    peds.forEach(function (b) { if (Math.hypot(b.position.x + 14, b.position.z + 20) < 7) b.visible = false; });
  } else if (cover && screen === 'game' && qs.get('spot') === 'sbike') {
    // PURE SIDE of the parked red sport bike, NO rider — silhouette check.
    var sb0 = bikes[0], sh0 = sb0.rotation.y;
    gito.visible = false;
    if (enterEl) enterEl.style.display = 'none'; // clean frame, no E pill
    cam.position.set(sb0.position.x + Math.cos(sh0) * 4.0, 1.2, sb0.position.z - Math.sin(sh0) * 4.0);
    cam.lookAt(sb0.position.x, 0.7, sb0.position.z);
    peds.forEach(function (b) { if (Math.hypot(b.position.x - 6, b.position.z - 12) < 7) b.visible = false; });
  } else if (cover && screen === 'game' && qs.get('spot') === 'svespa') {
    // PURE SIDE of the parked mint Vespa, NO rider.
    var sv0 = bikes[1], svh0 = sv0.rotation.y;
    gito.visible = false;
    if (enterEl) enterEl.style.display = 'none'; // clean frame, no E pill
    cam.position.set(sv0.position.x + Math.cos(svh0) * 4.0, 1.1, sv0.position.z - Math.sin(svh0) * 4.0);
    cam.lookAt(sv0.position.x, 0.65, sv0.position.z);
    peds.forEach(function (b) { if (Math.hypot(b.position.x + 12, b.position.z + 20) < 7) b.visible = false; });
  } else if (cover && screen === 'game' && qs.get('spot') === 'rvespa') {
    // Round 28 (P2 14): REAR 3/4 of the parked mint Vespa, NO rider —
    // tail housing, red lens, plate, indicators, grab rail + rack read
    // only from behind. Same math as the front 3/4, mirrored to the rear.
    var rv0 = bikes[1], rvh0 = rv0.rotation.y;
    gito.visible = false;
    if (enterEl) enterEl.style.display = 'none'; // clean frame, no E pill
    var rfx = -Math.sin(rvh0), rfz = -Math.cos(rvh0), rsx = Math.cos(rvh0), rsz = -Math.sin(rvh0);
    cam.position.set(rv0.position.x - rfx * 3.2 + rsx * 1.0, 1.5, rv0.position.z - rfz * 3.2 + rsz * 1.0);
    cam.lookAt(rv0.position.x, 0.7, rv0.position.z);
    peds.forEach(function (b) { if (Math.hypot(b.position.x + 12, b.position.z + 20) < 7) b.visible = false; });
  } else if (cover && screen === 'game' && qs.get('spot') === 'heli-door') {
    // Round 28 (P2 18): CLOSE-UP of the parked tour heli's side — door
    // + door window + handle + rear side window fill the frame, so the
    // cabin reads as a helicopter cabin, not a smooth egg. Parked heli
    // (24,165), staged every frame like the chase spot stages police.
    // Camera BELOW the rotor disc (disc y 1.2, blades span 7.6 m) at
    // 7.5 m out — the first take at 4.5 m / y 1.7 put a rotor blade
    // across the whole frame. Nearby peds hidden so none blocks the door.
    gito.visible = false;
    if (enterEl) enterEl.style.display = 'none'; // clean frame, no E pill
    var hd = parkedHeli, hdh = hd.rotation.y;
    var hsx = Math.cos(hdh), hsz = -Math.sin(hdh);
    cam.position.set(hd.position.x + hsx * 6.5, 1.6, hd.position.z + hsz * 6.5);
    cam.lookAt(hd.position.x, 1.1, hd.position.z);
    peds.forEach(function (b) { if (Math.hypot(b.position.x - 24, b.position.z - 165) < 8) b.visible = false; });
    beachgoers.forEach(function (b) { if (Math.hypot(b.position.x - 24, b.position.z - 165) < 8) b.visible = false; });
    chatters.forEach(function (b) { if (Math.hypot(b.position.x - 24, b.position.z - 165) < 8) b.visible = false; });
  } else if (cover && screen === 'game' && qs.get('spot') === 'rjet2') {
    // Round 28 (P2 17): REAR 3/4 of the cyan jetski, NO rider — deck
    // mat, red tail strip, exhaust + side vents on the back. Mirrors
    // the front staging to the rear.
    var rj0 = jetskis[0], rjh0 = rj0.rotation.y;
    gito.visible = false;
    if (enterEl) enterEl.style.display = 'none'; // clean frame, no E pill
    var jfx = -Math.sin(rjh0), jfz = -Math.cos(rjh0), jsx2 = Math.cos(rjh0), jsz2 = -Math.sin(rjh0);
    cam.position.set(rj0.position.x - jfx * 3.2 + jsx2 * 2.0, 1.6, rj0.position.z - jfz * 3.2 + jsz2 * 2.0);
    cam.lookAt(rj0.position.x, 0.6, rj0.position.z);
  } else if (cover && screen === 'game' && qs.get('spot') === 'police-side') {
    // Round 28 (P2 19): PURE SIDE of a police cruiser, NO rider — light
    // bar, doors, badge, wheels in one frame. The lead cruiser is
    // re-staged west of the player coupe every frame (chase-spot
    // pattern), so the coupe never crowds the shot.
    gito.visible = false;
    if (enterEl) enterEl.style.display = 'none'; // clean frame, no E pill
    police.position.set(-8, 0, -40); police.rotation.y = 0;
    cam.position.set(-2.5, 1.5, -40); cam.lookAt(-8, 0.8, -40);
    peds.forEach(function (b) { if (Math.hypot(b.position.x + 8, b.position.z + 40) < 7) b.visible = false; });
  } else if (cover && screen === 'game' && qs.get('spot') === 'carside') {
    // PURE SIDE of the player coupe, NO character — silhouette check.
    gito.visible = false;
    if (enterEl) enterEl.style.display = 'none'; // clean frame, no E pill
    cam.position.set(7, 1.4, 10); cam.lookAt(0, 0.9, 10);
    peds.forEach(function (b) { if (Math.hypot(b.position.x - 0, b.position.z - 10) < 7) b.visible = false; });
  } else if (cover && screen === 'game' && qs.get('spot') === 'carfront') {
    // FRONT 3/4 of the player coupe — nose, lights, grille.
    gito.visible = false;
    if (enterEl) enterEl.style.display = 'none'; // clean frame, no E pill
    cam.position.set(5, 1.8, 2); cam.lookAt(0, 0.9, 9);
    peds.forEach(function (b) { if (Math.hypot(b.position.x - 0, b.position.z - 10) < 7) b.visible = false; });
  } else if (cover && screen === 'game' && qs.get('spot') === 'fboat') {
    // PURE SIDE view — the lofted deep-V profile, sweeping sheer +
    // pointed bow read only from a true side angle. Gito SEATED at the
    // starboard helm — staging pose only.
    var mb1 = motorboats[1], mh1 = mb1.rotation.y;
    stageSeat(mb1, 0.48, 0.35, mb1.position.y + 0.71, 0.25, { hip: -1.5, knee: 1.7, shoulder: -0.75, elbow: -0.4, head: 0.1 });
    if (enterEl) enterEl.style.display = 'none'; // clean frame, no E pill
    var msx = Math.cos(mh1), msz = -Math.sin(mh1);
    cam.position.set(mb1.position.x + msx * 7.0, 1.8, mb1.position.z + msz * 7.0);
    cam.lookAt(mb1.position.x, 0.6, mb1.position.z);
  } else if (cover && screen === 'game' && qs.get('spot') === 'fboat34') {
    // FRONT 3/4 — plan taper + bow point + cockpit + helm from here.
    var mb1b = motorboats[1], mh1b = mb1b.rotation.y;
    stageSeat(mb1b, 0.48, 0.35, mb1b.position.y + 0.71, 0.25, { hip: -1.5, knee: 1.7, shoulder: -0.75, elbow: -0.4, head: 0.1 });
    if (enterEl) enterEl.style.display = 'none'; // clean frame, no E pill
    var msxb = Math.cos(mh1b), mszb = -Math.sin(mh1b);
    var mfx = -Math.sin(mh1b), mfz = -Math.cos(mh1b);
    cam.position.set(mb1b.position.x + msxb * 6.5 + mfx * 4.0, 2.6, mb1b.position.z + mszb * 6.5 + mfz * 4.0);
    cam.lookAt(mb1b.position.x, 0.8, mb1b.position.z);
  } else if (cover && screen === 'game' && qs.get('spot') === 'fheli') {
    // Tour heli, close tracking shot (no pose — rider is inside, unseen).
    cam.position.set(tourHeli.position.x - 9, tourHeli.position.y - 2.5, tourHeli.position.z + 11);
    cam.lookAt(tourHeli.position.x, tourHeli.position.y, tourHeli.position.z);
  } else if (cover && screen === 'game' && qs.get('spot') === 'fchar') {
    // Gito FRONT close-up — face + proportions judged against a real human.
    // Gito faces the camera (+z); nearby peds hidden so the frame is clean.
    gito.position.set(11.5, groundY(11.5, -60), -60); gito.rotation.y = 0;
    peds.forEach(function (b) { if (Math.hypot(b.position.x - 11.5, b.position.z + 60) < 6) b.visible = false; });
    beachgoers.forEach(function (b) { if (Math.hypot(b.position.x - 11.5, b.position.z + 60) < 6) b.visible = false; });
    chatters.forEach(function (b) { if (Math.hypot(b.position.x - 11.5, b.position.z + 60) < 6) b.visible = false; });
    beachBalls.forEach(function (b) { if (Math.hypot(b.position.x - 11.5, b.position.z + 60) < 15) b.visible = false; });
    cam.position.set(11.5, 1.35, -56.2); cam.lookAt(11.5, 0.95, -60); // 3.8 m back, aimed mid-body — whole body incl. shoes in frame
    if (enterEl) enterEl.style.display = 'none'; // clean frame, no E pill
  } else if (cover && screen === 'game' && qs.get('spot') === 'fchar-side') {
    // Gito SIDE profile — head size, torso taper, arm hang, leg length.
    // Gito keeps facing +z (rotation.y = 0); the camera moves EAST to his side.
    gito.position.set(11.5, groundY(11.5, -60), -60); gito.rotation.y = 0;
    peds.forEach(function (b) { if (Math.hypot(b.position.x - 11.5, b.position.z + 60) < 6) b.visible = false; });
    beachgoers.forEach(function (b) { if (Math.hypot(b.position.x - 11.5, b.position.z + 60) < 6) b.visible = false; });
    chatters.forEach(function (b) { if (Math.hypot(b.position.x - 11.5, b.position.z + 60) < 6) b.visible = false; });
    beachBalls.forEach(function (b) { if (Math.hypot(b.position.x - 11.5, b.position.z + 60) < 15) b.visible = false; });
    cam.position.set(15.1, 2.2, -60); cam.lookAt(11.5, 0.9, -60); // camera up at 2.2 — the beach railing cut the body mid-frame lower down
    if (enterEl) enterEl.style.display = 'none';
  } else if (cover && screen === 'game' && qs.get('spot') === 'fchar-luna') {
    // Luna FRONT close-up — face + arms judged against a real human.
    // Luna faces -z (rotation.y = PI), so the camera sits on the -z side.
    woman.position.set(22.5, groundY(22.5, -57.5), -57.5); woman.rotation.y = Math.PI;
    peds.forEach(function (b) { if (Math.hypot(b.position.x - 22.5, b.position.z + 57.5) < 6) b.visible = false; });
    beachgoers.forEach(function (b) { if (Math.hypot(b.position.x - 22.5, b.position.z + 57.5) < 6) b.visible = false; });
    chatters.forEach(function (b) { if (Math.hypot(b.position.x - 22.5, b.position.z + 57.5) < 6) b.visible = false; });
    beachBalls.forEach(function (b) { if (Math.hypot(b.position.x - 22.5, b.position.z + 57.5) < 15) b.visible = false; });
    if (volleyNet) volleyNet.visible = false; // the net read as a white wall behind Luna
    cam.position.set(22.5, 1.35, -61.3); cam.lookAt(22.5, 0.95, -57.5); // back + mid-body aim, shoes in frame
    if (enterEl) enterEl.style.display = 'none';
  } else if (cover && screen === 'game' && qs.get('spot') === 'fped') {
    // NPC CLOSE-UP — a pedestrian's hands + feet checked up close.
    var pd0 = peds[3];
    cam.position.set(pd0.position.x + 0.5, 1.25, pd0.position.z + 3.2); cam.lookAt(pd0.position.x, 0.9, pd0.position.z);
    if (enterEl) enterEl.style.display = 'none';
  } else if (cover && screen === 'game' && qs.get('spot') === 'signs-house') {
    // 'my house' sign on Gito's pink house, close and centred.
    cam.position.set(-75, 2.5, -88); cam.lookAt(-75, 3.0, -105);
  } else if (cover && screen === 'game' && qs.get('spot') === 'signs-promenade') {
    // Beach view due west (low, over the sea) — bar Akari foreground +
    // CORAL APARTMENTS + OCEAN TOWER + TROPICAL CLUB.
    cam.position.set(60, 8, 120); cam.lookAt(-60, 20, 120);
  } else if (cover && screen === 'game' && qs.get('spot') === 'signs-harbor') {
    // PORT WAREHOUSE from the south.
    cam.position.set(-80, 6, -155); cam.lookAt(-88, 5.5, -185);
  } else if (cover && screen === 'game' && qs.get('spot') === 'signs-club') {
    // TROPICAL CLUB east face, close-up from Ave 2.
    cam.position.set(-66, 5, 118); cam.lookAt(-79, 5.5, 125);
  } else if (cover && screen === 'game' && qs.get('spot') === 'signs-bar') {
    // 'bar Akari' close-up from the beach north of the bar (its sign faces north).
    cam.position.set(24, 3, 102); cam.lookAt(24, 2.2, 120);
  } else if (cover && screen === 'game' && qs.get('spot') === 'signs-towers') {
    // North towers from the promenade — SUNSET HOTEL + PALM MALL.
    cam.position.set(25, 10, 30); cam.lookAt(-60, 28, -40);
  } else if (cover && screen === 'game' && qs.get('spot') === 'rboat') {
    // Gito wading next to the orange motorboat — "E Enter Vehicle" prompt.
    cam.position.set(30, 2.2, 38); cam.lookAt(38, 0.6, 30);
  } else if (cover && screen === 'game' && qs.get('spot') === 'rbike') {
    // Gito next to the red sport bike — "E Enter Vehicle" prompt.
    cam.position.set(0, 2.0, 20); cam.lookAt(6, 0.8, 12);
  } else if (cover && screen === 'game' && qs.get('spot') === 'rjet') {
    // Gito wading next to the cyan jetski — "E Enter Vehicle" prompt.
    cam.position.set(30, 2.2, 18); cam.lookAt(36, 0.5, 10);
  } else if (cover && screen === 'game' && qs.get('spot') === 'rtraffic') {
    // Bike traffic close-up — camera tracks the green coast-road sport bike.
    var bt = bikeTraffic[0];
    cam.position.set(bt.position.x + 7, 2.2, bt.position.z + 9); cam.lookAt(bt.position.x, 0.9, bt.position.z);
  } else if (cover && screen === 'game' && qs.get('spot') === 'carrear') {
    // Player coupe from behind — camera WEST (rear faces west). Shifted
    // north so the white beach building stays out of frame; Gito is parked
    // far away so the E pill does not cover the plate.
    cam.position.set(5.5, 1.8, -60); cam.lookAt(12.5, 0.7, -55.5);
  } else if (cover && screen === 'game' && qs.get('spot') === 'bikesmany') {
    // Closer + higher, aimed at the promenade cluster so several bikes
    // read big in frame. Two more bikes pulled into a tight cluster near
    // (6,12) for the photo only (cover staging — gameplay positions
    // untouched): pink Vespa + green sport, three bikes in one frame.
    bikes[5].position.set(1, 0, 6); bikes[5].rotation.y = 0.6;
    bikes[11].position.set(-5, 0, 14); bikes[11].rotation.y = -0.3;
    cam.position.set(8, 3.5, 30); cam.lookAt(0.7, 0.8, 10.7);
  } else if (cover && screen === 'game' && qs.get('spot') === 'bikestraffic') {
    // Elevated view down the coast road + Ave 1 — several traffic bikes.
    cam.position.set(30, 18, 90); cam.lookAt(-25, 0, -10);
  } else if (cover && screen === 'game' && qs.get('spot') === 'chase') {
    // Sunset chase hero — third-person behind the player coupe, police
    // flanking right behind, heli above. Heading-aware: behind is
    // (+sin h, +cos h), ahead is (-sin h, -cos h). Low and close (7.5 m /
    // 3.2 high) so the hero car dominates the lower-centre frame like the
    // top-3 shots, rear face (lights, plate, bumper) dominant, not the roof.
    var chx = Math.sin(heading), chz = Math.cos(heading);
    cam.position.set(px + chx * 7.5 + 1.0, 3.2, pz + chz * 7.5);
    cam.lookAt(px - chx * 12, 1.4, pz - chz * 12);
  } else if (cover && screen === 'game' && qs.get('spot') === 'sunset') {
    // Golden-hour drive south toward the low sun over the sea.
    var shx = Math.sin(heading), shz = Math.cos(heading);
    cam.position.set(px + shx * 7.5 + 1.0, 2.7, pz + shz * 7.5);
    cam.lookAt(px - shx * 12, 1.2, pz - shz * 12);
  } else {
    // Default follow camera: the enter arrow is an on-foot prompt — hide
    // it while riding, or its frozen mount-point position floats in front
    // of the follow camera and blocks the rider.
    if (!onFoot) enterArrow.visible = false;
    // Round 22: closer + lower than round 21 (top-3 chase framing — the
    // car reads ~30% of the frame, rear face dominant) and the follow
    // heading itself eases (camHead), so turning swings the camera
    // smoothly instead of whipping the view. The lateral offset is
    // heading-relative now, so it stays over the same shoulder when
    // Gito turns around instead of swinging to the other side.
    // Round 26 (item 11): the drive camera sat 2.8 m high / 5.6 m back,
    // glued to the roofline, so a palm trunk between camera and car
    // filled the middle of the screen. Higher (3.7) + farther back
    // (7.2) looks down over the roof and past the trunks; the on-foot
    // camera is untouched, and the driver pose (worker A, item 2) is a
    // separate change — this line only moves the camera slot.
    var camDist = onFoot ? 2.4 : 7.2, camH = onFoot ? 1.9 : 3.7, camLat = onFoot ? 0.8 : 1.4;
    // Round 27 (P3 20): the heli flies at ~12 m — the camera slot and
    // look target rise with it, or the camera would sit on the ground
    // looking up at an empty sky while the heli flies overhead.
    var camBaseY = (!onFoot && rideMode === 'heli' && rideObj) ? rideObj.position.y : 0;
    // On boat/jetski/bike the camera sits dead behind the (small) vehicle
    // and looks along the heading, so it stays centred at any heading.
    if (!onFoot && rideMode !== 'car') camLat = 0;
    if (!camHeadInit) { camHead = heading; camHeadInit = true; }
    var chd = heading - camHead;
    while (chd > Math.PI) chd -= Math.PI * 2;
    while (chd < -Math.PI) chd += Math.PI * 2;
    camHead += chd * (1 - Math.exp(-6 * dt));
    var chx = Math.sin(camHead), chz = Math.cos(camHead);
    var cx = px + chx * camDist, cz = pz + chz * camDist; // behind = (-movement) = (+sin h, +cos h)
    var tx = cx + chz * camLat + (sparkT > 0 ? (Math.random() - 0.5) * 0.3 : 0), ty = camH + camBaseY, tz = cz - chx * camLat;
    if (cover) cam.position.set(tx, ty, tz);
    else {
      // Round 18: in real gameplay the camera eases toward its slot
      // instead of snapping to it every frame — the ride feels smooth,
      // not bolted on. Cover shots keep the exact pinned position.
      // Round 22: a touch softer (7/s) now the heading eases too.
      var ck = 1 - Math.exp(-7 * dt);
      cam.position.x += (tx - cam.position.x) * ck;
      cam.position.y += (ty - cam.position.y) * ck;
      cam.position.z += (tz - cam.position.z) * ck;
    }
    // Round 22: the view widens a touch with speed (FOV 60 -> ~68 at
    // full tilt) so a fast drive feels fast; it eases back at once when
    // Gito slows or gets out. Cover keeps the fixed 60.
    var fovSpd = rideMode === 'car' ? Math.abs(speed) : Math.abs(rideSpeed);
    var targetFov = (!cover && !onFoot) ? 60 + Math.min(9, fovSpd * 0.2) : 60;
    if (Math.abs(cam.fov - targetFov) > 0.01) { cam.fov += (targetFov - cam.fov) * (1 - Math.exp(-3 * dt)); cam.updateProjectionMatrix(); }
    if (onFoot) {
      // Round 18: look ahead of the player in the facing direction —
      // the old fixed (px, 1.6, pz-2) point shoved the player to the
      // frame edge whenever he faced south. Cover keeps the old point.
      if (cover) cam.lookAt(px, 1.6, pz - 2);
      else cam.lookAt(px - chx * 2, 1.6, pz - chz * 2);
    }
    else cam.lookAt(px - chx * 10, 1.5 + camBaseY, pz - chz * 10);
  }
  // The enter arrow's glow cone looms huge when the follow camera is close
  // behind the player — scale the arrow down at close range so it reads as
  // a small marker, not a frame-filling triangle. Runs for EVERY camera
  // path (cover + gameplay), before render.
  if (enterArrow.visible) {
    var adx = cam.position.x - enterArrow.position.x, ady = cam.position.y - enterArrow.position.y, adz = cam.position.z - enterArrow.position.z;
    var asc = Math.max(0.45, Math.min(1, Math.sqrt(adx * adx + ady * ady + adz * adz) / 9));
    enterArrow.scale.set(asc, asc, asc);
  }
}

