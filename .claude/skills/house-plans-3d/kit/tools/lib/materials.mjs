// Material table and the per-floor export shared by every consumer of the model.
// Pure module: it has no side effects on import and reads no files.

// Materials by key. opacity belongs to the node, the rest goes into scene.material.
// `texture` is a key of TEXTURES below; `textureRotation` is in radians.
export const MATERIALS = {
  concrete: { roughness: .92 }, wall: { roughness: .9 }, woodFloor: { roughness: .55, texture: 'wood', textureRotation: Math.PI / 2 }, tile: { roughness: .32, texture: 'tile' },
  tileWc: { roughness: .38, texture: 'tileWc' }, tileOutdoor: { roughness: .85, texture: 'tileOutdoor' },
  glass: { roughness: .06, metalness: .25, doubleSided: true, transparent: true, opacity: .32 },
  frostedGlass: { roughness: .6, doubleSided: true, transparent: true, opacity: .78 },
  frame: { roughness: .45, metalness: .55 }, wood: { roughness: .6 }, plant: { roughness: .95 }, porcelain: { roughness: .18 }, matte: { roughness: .8 },
  roofTile: { roughness: .72, texture: 'roofTile' }, carPaint: { roughness: .28, metalness: .55 }, steel: { roughness: .35, metalness: .45 },
  ghost: { roughness: 1, transparent: true, opacity: .2 }, base: { roughness: 1 }, asphalt: { roughness: .95 }, paving: { roughness: .92, texture: 'paving' }, grass: { roughness: 1, texture: 'grass' }, stone: { roughness: .85 },
};

// Texture images by key: the file in textures/ and the length in metres that one image covers.
export const TEXTURES = {
  tile: { file: 'tile.png', size: 1.2 }, wood: { file: 'wood.png', size: 2.4 }, tileWc: { file: 'tile-wc.png', size: .6 }, tileOutdoor: { file: 'tile-outdoor.png', size: .8 },
  paving: { file: 'paving.png', size: 2 }, roofTile: { file: 'roof-tile.png', size: 1.2 }, grass: { file: 'grass.png', size: 3 },
};

// Builds every non-empty part of a floor once, so the result can be reused on several pages.
// Returns { floor, parts: [{ code, name, upper, materialKey, material, texture, built }] }:
// `built` is the MeshBuilder.build() result (with UVs when the material is textured),
// `texture` is the texture key or null. An unknown material key falls back to 'matte'.
export function exportFloor(floor) {
  const parts = [];
  for (const part of floor.parts.values()) {
    if (part.mesh.empty) continue;
    const materialKey = MATERIALS[part.material] ? part.material : 'matte', material = MATERIALS[materialKey];
    const texture = material.texture ?? null;
    parts.push({ code: part.code, name: part.name, upper: part.upper, materialKey, material, texture, built: part.mesh.build({ uv: Boolean(texture) }) });
  }
  return { floor, parts };
}
