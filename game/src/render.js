// The main loop: cover-shot staging, ambient life, traffic, police,
// the player (on foot, car, bike, boat, jetski), missions, the HUD and
// the camera director. One frame() call per animation frame.
var clock = new THREE.Clock(); var t = 0;
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
  var dynamicRoots = [gito, woman, player].concat(traffic, aveTraffic, ave2Traffic, crossTraffic, bikeTraffic, bikes, motorboats, jetskis, [police, police2, police3, police4, police5, police6, taxi, heli, tourHeli], peds, chatters, beachgoers);
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
function frame() {
  requestAnimationFrame(frame);
  var dt = Math.min(clock.getDelta(), 0.05); t += dt;
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
  heli.visible = !cover || qs.get('spot') === 'chase';
  glints.forEach(function (g2, i) { g2.material.opacity = 0.2 + 0.25 * Math.abs(Math.sin(t * 1.5 + i * 1.3)); });
  buoys.forEach(function (b3, i) { b3.position.y = 0.2 + Math.sin(t * 1.5 + i) * 0.15; });
  wheel.rotation.z += dt * 0.15;
  heli.userData.rotor.rotation.y += dt * 20;
  heli.position.y = 26 + Math.sin(t * 0.8) * 0.8;
  if (wanted > 0 && !cover) { heli.position.x += (px - heli.position.x) * dt * 0.5; heli.position.z += ((pz - 15) - heli.position.z) * dt * 0.5; }
  if (heli.userData.spot) heli.userData.spot.material.opacity = wanted > 0 ? 0.4 : 0.12;
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
    tr.position.z += dt * (6 + i) * brakeK(tr);
    if (tr.position.z > 210) tr.position.z = -210;
  });
  aveTraffic.forEach(function (tr, i) {
    tr.position.z += dt * (5 + i * 2) * brakeK(tr);
    if (tr.position.z > 210) tr.position.z = -210;
  });
  ave2Traffic.forEach(function (tr, i) {
    tr.position.z += dt * (5 + i * 2) * brakeK(tr);
    if (tr.position.z > 210) tr.position.z = -210;
  });
  crossTraffic[0].position.x += dt * 8 * brakeK(crossTraffic[0]); if (crossTraffic[0].position.x > 8) crossTraffic[0].position.x = -58;
  crossTraffic[1].position.x -= dt * 8 * brakeK(crossTraffic[1]); if (crossTraffic[1].position.x < -58) crossTraffic[1].position.x = 8;
  bikeTraffic.forEach(function (tr, i) {
    tr.position.z += dt * (7 + i * 2) * brakeK(tr);
    if (tr.position.z > 210) tr.position.z = -210;
  });
  [traffic, aveTraffic, ave2Traffic, crossTraffic, bikeTraffic].forEach(function (list) {
    list.forEach(function (o) { if (o.userData.brakeT > 0) o.userData.brakeT -= dt; });
  });
  var chaseK = wanted > 0 ? 2.4 : 1.2;
  if (onFoot) {
    police.position.x += ((px - 4.2) - police.position.x) * dt * 0.8;
    police.position.z += ((pz - 30) - police.position.z) * dt * 0.8;
    police.rotation.y = Math.PI;
  } else {
    police.position.x += ((px + 3.5) - police.position.x) * dt * chaseK;
    police.position.z += ((pz - 3) - police.position.z) * dt * chaseK;
    police.rotation.y = heading;
  }
  if (wanted > 0 && !onFoot) {
    police2.position.x += ((px - 3.5) - police2.position.x) * dt * 2.0;
    police2.position.z += ((pz - 6) - police2.position.z) * dt * 2.0;
    police2.rotation.y = heading;
  } else { police2.position.z += dt * 5; if (police2.position.z > 210) police2.position.z = -210; }
  [[police3, 6, -12], [police4, -6, -16], [police5, 2, -20], [police6, -2, -24]].forEach(function (u) {
    var pu = u[0];
    if (wanted > 0 && !onFoot) {
      pu.position.x += ((px + u[1]) - pu.position.x) * dt * 2.0;
      pu.position.z += ((pz + u[2]) - pu.position.z) * dt * 2.0;
      pu.rotation.y = heading;
    } else { pu.position.z += dt * 5; if (pu.position.z > 210) pu.position.z = -210; }
  });
  taxi.position.z += dt * 7 * brakeK(taxi); if (taxi.position.z > 210) taxi.position.z = -210;
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
  [police, police2, police3, police4, police5, police6].forEach(function (pu) { if (pu.position.x > 12) pu.position.x = 12; });
  // Pedestrians walk their sidewalk; chatters nod and gesture.
  // Round 19: a downed NPC lies still until downT runs out, and a hit
  // NPC throws its arms up for the length of hitT instead of walking.
  peds.forEach(function (pd) {
    if (pd.userData.downT > 0) return;
    pd.userData.walk += dt * 3;
    var dir = pd.userData.side < 0 ? 1 : -1;
    if (!(pd.userData.hitT > 0)) pd.position.z += dir * dt * pd.userData.sp * 1.5;
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
  [peds, chatters, beachgoers].forEach(function (list) {
    list.forEach(function (pd) {
      if (pd.userData.downT > 0) { pd.userData.downT -= dt; if (pd.userData.downT <= 0) { pd.rotation.z = 0; pd.userData.hp = 100; } }
      if (pd.userData.hitT > 0) pd.userData.hitT -= dt;
    });
  });

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
      var targetSpeed = mvT * 5;
      var accel = Math.abs(targetSpeed) > Math.abs(footSpeed) ? 14 : 18;
      footSpeed += Math.max(-accel * dt, Math.min(accel * dt, targetSpeed - footSpeed));
      turnVel += Math.max(-6 * dt, Math.min(6 * dt, str * 2.2 - turnVel));
      heading += turnVel * dt;
      // Movement follows the facing direction (-sin h, -cos h), so
      // walking east/west no longer goes backwards against the facing.
      var step = footSpeed * dt;
      var npx = px - Math.sin(heading) * step;
      var npz = pz - Math.cos(heading) * step;
      // Solid parked cars (round 18): the player coupe and the two
      // parked cars on Avenue 1 are bodies now — walking into one stops
      // at its flank instead of passing through. Only blocks ENTRY, so
      // a player who spawns inside (dismount) can always walk back out.
      var blocked = false;
      [[carX, carZ, carHeading], [parked1.position.x, parked1.position.z, parked1.rotation.y], [parked2.position.x, parked2.position.z, parked2.rotation.y]].forEach(function (c) {
        var dx = npx - c[0], dz = npz - c[1];
        var lf = -dx * Math.sin(c[2]) - dz * Math.cos(c[2]);
        var ls = -dx * Math.cos(c[2]) + dz * Math.sin(c[2]);
        var dx0 = px - c[0], dz0 = pz - c[1];
        var lf0 = -dx0 * Math.sin(c[2]) - dz0 * Math.cos(c[2]);
        var ls0 = -dx0 * Math.cos(c[2]) + dz0 * Math.sin(c[2]);
        if (Math.abs(lf) < 2.9 && Math.abs(ls) < 1.5 && !(Math.abs(lf0) < 2.9 && Math.abs(ls0) < 1.5)) blocked = true;
      });
      if (blocked) { npx = px; npz = pz; footSpeed = 0; }
      if (walkable(npx, npz)) { px = npx; pz = npz; } else footSpeed = 0;
      walkPhase += step * 2.2;
      // Traffic hits the player on foot (round 18): a car no longer
      // passes through the body. On contact the player is knocked clear
      // of the car's path, takes damage through the normal armour/health
      // path, the car brakes hard, and the police notice.
      if (playing && !cover) {
        var hitCar = null;
        traffic.concat(aveTraffic).concat(ave2Traffic).concat(crossTraffic).concat(bikeTraffic).concat([taxi, police, police2, police3, police4, police5, police6]).forEach(function (o) {
          if (!hitCar && Math.hypot(o.position.x - px, o.position.z - pz) < 2.6) hitCar = o;
        });
        if (hitCar && sparkT <= 0) {
          sparkT = 0.5; panicT = 1.2; raiseWanted(1); damagePlayer(10); playThud();
          var kdx = px - hitCar.position.x, kdz = pz - hitCar.position.z;
          var kl = Math.hypot(kdx, kdz) || 1;
          var kpx = px + (kdx / kl) * 1.6, kpz = pz + (kdz / kl) * 1.6;
          if (walkable(kpx, kpz)) { px = kpx; pz = kpz; }
          footSpeed = 0;
          hitCar.userData.brakeT = 0.8;
        }
      }
      pz = Math.max(-205, Math.min(205, pz));
      gito.position.set(px, groundY(px, pz), pz);
      gito.rotation.y = heading + Math.PI;
      // A living idle, not a statue: one foot slightly forward, one knee
      // bent, arms hanging asymmetrically, head tilted a touch, soft
      // breathing. While walking, the plain walk cycle.
      var idle = Math.abs(footSpeed) < 0.1;
      var wp = Math.sin(walkPhase) * 0.5 * Math.min(1, Math.abs(footSpeed) / 2);
      gito.userData.legL.rotation.x = idle ? -0.05 : wp; gito.userData.legR.rotation.x = idle ? 0.03 : -wp;
      gito.userData.armL.rotation.x = idle ? -0.04 : -wp; gito.userData.armR.rotation.x = idle ? 0.05 : wp;
      // Idle arms angle OUTWARD (0.30 rad) — pivot at the shoulder so
      // the sleeve top stays merged with the torso while the hands hang
      // clear of the hips/thighs. Riding/staging poses restore the
      // inward angle via stagePose.
      gito.userData.armL.rotation.z = -0.30; gito.userData.armR.rotation.z = 0.30;
      // Neutral on-foot pose — resets anything a riding pose set (bent
      // knees/elbows, head tilt, YXZ lean). The walk branch only
      // overwrites thighs/shoulders, so a seated pose would otherwise
      // stick after dismounting (elbows rest at their built -0.25 bend).
      gito.rotation.order = 'XYZ'; gito.rotation.x = 0; gito.rotation.z = idle ? Math.sin(t * 1.2) * 0.012 : 0;
      gito.userData.head.rotation.x = 0; gito.userData.head.rotation.z = idle ? 0.03 : 0;
      gito.userData.legL.children[1].rotation.x = 0; gito.userData.legR.children[1].rotation.x = idle ? 0.08 : 0;
      gito.userData.armL.children[2].rotation.x = -0.25; gito.userData.armR.children[2].rotation.x = -0.25;
      // Round 19: attack swing — the right arm punches forward (fist/bat)
      // or raises to aim (guns) while attackT runs down.
      if (attackT > 0) {
        var sw19 = Math.sin((0.25 - attackT) / 0.25 * Math.PI);
        if (WEAPON_DEFS[weapon].gun) { gito.userData.armR.rotation.x = -1.4; gito.userData.armL.rotation.x = -1.2; }
        else { gito.userData.armR.rotation.x = -1.9 * sw19; gito.userData.armL.rotation.x = -0.3; }
      }
      // "E Enter Vehicle" prompt + spinning arrow above the nearest
      // rideable vehicle.
      var cd = Math.hypot(carX - px, carZ - pz);
      var nearRide = cd < 4 ? { x: carX, z: carZ } : null;
      if (!nearRide) { var wv2 = nearestVeh(motorboats.concat(jetskis), 6); if (wv2) nearRide = { x: wv2.position.x, z: wv2.position.z }; }
      if (!nearRide) { var bk2 = nearestVeh(bikes, 4); if (bk2) nearRide = { x: bk2.position.x, z: bk2.position.z }; }
      if (enterEl) enterEl.style.display = nearRide ? 'block' : 'none';
      enterArrow.visible = !!nearRide;
      if (nearRide) { enterArrow.position.set(nearRide.x, 2.9 + Math.sin(t * 3) * 0.25, nearRide.z); enterArrow.rotation.y = t * 1.5; }
      // "Talk to NPC" prompt when close to the current mission giver.
      // Dialogue itself starts only on E (tryEnter) — walking up does not
      // auto-start it.
      var mTalk = curMission();
      if (playing && !cover && mTalk && missionStage === 'talk' && Math.hypot(mTalk.giverObj.position.x - px, mTalk.giverObj.position.z - pz) < 3.5) {
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
    if (enterEl) enterEl.style.display = 'none';
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
    if (walkable(nkx, nkz)) { rideObj.position.x = nkx; rideObj.position.z = nkz; } else rideSpeed = 0;
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
      if (Math.hypot(o.position.x - px, o.position.z - pz) < 3.0) hitB = true;
    });
    if (hitB && sparkT <= 0) { sparkT = 0.5; panicT = 1.2; raiseWanted(1); damagePlayer(5); playThud(); }
    if (enterEl) enterEl.style.display = 'none';
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
    if (keys.KeyA || keys.ArrowLeft) steer = Math.min(steer + dt * 2, 0.6);
    else if (keys.KeyD || keys.ArrowRight) steer = Math.max(steer - dt * 2, -0.6);
    else steer *= (1 - dt * 4);
    carHeading += steer * dt * (speed / (4 + Math.abs(speed) * 0.15));
    var ncx = carX - Math.sin(carHeading) * speed * dt;
    var ncz = carZ - Math.cos(carHeading) * speed * dt;
    if (ncz > 205) ncz = -205; if (ncz < -205) ncz = 205;
    if (walkable(ncx, ncz)) { carX = ncx; carZ = ncz; } else speed = 0;
    px = carX; pz = carZ; heading = carHeading;
    player.position.set(carX, groundY(carX, carZ), carZ);
    player.rotation.y = carHeading;
    if (player.userData.frontWheels) player.userData.frontWheels.forEach(function (wg) { wg.rotation.y = steer * 0.5; });
    kmh = Math.round(speed * 3.6);
    if (kmh > 130) raiseWanted(1); // speeding draws the police
    // Collision with traffic / police (bike traffic included).
    var hit = false;
    traffic.concat([police, police2, police3, police4, police5, police6, taxi]).concat(bikeTraffic).forEach(function (o) {
      if (Math.hypot(o.position.x - carX, o.position.z - carZ) < 3.4) hit = true;
    });
    if (hit && sparkT <= 0) { sparkT = 0.5; panicT = 1.2; raiseWanted(2); carCond = Math.max(40, carCond - 3); damagePlayer(8); playThud(); }
    if (enterEl) enterEl.style.display = 'none';
    if (talkEl) talkEl.style.display = 'none';
  }

    // Mission progress + destination beacon (not in cover renders).
    if (playing && !cover && !talking) {
      var cm = curMission();
      if (cm) {
        if (missionStage === 'do' && cm.check === 'car' && !onFoot && rideMode === 'car') completeMission();
        else if (missionStage === 'do' && cm.check && cm.check.x !== undefined && Math.hypot(cm.check.x - px, cm.check.z - pz) < cm.check.r) completeMission();
      }
    }
    var cmB = curMission();
    if (playing && !cover && cmB && missionStage === 'do' && cmB.check && cmB.check.x !== undefined) {
      beacon.visible = true; beacon.position.set(cmB.check.x, 0, cmB.check.z);
    } else beacon.visible = false;
    if (playing && !cover && wantedT > 0) { wantedT -= dt; if (wantedT <= 0) wanted = 0; }
    // Health regens slowly once the heat is off and no recent hit.
    if (playing && !cover && wanted === 0 && t - lastHitT > 5 && health < 100) health = Math.min(100, health + dt * 2);
    if (bannerT > 0) { bannerT -= dt; if (bannerT <= 0 && bannerEl) bannerEl.style.display = 'none'; }
    if (objectiveEl) objectiveEl.style.display = cover ? 'none' : 'block';
    if (sparkT > 0) {
      sparkT -= dt;
      spark.visible = true;
      spark.position.set(px, 1, pz - 2.5);
      spark.rotation.y = t * 5; spark.material.opacity = Math.max(0, sparkT * 1.8);
    } else spark.visible = false;
    // Parked car always sits where Gito left it (follows ground height too).
    player.position.set(carX, groundY(carX, carZ), carZ);
    player.rotation.y = carHeading;
    // Nearby peds panic when the car is close.
    peds.forEach(function (pd) {
      var dd = Math.hypot(pd.position.x - px, pd.position.z - pz);
      if (!onFoot && dd < 6) { pd.position.x += (pd.position.x > px ? 1 : -1) * dt * 3; pd.userData.armL.rotation.x = -2; pd.userData.armR.rotation.x = -2; }
    });
    if (panicT > 0) panicT -= dt;
    // HUD: speedometer, minimap, mission panel, stars, car info, radio.
    drawGauge(kmh);
    if (gaugeBoxEl) gaugeBoxEl.style.display = onFoot ? 'none' : 'block';
    drawMap();
    updateHudExtra();
    if (spdNum) spdNum.textContent = kmh;
    updateAudio(kmh, wanted);
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
    cam.position.set(15.5, 2.4, -64.5); cam.lookAt(21.5, 1.7, -70);
  } else if (screen === 'dialogue') {
    // Video frame 2: Gito from BEHIND, BIG in frame, facing the sea +
    // lifeguard tower (shifted right so the wider 65% dialogue box
    // clears him).
    gito.position.set(16.8, groundY(16.8, -84), -84); gito.rotation.y = Math.PI / 2;
    cam.position.set(13.6, 2.25, -83.7); cam.lookAt(15.7, 1.8, -85);
  } else if (cover && screen === 'game' && !qs.get('spot')) {
    // Video frame 4: side view — Gito at the driver's door, full yellow
    // coupe beside him (walking peds near the car are hidden — the video
    // shows Gito alone at the car).
    peds.forEach(function (b) { if (Math.hypot(b.position.x - 11, b.position.z + 54) < 7) b.visible = false; });
    beachgoers.forEach(function (b) { if (Math.hypot(b.position.x - 11, b.position.z + 54) < 7) b.visible = false; });
    chatters.forEach(function (b) { if (Math.hypot(b.position.x - 11, b.position.z + 54) < 7) b.visible = false; });
    cam.position.set(12.5, 1.6, -48.5); cam.lookAt(12.5, 1.0, -55.5);
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
    var bsx = Math.cos(bh0), bsz = -Math.sin(bh0);
    var bfx = -Math.sin(bh0), bfz = -Math.cos(bh0);
    cam.position.set(bk0.position.x + bfx * 3.5 + bsx * 3.5, 1.9, bk0.position.z + bfz * 3.5 + bsz * 3.5);
    cam.lookAt(bk0.position.x, 1.0, bk0.position.z);
  } else if (cover && screen === 'game' && qs.get('spot') === 'fvespa') {
    // Gito SEATED on the mint Vespa, FRONT 3/4. Seat top y = 0.845 (seat
    // box centre 0.72 + 0.045) + 0.08 float so shoes clear the floorboard.
    var vs0 = bikes[1], vh0 = vs0.rotation.y;
    stageSeat(vs0, 0, 0.4, 0.845, 0.12, { hip: -1.3, knee: 1.3, shoulder: -0.6, elbow: -0.5, head: 0.1 });
    var vbx = -Math.sin(vh0), vbz = -Math.cos(vh0), vsx = Math.cos(vh0), vsz = -Math.sin(vh0);
    cam.position.set(vs0.position.x + vbx * 3.5 + vsx * 2.5, 1.8, vs0.position.z + vbz * 3.5 + vsz * 2.5);
    cam.lookAt(vs0.position.x, 0.9, vs0.position.z);
    peds.forEach(function (b) { if (Math.hypot(b.position.x + 14, b.position.z + 20) < 7) b.visible = false; });
  } else if (cover && screen === 'game' && qs.get('spot') === 'sbike') {
    // PURE SIDE of the parked red sport bike, NO rider — silhouette check.
    var sb0 = bikes[0], sh0 = sb0.rotation.y;
    gito.visible = false;
    cam.position.set(sb0.position.x + Math.cos(sh0) * 4.0, 1.2, sb0.position.z - Math.sin(sh0) * 4.0);
    cam.lookAt(sb0.position.x, 0.7, sb0.position.z);
    peds.forEach(function (b) { if (Math.hypot(b.position.x - 6, b.position.z - 12) < 7) b.visible = false; });
  } else if (cover && screen === 'game' && qs.get('spot') === 'svespa') {
    // PURE SIDE of the parked mint Vespa, NO rider.
    var sv0 = bikes[1], svh0 = sv0.rotation.y;
    gito.visible = false;
    cam.position.set(sv0.position.x + Math.cos(svh0) * 4.0, 1.1, sv0.position.z - Math.sin(svh0) * 4.0);
    cam.lookAt(sv0.position.x, 0.65, sv0.position.z);
    peds.forEach(function (b) { if (Math.hypot(b.position.x + 12, b.position.z + 20) < 7) b.visible = false; });
  } else if (cover && screen === 'game' && qs.get('spot') === 'carside') {
    // PURE SIDE of the player coupe, NO character — silhouette check.
    gito.visible = false;
    cam.position.set(7, 1.4, 10); cam.lookAt(0, 0.9, 10);
    peds.forEach(function (b) { if (Math.hypot(b.position.x - 0, b.position.z - 10) < 7) b.visible = false; });
  } else if (cover && screen === 'game' && qs.get('spot') === 'carfront') {
    // FRONT 3/4 of the player coupe — nose, lights, grille.
    gito.visible = false;
    cam.position.set(5, 1.8, 2); cam.lookAt(0, 0.9, 9);
    peds.forEach(function (b) { if (Math.hypot(b.position.x - 0, b.position.z - 10) < 7) b.visible = false; });
  } else if (cover && screen === 'game' && qs.get('spot') === 'fboat') {
    // PURE SIDE view — the lofted deep-V profile, sweeping sheer +
    // pointed bow read only from a true side angle. Gito SEATED at the
    // starboard helm — staging pose only.
    var mb1 = motorboats[1], mh1 = mb1.rotation.y;
    stageSeat(mb1, 0.48, 0.35, mb1.position.y + 0.71, 0.25, { hip: -1.5, knee: 1.7, shoulder: -0.75, elbow: -0.4, head: 0.1 });
    var msx = Math.cos(mh1), msz = -Math.sin(mh1);
    cam.position.set(mb1.position.x + msx * 7.0, 1.8, mb1.position.z + msz * 7.0);
    cam.lookAt(mb1.position.x, 0.6, mb1.position.z);
  } else if (cover && screen === 'game' && qs.get('spot') === 'fboat34') {
    // FRONT 3/4 — plan taper + bow point + cockpit + helm from here.
    var mb1b = motorboats[1], mh1b = mb1b.rotation.y;
    stageSeat(mb1b, 0.48, 0.35, mb1b.position.y + 0.71, 0.25, { hip: -1.5, knee: 1.7, shoulder: -0.75, elbow: -0.4, head: 0.1 });
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
    // Drive camera LOW + CLOSE (6.0 m / 3.0 high): a high camera looked
    // down on the roof, so the roof read as a flat yellow panel; the chase
    // view is low, near bumper height, rear face dominant.
    var camDist = onFoot ? 2.6 : 6.0, camH = onFoot ? 2.0 : 3.0, camLat = onFoot ? 1.0 : 2.8;
    // On boat/jetski/bike the camera sits dead behind the (small) vehicle
    // and looks along the heading, so it stays centred at any heading.
    if (!onFoot && rideMode !== 'car') camLat = 0;
    var cx = px + Math.sin(heading) * camDist, cz = pz + Math.cos(heading) * camDist; // behind = (-movement) = (+sin h, +cos h)
    var tx = cx + camLat + (sparkT > 0 ? (Math.random() - 0.5) * 0.3 : 0), ty = camH, tz = cz;
    if (cover) cam.position.set(tx, ty, tz);
    else {
      // Round 18: in real gameplay the camera eases toward its slot
      // instead of snapping to it every frame — the ride feels smooth,
      // not bolted on. Cover shots keep the exact pinned position.
      var ck = 1 - Math.exp(-10 * dt);
      cam.position.x += (tx - cam.position.x) * ck;
      cam.position.y += (ty - cam.position.y) * ck;
      cam.position.z += (tz - cam.position.z) * ck;
    }
    if (onFoot) {
      // Round 18: look ahead of the player in the facing direction —
      // the old fixed (px, 1.6, pz-2) point shoved the player to the
      // frame edge whenever he faced south. Cover keeps the old point.
      if (cover) cam.lookAt(px, 1.6, pz - 2);
      else cam.lookAt(px - Math.sin(heading) * 2, 1.6, pz - Math.cos(heading) * 2);
    }
    else cam.lookAt(px - Math.sin(heading) * 10, 1.5, pz - Math.cos(heading) * 10);
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

