import fs from 'fs';
import path from 'path';
import { NodeIO } from '@gltf-transform/core';
import { KHRMaterialsPBRSpecularGlossiness } from '@gltf-transform/extensions';
import { metalRough } from '@gltf-transform/functions';

const io = new NodeIO().registerExtensions([KHRMaterialsPBRSpecularGlossiness]);
const dir = './public/models';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.glb'));

async function processAll() {
  for (const file of files) {
    console.log(`Processing ${file}...`);
    const filepath = path.join(dir, file);
    try {
      const document = await io.read(filepath);
      await document.transform(metalRough());
      await io.write(filepath, document); // overwrite
      console.log(`Successfully converted ${file}`);
    } catch (err) {
      console.log(`Failed or no need for ${file}:`, err.message);
    }
  }
}

processAll();
