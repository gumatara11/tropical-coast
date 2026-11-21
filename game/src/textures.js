// Textures: AI-painted JPGs under game/textures plus the small canvas
// textures the game paints itself (tire tread, license plate, golden-hour
// road). Loads start at once; window.__texReady flips when all 22 finish,
// which is what the screenshot scripts wait for before shooting.
var TEX = {};
window.__texReady = false;
(function () {
  var loader = new THREE.TextureLoader();
  var pending = 22;
  function done() { if (--pending === 0) window.__texReady = true; }
  function load(name, rx, ry, key) {
    var t = loader.load('textures/' + name + '.jpg', done, undefined, function () { done(); });
    t.wrapS = THREE.MirroredRepeatWrapping; t.wrapT = THREE.MirroredRepeatWrapping;
    if (rx) t.repeat.set(rx, ry);
    t.colorSpace = THREE.SRGBColorSpace;
    TEX[key || name] = t;
  }
  load('promenade-tiles', 1, 55);
  load('sand', 2, 55);
  load('wood-planks');
  load('shop-front');
  load('shirt-palm');
  ['facade-cream', 'facade-beige', 'facade-terra'].forEach(function (fn) {
    load(fn, 1, 1, fn + '-1'); load(fn, 1, 2, fn + '-2'); load(fn, 1, 3, fn + '-3');
  });
  load('sea', 6, 14);
  load('road', 2, 40, 'road-long');
  load('road', 12, 1, 'road-cross');
  load('sky-sunset');
  load('bark', 2, 3);
  load('car-side');
  load('car-top');
  load('hair');
})();

// Golden-hour road: the AI asphalt reads too dark under the low sun, so the
// golden variant paints its own warm road with pale edges and yellow dashes.
// Its speckle uses a private generator so the shared sequence stays untouched.
if (variant === 'golden') {
  var ls = 1234567;
  function goldRoadCanvas(horizontal) {
    var rc = document.createElement('canvas'); rc.width = 256; rc.height = 256;
    var rx2 = rc.getContext('2d');
    rx2.fillStyle = '#a87a52'; rx2.fillRect(0, 0, 256, 256);
    for (var si = 0; si < 2600; si++) { ls = (ls * 1103515245 + 12345) & 0x7fffffff; var px2 = ls % 256; ls = (ls * 1103515245 + 12345) & 0x7fffffff; var py2 = ls % 256; rx2.fillStyle = (ls % 3 === 0) ? '#96683f' : '#b8895f'; rx2.fillRect(px2, py2, 2, 2); }
    rx2.fillStyle = '#e8d8b8';
    if (horizontal) { rx2.fillRect(0, 6, 256, 5); rx2.fillRect(0, 245, 256, 5); } else { rx2.fillRect(6, 0, 5, 256); rx2.fillRect(245, 0, 5, 256); }
    rx2.fillStyle = '#ffd23f';
    if (horizontal) { rx2.fillRect(20, 124, 90, 8); rx2.fillRect(150, 124, 90, 8); } else { rx2.fillRect(124, 20, 8, 90); rx2.fillRect(124, 150, 8, 90); }
    return rc;
  }
  var goldRoad = new THREE.CanvasTexture(goldRoadCanvas(false));
  goldRoad.wrapS = THREE.MirroredRepeatWrapping; goldRoad.wrapT = THREE.MirroredRepeatWrapping;
  goldRoad.repeat.set(2, 40); goldRoad.colorSpace = THREE.SRGBColorSpace;
  TEX['road-golden'] = goldRoad;
  var goldCross = new THREE.CanvasTexture(goldRoadCanvas(true));
  goldCross.wrapS = THREE.MirroredRepeatWrapping; goldCross.wrapT = THREE.MirroredRepeatWrapping;
  goldCross.repeat.set(12, 1); goldCross.colorSpace = THREE.SRGBColorSpace;
  TEX['road-cross-golden'] = goldCross;
}

// Tire tread + the player car's TC-128 plate, both painted on canvas.
var treadTex = (function () {
  var cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
  var g = cv.getContext('2d');
  g.fillStyle = '#222222'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#444444';
  for (var i = 0; i < 8; i++) g.fillRect(0, i * 8, 64, 3);
  return new THREE.CanvasTexture(cv);
})();
var plateTex = (function () {
  var cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
  var g = cv.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#111111'; g.font = 'bold 40px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('TC-128', 128, 34);
  return new THREE.CanvasTexture(cv);
})();
