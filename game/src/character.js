// People: Gito, Luna, the mission NPCs and the crowd. Every arm in this
// file has its shoulder cap, sleeve, elbow ball and hand actually added —
// the old game lost 7-8 of those meshes because a `//` comment on the
// same line swallowed the add() call. Here every add() is on its own line.
var skinCols = [0xe8b88a, 0xc88a5a, 0x8a5a3a, 0xf0c8a0];
var hairCols = [0x2a1a0a, 0x3a2a1a, 0x111111, 0x8a5a2a];

// A real hand: a flattened palm, one fused finger mass (separate cylinders
// read as a rake), and a small round thumb bump on the inner edge.
function makeHand(skinM, side) {
  var h = new THREE.Group();
  var palm = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 12), skinM);
  palm.scale.set(1.35, 1.0, 0.34); h.add(palm);
  var fingerMass = new THREE.Mesh(new THREE.SphereGeometry(0.060, 14, 10), skinM);
  fingerMass.scale.set(1.0, 1.55, 0.30); fingerMass.position.set(0, -0.094, 0.010); h.add(fingerMass);
  var th = new THREE.Mesh(new THREE.SphereGeometry(0.020, 10, 8), skinM);
  th.scale.set(1, 1.4, 0.8); th.position.set(-side * 0.062, -0.042, 0.016); h.add(th);
  return h;
}
// A shoe: a wide elliptical upper (not a ball, not a box) on a thin light
// sole, with three thin white lace strips following the upper's curve.
function makeShoe(color, s) {
  var g = new THREE.Group();
  var m = new THREE.MeshLambertMaterial({ color: color });
  var body = new THREE.Mesh(new THREE.SphereGeometry(0.075 * s, 16, 12), m);
  body.scale.set(1.22, 0.62, 1.95); body.position.set(0, -0.39, 0.02); g.add(body);
  var sole = new THREE.Mesh(new THREE.SphereGeometry(0.075 * s, 16, 12), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  sole.scale.set(1.05, 0.38, 1.9); sole.position.set(0, -0.425, 0.02); g.add(sole);
  [[-0.352, 0.06], [-0.358, 0.10], [-0.370, 0.14]].forEach(function (lz) {
    var lace = new THREE.Mesh(new THREE.BoxGeometry(0.04 * s, 0.008 * s, 0.018 * s), new THREE.MeshLambertMaterial({ color: 0xf5f5f5 }));
    lace.position.set(0, lz[0], lz[1]); g.add(lace);
  });
  return g;
}
// Shaped head: round skull, a jaw so the face is not a ball, hair as a cap
// with a tapered nape (skin nape stays visible from behind), ears, and
// friendly dark eyes — a small iris flat on the face with a catchlight,
// thin brows, a small round nose bump, and a thin neutral mouth (or a soft
// smile arc for Luna). No white sclera: the big white discs read as googly
// doll eyes. Options: eyes, faceGlasses (Gito's small rectangular
// sunglasses), headGlasses (Luna's tortoiseshell pair resting on her head),
// earrings (gold hoops), smile.
function makeHead(skinM, hairM, opts) {
  var head = new THREE.Group(); head.position.y = 1.64;
  if (TEX['hair']) { hairM.map = TEX['hair']; hairM.needsUpdate = true; }
  var skull = new THREE.Mesh(new THREE.SphereGeometry(0.125, 20, 16), skinM);
  skull.scale.set(1, 1.15, 1.0); head.add(skull);
  var jaw = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 12), skinM);
  jaw.scale.set(0.82, 0.62, 0.88); jaw.position.set(0, -0.075, 0.015); head.add(jaw);
  var hair = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.50), hairM);
  hair.scale.set(1.08, 1.22, 1.14); hair.position.set(0, 0.025, -0.015); head.add(hair);
  var nape = new THREE.Mesh(new THREE.SphereGeometry(0.10, 14, 12), hairM);
  nape.scale.set(1.0, 0.75, 0.55); nape.position.set(0, -0.045, -0.06); head.add(nape);
  [-0.055, -0.018, 0.018, 0.055].forEach(function (lx) {
    var lock = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.012, 0.05, 6), hairM);
    lock.position.set(lx, -0.10, -0.11); lock.rotation.x = 0.15; head.add(lock);
  });
  var crown = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 12), hairM);
  crown.scale.set(1.35, 0.75, 1.15); crown.position.set(0.02, 0.11, -0.03); head.add(crown);
  var backB1 = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), hairM);
  backB1.scale.set(1.0, 0.7, 0.55); backB1.position.set(-0.05, 0.06, -0.095); head.add(backB1);
  var backB2 = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 12), hairM);
  backB2.scale.set(1.0, 0.7, 0.55); backB2.position.set(0.05, 0.06, -0.095); head.add(backB2);
  var sweep = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 12), hairM);
  sweep.scale.set(0.6, 0.9, 1.0); sweep.position.set(0.085, 0.02, -0.01); head.add(sweep);
  var fringe = new THREE.Mesh(new THREE.SphereGeometry(0.10, 14, 12), hairM);
  fringe.scale.set(1.05, 0.45, 0.55); fringe.position.set(0.04, 0.105, 0.09); head.add(fringe);
  [-0.125, 0.125].forEach(function (ex) {
    var sb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), hairM);
    sb.scale.set(0.6, 1.3, 0.7); sb.position.set(ex, -0.02, 0.05); head.add(sb);
  });
  [-0.135, 0.135].forEach(function (ex) {
    var ear = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), skinM);
    ear.scale.set(0.5, 1, 0.8); ear.position.set(ex, 0, 0); head.add(ear);
  });
  if (opts.eyes) {
    [-0.055, 0.055].forEach(function (ex) {
      var iris = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 10), new THREE.MeshLambertMaterial({ color: 0x2a1a10 }));
      iris.scale.set(1, 1, 0.4); iris.position.set(ex, 0.02, 0.118); head.add(iris);
      var glint = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 6), new THREE.MeshLambertMaterial({ color: 0xffffff }));
      glint.scale.set(1, 1, 0.5); glint.position.set(ex - 0.004, 0.026, 0.122); head.add(glint);
      var brow = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.009, 0.012), hairM);
      brow.position.set(ex, 0.098, 0.122); head.add(brow);
    });
  }
  if (opts.faceGlasses) {
    var sgM = new THREE.MeshLambertMaterial({ color: 0x111114 });
    [-0.050, 0.050].forEach(function (ex) {
      var lens = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), sgM);
      lens.scale.set(1.0, 0.55, 0.25); lens.position.set(ex, 0.022, 0.122);
      lens.rotation.y = ex < 0 ? 0.18 : -0.18;
      head.add(lens);
    });
    var bridge = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.008, 0.010), sgM);
    bridge.position.set(0, 0.030, 0.124); head.add(bridge);
    [-0.092, 0.092].forEach(function (ax) {
      var temple = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.008, 0.09), sgM);
      temple.position.set(ax, 0.03, 0.085); head.add(temple);
    });
  }
  if (opts.headGlasses) {
    var hgM = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
    [-0.055, 0.055].forEach(function (ex) {
      var hlens = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.028, 0.012), hgM);
      hlens.position.set(ex, 0.14, 0.09);
      hlens.rotation.x = -0.40;
      hlens.rotation.y = ex < 0 ? 0.12 : -0.12;
      head.add(hlens);
    });
    var hbridge = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.007, 0.010), hgM);
    hbridge.position.set(0, 0.145, 0.085); hbridge.rotation.x = -0.40; head.add(hbridge);
  }
  if (opts.earrings) {
    var goldM = new THREE.MeshLambertMaterial({ color: 0xd4af37 });
    [-0.16, 0.16].forEach(function (ex) {
      var hoop = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 6, 14), goldM);
      hoop.position.set(ex, -0.07, 0.01); hoop.rotation.y = Math.PI / 2; head.add(hoop);
    });
  }
  var nose = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), skinM);
  nose.scale.set(0.8, 1.1, 0.9); nose.position.set(0, -0.025, 0.135); head.add(nose);
  if (opts.smile) {
    var smile = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.005, 6, 12, Math.PI), new THREE.MeshLambertMaterial({ color: 0x9a4a3a }));
    smile.position.set(0, -0.082, 0.115); smile.rotation.z = Math.PI;
    head.add(smile);
  } else {
    var mouth = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.010, 0.012), new THREE.MeshLambertMaterial({ color: 0x8a4a3a }));
    mouth.position.set(0, -0.085, 0.115); head.add(mouth);
  }
  return head;
}
// Generic person: lathe-profile torso, legs with a knee joint and tapered
// calves, arms with a shoulder cap, a rounded sleeve, a bent elbow and a
// real hand. Real proportions — hip at 0.95, total height ~1.82, about
// 7.3 heads. Skin and hair are seeded; the elbow bend is seeded too and
// the call stays unconditional so the layout sequence never shifts.
function person(shirt, pants, female, opts) {
  var g = new THREE.Group();
  var skin = new THREE.MeshLambertMaterial({ color: skinCols[Math.floor(rnd() * skinCols.length)] });
  var shirtM = new THREE.MeshLambertMaterial({ color: shirt });
  var pantsM = new THREE.MeshLambertMaterial({ color: pants });
  var legL = new THREE.Group(), legR = new THREE.Group();
  legL.position.set(-0.13, 0.95, 0); legR.position.set(0.13, 0.95, 0);
  legL.rotation.z = 0.02; legR.rotation.z = -0.08;
  [legL, legR].forEach(function (lg) {
    var thighPts = [];
    [[0.088, 0.25], [0.088, -0.17], [0.082, -0.23], [0.064, -0.25]].forEach(function (p) { thighPts.push(new THREE.Vector2(p[0], p[1])); });
    var thigh = new THREE.Mesh(new THREE.LatheGeometry(thighPts, 20), pantsM);
    thigh.position.y = -0.25; lg.add(thigh);
    var knee = new THREE.Group(); knee.position.y = -0.50; lg.add(knee);
    var kneeBall = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), pantsM);
    kneeBall.scale.set(1.0, 0.55, 0.7); kneeBall.position.z = -0.008; knee.add(kneeBall);
    var calfPts = [];
    [[0.072, 0.10], [0.074, 0.00], [0.074, -0.06], [0.074, -0.14], [0.066, -0.24], [0.054, -0.33], [0.044, -0.40], [0.042, -0.44]].forEach(function (p) { calfPts.push(new THREE.Vector2(p[0], p[1])); });
    var calf = new THREE.Mesh(new THREE.LatheGeometry(calfPts, 20), pantsM);
    knee.add(calf);
    knee.add(makeShoe(0x222222, 1.25));
  });
  g.add(legL); g.add(legR);
  var torsoPts = [];
  [[0.155, 0.00], [0.165, 0.08], [0.175, 0.18], [0.19, 0.30], [0.20, 0.40], [0.205, 0.47], [0.20, 0.51], [0.175, 0.545], [0.13, 0.565], [0.085, 0.58]].forEach(function (p) { torsoPts.push(new THREE.Vector2(p[0], p[1])); });
  var torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 20), shirtM);
  torso.position.y = 0.95; torso.scale.z = 0.78; g.add(torso);
  var chest = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), shirtM);
  chest.scale.set(1.0, 0.6, 0.5); chest.position.set(0, 1.33, 0.12); g.add(chest);
  var hemPts = [];
  [[0.160, 0.06], [0.172, 0.02], [0.178, -0.02], [0.170, -0.06]].forEach(function (p) { hemPts.push(new THREE.Vector2(p[0], p[1])); });
  var hem = new THREE.Mesh(new THREE.LatheGeometry(hemPts, 20), shirtM);
  hem.position.y = 0.98; hem.scale.z = 0.78; g.add(hem);
  var neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.08, 4, 12), skin);
  neck.position.y = 1.52; g.add(neck);
  var armL = new THREE.Group(), armR = new THREE.Group();
  armL.position.set(-0.15, 1.44, 0); armR.position.set(0.15, 1.44, 0);
  armL.rotation.z = 0.01; armR.rotation.z = -0.01;
  [[armL, -1], [armR, 1]].forEach(function (pair) {
    var ag = pair[0], side = pair[1];
    var shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.098, 16, 12), female ? skin : shirtM);
    shoulder.scale.set(1.25, 0.75, 1.05); shoulder.position.y = -0.01;
    ag.add(shoulder);
    var slPts = [];
    [[0.088, 0.00], [0.090, -0.02], [0.088, -0.06], [0.084, -0.12], [0.078, -0.20]].forEach(function (p) { slPts.push(new THREE.Vector2(p[0], p[1])); });
    var sleeve = new THREE.Mesh(new THREE.LatheGeometry(slPts, 20), female ? skin : shirtM);
    sleeve.position.y = -0.03; ag.add(sleeve);
    var elbowBend = -0.25 + (rnd() - 0.5) * 0.12;
    if (opts && opts.flat) elbowBend = 0;
    var elbow = new THREE.Group(); elbow.position.y = -0.30;
    elbow.rotation.x = elbowBend; elbow.rotation.z = side * 0.03; ag.add(elbow);
    var elbowBall = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), skin);
    elbowBall.scale.set(1, 0.6, 0.75);
    elbow.add(elbowBall);
    var forePts = [];
    [[0.072, 0.10], [0.074, 0.00], [0.074, -0.06], [0.072, -0.14], [0.066, -0.22], [0.062, -0.28], [0.058, -0.32]].forEach(function (p) { forePts.push(new THREE.Vector2(p[0], p[1])); });
    var fore = new THREE.Mesh(new THREE.LatheGeometry(forePts, 20), skin);
    elbow.add(fore);
    var wrist = new THREE.Mesh(new THREE.CapsuleGeometry(0.044, 0.02, 4, 12), skin);
    wrist.position.y = -0.315; elbow.add(wrist);
    var hand = makeHand(skin, side); hand.position.y = -0.33; hand.rotation.x = (opts && opts.flat) ? 0 : -0.15; elbow.add(hand);
  });
  g.add(armL); g.add(armR);
  var head = makeHead(skin, new THREE.MeshLambertMaterial({ color: hairCols[Math.floor(rnd() * hairCols.length)] }), { eyes: true });
  g.add(head);
  head.rotation.z = 0.03;
  g.userData = { armL: armL, armR: armR, legL: legL, legR: legR, head: head };
  g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
  return g;
}

// Gito, the protagonist: pink palm-print shirt over a white tee, navy
// shorts, small rectangular sunglasses. Same build as person() but with
// fixed materials, a white collar and white cuffs, and skin thighs below
// the shorts.
var gito = new THREE.Group();
(function () {
  var mSkin = new THREE.MeshLambertMaterial({ color: 0xdfa878 });
  var mShirt = new THREE.MeshLambertMaterial({ map: TEX['shirt-palm'] });
  var mPants = new THREE.MeshLambertMaterial({ color: 0x2a2a4a });
  var legL = new THREE.Group(), legR = new THREE.Group();
  legL.position.set(-0.13, 0.95, 0); legR.position.set(0.13, 0.95, 0);
  legL.rotation.z = 0.05; legR.rotation.z = -0.05;
  [legL, legR].forEach(function (lg) {
    var shortsPts = [];
    [[0.088, 0.16], [0.088, -0.10], [0.082, -0.14], [0.066, -0.16]].forEach(function (p) { shortsPts.push(new THREE.Vector2(p[0], p[1])); });
    var shorts = new THREE.Mesh(new THREE.LatheGeometry(shortsPts, 20), mPants); shorts.position.y = -0.16; lg.add(shorts);
    var thighSkinPts = [];
    [[0.082, 0.09], [0.079, -0.05], [0.072, -0.09]].forEach(function (p) { thighSkinPts.push(new THREE.Vector2(p[0], p[1])); });
    var thighSkin = new THREE.Mesh(new THREE.LatheGeometry(thighSkinPts, 20), mSkin); thighSkin.position.y = -0.41; lg.add(thighSkin);
    var knee = new THREE.Group(); knee.position.y = -0.50; lg.add(knee);
    var kneeBall = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), mSkin);
    kneeBall.scale.set(1.0, 0.55, 0.7); kneeBall.position.z = -0.008; knee.add(kneeBall);
    var calfPts = [];
    [[0.072, 0.10], [0.074, 0.00], [0.074, -0.06], [0.074, -0.14], [0.066, -0.24], [0.054, -0.33], [0.044, -0.40], [0.042, -0.44]].forEach(function (p) { calfPts.push(new THREE.Vector2(p[0], p[1])); });
    var calf = new THREE.Mesh(new THREE.LatheGeometry(calfPts, 20), mSkin);
    knee.add(calf);
    knee.add(makeShoe(0x222222, 1.25));
  });
  gito.add(legL); gito.add(legR);
  var torsoPts = [];
  [[0.155, 0.00], [0.165, 0.08], [0.175, 0.18], [0.19, 0.30], [0.20, 0.40], [0.205, 0.47], [0.20, 0.51], [0.175, 0.545], [0.13, 0.565], [0.085, 0.58]].forEach(function (p) { torsoPts.push(new THREE.Vector2(p[0], p[1])); });
  var torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts, 20), mShirt); torso.position.y = 0.95; torso.scale.z = 0.78; gito.add(torso);
  var chest = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), mShirt);
  chest.scale.set(1.0, 0.6, 0.5); chest.position.set(0, 1.33, 0.12); gito.add(chest);
  var hemPts = [];
  [[0.160, 0.06], [0.172, 0.02], [0.178, -0.02], [0.170, -0.06]].forEach(function (p) { hemPts.push(new THREE.Vector2(p[0], p[1])); });
  var hem = new THREE.Mesh(new THREE.LatheGeometry(hemPts, 20), mShirt);
  hem.position.y = 0.98; hem.scale.z = 0.78; gito.add(hem);
  var neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.08, 4, 12), mSkin);
  neck.position.y = 1.52; gito.add(neck);
  var collarPts = [];
  [[0.088, 0.035], [0.10, 0.01], [0.10, -0.01], [0.088, -0.035]].forEach(function (p) { collarPts.push(new THREE.Vector2(p[0], p[1])); });
  var collar = new THREE.Mesh(new THREE.LatheGeometry(collarPts, 16), new THREE.MeshLambertMaterial({ color: 0xf5f5f5 }));
  collar.position.y = 1.50; gito.add(collar);
  var armL = new THREE.Group(), armR = new THREE.Group();
  armL.position.set(-0.15, 1.44, 0); armR.position.set(0.15, 1.44, 0);
  armL.rotation.z = -0.30; armR.rotation.z = 0.30;
  [[armL, -1], [armR, 1]].forEach(function (pair) {
    var ag = pair[0], side = pair[1];
    var shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.098, 16, 12), mShirt);
    shoulder.scale.set(1.25, 0.75, 1.05); shoulder.position.y = -0.01;
    ag.add(shoulder);
    var slPts = [];
    [[0.088, 0.00], [0.090, -0.02], [0.088, -0.06], [0.084, -0.12], [0.078, -0.20]].forEach(function (p) { slPts.push(new THREE.Vector2(p[0], p[1])); });
    var sleeve = new THREE.Mesh(new THREE.LatheGeometry(slPts, 20), mShirt); sleeve.position.y = -0.03; ag.add(sleeve);
    var cuffPts = [];
    [[0.080, 0.015], [0.084, 0.008], [0.084, -0.008], [0.080, -0.015]].forEach(function (p) { cuffPts.push(new THREE.Vector2(p[0], p[1])); });
    var cuff = new THREE.Mesh(new THREE.LatheGeometry(cuffPts, 16), new THREE.MeshLambertMaterial({ color: 0xf5f5f5 })); cuff.position.y = -0.22; ag.add(cuff);
    var elbow = new THREE.Group(); elbow.position.y = -0.30; elbow.rotation.x = -0.25; elbow.rotation.z = side * 0.03; ag.add(elbow);
    var elbowBall = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), mSkin);
    elbowBall.scale.set(1, 0.6, 0.75);
    elbow.add(elbowBall);
    var forePts = [];
    [[0.072, 0.10], [0.074, 0.00], [0.074, -0.06], [0.072, -0.14], [0.066, -0.22], [0.062, -0.28], [0.058, -0.32]].forEach(function (p) { forePts.push(new THREE.Vector2(p[0], p[1])); });
    var fore = new THREE.Mesh(new THREE.LatheGeometry(forePts, 20), mSkin);
    elbow.add(fore);
    var wrist = new THREE.Mesh(new THREE.CapsuleGeometry(0.044, 0.02, 4, 12), mSkin);
    wrist.position.y = -0.315; elbow.add(wrist);
    var hand = makeHand(mSkin, side); hand.position.y = -0.33; hand.rotation.x = -0.15; elbow.add(hand);
  });
  gito.add(armL); gito.add(armR);
  var head = makeHead(mSkin, new THREE.MeshLambertMaterial({ color: 0x3a2410 }), { eyes: true, faceGlasses: true });
  gito.add(head);
  gito.userData = { armL: armL, armR: armR, legL: legL, legR: legR, head: head };
  gito.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
})();
gito.position.set(-2.5, 0, 12);
scene.add(gito);

// Luna: pink top with a real waist, blue jeans, magenta shoes, ponytail,
// sunglasses resting on her head, gold hoop earrings, a soft smile. She
// stands relaxed — one leg slightly forward, one knee bent, arms
// asymmetric, head tilted a touch.
var woman = new THREE.Group();
(function () {
  var wSkin = new THREE.MeshLambertMaterial({ color: 0xf0c8a0 });
  var wDenim = new THREE.MeshLambertMaterial({ color: 0x4a6fa5 });
  var wTopPts = [];
  [[0.155, 0.00], [0.160, 0.10], [0.168, 0.20], [0.178, 0.28], [0.182, 0.36], [0.178, 0.44], [0.165, 0.48], [0.135, 0.51], [0.105, 0.53], [0.085, 0.54]].forEach(function (p) { wTopPts.push(new THREE.Vector2(p[0], p[1])); });
  var wTop = new THREE.Mesh(new THREE.LatheGeometry(wTopPts, 20), new THREE.MeshLambertMaterial({ color: 0xff8ac8 }));
  wTop.position.y = 0.95; wTop.scale.z = 0.80; woman.add(wTop);
  [-0.155, 0.155].forEach(function (sx) {
    var dome = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 12), wSkin);
    dome.scale.set(1.0, 0.42, 0.8);
    dome.position.set(sx, 1.41, 0);
    woman.add(dome);
  });
  var wNeck = new THREE.Mesh(new THREE.CapsuleGeometry(0.066, 0.08, 4, 12), wSkin);
  wNeck.position.y = 1.52; woman.add(wNeck);
  var wHairM = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
  var head = makeHead(wSkin, wHairM, { eyes: true, headGlasses: true, earrings: true, smile: true });
  head.scale.set(0.95, 0.95, 0.95);
  var wBack = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), wHairM);
  wBack.scale.set(1.15, 1.45, 0.85); wBack.position.set(0, -0.08, -0.13); head.add(wBack);
  var wPony = new THREE.Mesh(new THREE.CapsuleGeometry(0.10, 0.5, 4, 12), wHairM);
  wPony.position.set(0.08, -0.18, -0.24); wPony.rotation.x = 0.25; head.add(wPony);
  woman.add(head);
  var wHipsPts = [];
  [[0.165, 0.11], [0.175, 0.05], [0.185, -0.05], [0.178, -0.11]].forEach(function (p) { wHipsPts.push(new THREE.Vector2(p[0], p[1])); });
  var wHips = new THREE.Mesh(new THREE.LatheGeometry(wHipsPts, 20), wDenim);
  wHips.position.y = 0.95; wHips.scale.z = 0.8; woman.add(wHips);
  var legL = new THREE.Group(), legR = new THREE.Group();
  legL.position.set(-0.13, 0.95, 0); legR.position.set(0.13, 0.95, 0);
  [legL, legR].forEach(function (lg) {
    var thighPts = [];
    [[0.088, 0.25], [0.085, -0.05], [0.076, -0.17], [0.064, -0.23], [0.056, -0.25]].forEach(function (p) { thighPts.push(new THREE.Vector2(p[0], p[1])); });
    var thigh = new THREE.Mesh(new THREE.LatheGeometry(thighPts, 20), wDenim);
    thigh.position.y = -0.25; lg.add(thigh);
    var knee = new THREE.Group(); knee.position.y = -0.50; lg.add(knee);
    var kneeBall = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), wDenim);
    kneeBall.scale.set(1.0, 0.55, 0.7); kneeBall.position.z = -0.008; knee.add(kneeBall);
    var calfPts = [];
    [[0.072, 0.10], [0.074, 0.00], [0.072, -0.06], [0.068, -0.14], [0.060, -0.24], [0.046, -0.33], [0.036, -0.40], [0.032, -0.44]].forEach(function (p) { calfPts.push(new THREE.Vector2(p[0], p[1])); });
    var calf = new THREE.Mesh(new THREE.LatheGeometry(calfPts, 20), wDenim);
    knee.add(calf);
    knee.add(makeShoe(0x8a2a5a, 1.1));
  });
  woman.add(legL); woman.add(legR);
  var armL = new THREE.Group(), armR = new THREE.Group();
  armL.position.set(-0.15, 1.44, 0); armR.position.set(0.15, 1.44, 0);
  armL.rotation.z = -0.30; armR.rotation.z = 0.30;
  [[armL, -1], [armR, 1]].forEach(function (pair) {
    var ag = pair[0], side = pair[1];
    var shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), wSkin);
    shoulder.scale.set(1.2, 0.75, 1.0); shoulder.position.y = -0.01;
    ag.add(shoulder);
    var upperPts = [];
    [[0.088, 0.17], [0.086, -0.10], [0.080, -0.15], [0.074, -0.17]].forEach(function (p) { upperPts.push(new THREE.Vector2(p[0], p[1])); });
    var upper = new THREE.Mesh(new THREE.LatheGeometry(upperPts, 20), wSkin);
    upper.position.y = -0.13; ag.add(upper);
    var elbow = new THREE.Group(); elbow.position.y = -0.30; elbow.rotation.x = -0.35; elbow.rotation.z = side * 0.03; ag.add(elbow);
    var elbowBall = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 10), wSkin);
    elbowBall.scale.set(1, 0.6, 0.75);
    elbow.add(elbowBall);
    var forePts = [];
    [[0.070, 0.10], [0.072, 0.00], [0.072, -0.06], [0.070, -0.14], [0.064, -0.22], [0.060, -0.28], [0.058, -0.32]].forEach(function (p) { forePts.push(new THREE.Vector2(p[0], p[1])); });
    var fore = new THREE.Mesh(new THREE.LatheGeometry(forePts, 20), wSkin);
    elbow.add(fore);
    var wrist = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.02, 4, 12), wSkin);
    wrist.position.y = -0.315; elbow.add(wrist);
    var hand = makeHand(wSkin, side); hand.position.y = -0.33; hand.rotation.x = -0.15; elbow.add(hand);
  });
  woman.add(armL); woman.add(armR);
  legL.rotation.x = -0.04; legR.rotation.x = 0.02;
  legR.children[1].rotation.x = 0.07;
  armL.rotation.x = -0.04; armR.rotation.x = 0.03;
  head.rotation.z = 0.04;
  woman.userData = { armL: armL, armR: armR, legL: legL, legR: legR, head: head };
  woman.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
})();
woman.position.set(22.5, groundY(22.5, -57.5), -57.5); woman.rotation.y = Math.PI;
scene.add(woman);

// Sidewalk pedestrians on the coast road, Avenue 1 and Avenue 2.
var peds = [];
var pedCols = [0xff5a5a, 0x2a9ad8, 0x37b24a, 0xffd23f, 0x9a5aff, 0xff8ac8, 0x2ac8c8, 0xff8a2a];
for (var pi = 0; pi < 22; pi++) {
  var ped = person(pedCols[pi % 8], [0x2a2a4a, 0x4a4a4a, 0x8a5a2a][pi % 3], pi % 3 === 0);
  var side = pi % 2 === 0 ? -10.5 : 10.5;
  ped.position.set(side, 0, -180 + pi * 17 + rnd() * 8);
  ped.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  ped.userData.walk = rnd() * 6.28; ped.userData.sp = 0.5 + rnd() * 0.5; ped.userData.side = side;
  scene.add(ped); peds.push(ped);
}
for (var pi2 = 0; pi2 < 10; pi2++) {
  var ped2 = person(pedCols[pi2 % 8], [0x2a2a4a, 0x4a4a4a, 0x8a5a2a][pi2 % 3], pi2 % 3 === 0);
  var side2 = pi2 % 2 === 0 ? -29.5 : -34.5;
  ped2.position.set(side2, 0, -180 + pi2 * 38 + rnd() * 8);
  ped2.rotation.y = pi2 % 2 === 0 ? Math.PI / 2 : -Math.PI / 2;
  ped2.userData.walk = rnd() * 6.28; ped2.userData.sp = 0.5 + rnd() * 0.5; ped2.userData.side = pi2 % 2 === 0 ? -29.5 : 29.5;
  scene.add(ped2); peds.push(ped2);
}
for (var pi3 = 0; pi3 < 6; pi3++) {
  var ped3 = person(pedCols[pi3 % 8], [0x2a2a4a, 0x4a4a4a, 0x8a5a2a][pi3 % 3], pi3 % 3 === 0);
  var side3 = pi3 % 2 === 0 ? -77.5 : -82.5;
  ped3.position.set(side3, 0, -150 + pi3 * 55 + rnd() * 8);
  ped3.rotation.y = pi3 % 2 === 0 ? Math.PI / 2 : -Math.PI / 2;
  ped3.userData.walk = rnd() * 6.28; ped3.userData.sp = 0.5 + rnd() * 0.5; ped3.userData.side = pi3 % 2 === 0 ? -77.5 : 77.5;
  scene.add(ped3); peds.push(ped3);
}
// Seated NPCs on the sand benches, chatting pairs, beachgoers, sunbathers
// lying flat on towels, swimmers in the shallows.
[[16, -150, 0xff5a5a], [16, -80, 0x2a9ad8], [16, -10, 0x37b24a]].forEach(function (bn2) {
  var s = person(bn2[2], 0x2a2a4a, false);
  s.position.set(bn2[0], 0.5, bn2[1]); s.rotation.y = -Math.PI / 2; scene.add(s);
});
var chatters = [];
function miniPed(x, z, shirt, pants, female) {
  var mp = person(shirt, pants, female);
  mp.position.set(x, groundY(x, z), z); mp.rotation.y = rnd() * 6.28; scene.add(mp); chatters.push(mp); return mp;
}
miniPed(18, 60, 0x37b24a, 0x2a2a4a, true); miniPed(19.3, 60, 0xff8ac8, 0x8a2a2a, false);
miniPed(20, -40, 0x2a9ad8, 0x2a2a4a, false); miniPed(21.3, -40, 0xffd23f, 0x4a4a4a, true);
miniPed(24, 40, 0xff5a5a, 0x2a2a4a, true); miniPed(25.3, 40, 0x2ac8c8, 0x8a5a2a, false);
var beachgoers = [];
for (var bg = 0; bg < 14; bg++) {
  var bgg = person(pedCols[bg % 8], [0x2a2a4a, 0x4a4a4a][bg % 2], bg % 3 === 0);
  var bgx = 17 + rnd() * 10, bgz = -170 + rnd() * 340;
  bgg.position.set(bgx, groundY(bgx, bgz), bgz);
  bgg.rotation.y = rnd() * 6.28;
  if (bg % 3 === 0) {
    var hat = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.35, 10), new THREE.MeshLambertMaterial({ color: beachCols[(bg + 1) % 6] }));
    hat.position.set(0, 2.25, 0); bgg.add(hat);
  }
  scene.add(bgg); beachgoers.push(bgg);
}
for (var tb = 0; tb < 10; tb++) {
  var tx = 17 + rnd() * 10, tz = -160 + rnd() * 320;
  var towel = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2), new THREE.MeshBasicMaterial({ color: beachCols[tb % 6], side: THREE.DoubleSide }));
  towel.rotation.x = -Math.PI / 2; towel.position.set(tx, 0.1, tz); scene.add(towel);
  var sunb = person(beachCols[(tb + 2) % 6], 0x2a2a4a, tb % 2 === 0, { flat: true });
  sunb.position.set(tx, 0.15, tz); sunb.rotation.x = -Math.PI / 2; sunb.rotation.z = rnd() * 6.28; scene.add(sunb);
}
for (var sw = 0; sw < 8; sw++) {
  var sx = 34 + rnd() * 16, sz = -140 + rnd() * 280;
  var swb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), new THREE.MeshLambertMaterial({ color: skinCols[sw % 4] }));
  swb.position.set(sx, 0.1, sz); scene.add(swb);
  var cap = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshLambertMaterial({ color: beachCols[sw % 6] }));
  cap.position.set(sx, 0.35, sz); scene.add(cap);
}

// Mission NPCs: Ray the dock worker at the harbor, Max the bouncer at the
// club. A yellow "!" marker bobs above the current mission giver.
var dockWorker = person(0xff8a2a, 0x2a2a4a, false);
dockWorker.position.set(-82, 0, -178); dockWorker.rotation.y = Math.PI / 2; scene.add(dockWorker);
var bouncer = person(0x2a2a4a, 0x111111, false);
bouncer.position.set(-79, 0, 125); bouncer.rotation.y = -Math.PI / 2; scene.add(bouncer);
var marks = [];
function addMark(obj) {
  var mk = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
  mk.position.set(obj.position.x, 2.75, obj.position.z); scene.add(mk);
  marks.push({ obj: obj, mesh: mk });
}
addMark(woman); addMark(dockWorker); addMark(bouncer);
