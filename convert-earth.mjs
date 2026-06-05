// convert-earth.mjs
// Converts KHR_materials_pbrSpecularGlossiness → metallic-roughness
// Run once: node convert-earth.mjs

import { NodeIO } from '@gltf-transform/core';
import { KHRMaterialsPBRSpecularGlossiness } from '@gltf-transform/extensions';
import { metalRough } from '@gltf-transform/functions';

const io = new NodeIO().registerExtensions([KHRMaterialsPBRSpecularGlossiness]);

console.log('Reading earth.glb...');
const document = await io.read('./public/models/earth.glb');

console.log('Converting specular-glossiness → metallic-roughness...');
await document.transform(metalRough());

console.log('Writing earth_converted.glb...');
await io.write('./public/models/earth_converted.glb', document);

console.log('Done! Use /models/earth_converted.glb in your app.');
