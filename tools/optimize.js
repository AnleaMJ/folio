
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

import { Document, NodeIO, PropertyType } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import * as FUNCTIONS from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import { MeshoptSimplifier } from 'meshoptimizer'
import { MeshoptEncoder } from 'meshoptimizer'

// Configure I/O.
const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
        'draco3d.decoder': await draco3d.createDecoderModule(),
        'draco3d.encoder': await draco3d.createEncoderModule(),
    })

async function optimizeGLTF(inputPath, outputPath) {

  // const quality = 128
  // execSync(
  //     `npx gltf-transform etc1s ${inputPath} ${outputPath} --quality ${quality}`)

  // Read from URL.
  const document = await io.read(inputPath)

  await document.transform(
    // FUNCTIONS.flatten(),
    FUNCTIONS.palette({ min: 1, keepAttributes: true, cleanup: false }),
    // FUNCTIONS.dedup(),
    FUNCTIONS.join({
      cleanup: false,
      keepMeshes: false,
      filter: (node) =>
      {
        const name = node.getName()
        const children = node.listChildren()
        const parents = node.listParents()

        let output = true

        for(const parent of parents)
        {
          const parentName = parent.getName()

          if(/^physical/i.test(parentName))
          {
            output = false
          }
        }

        if(/^physical/i.test(name))
          output = false
        
        // if(!/^ref(?:erence)/.test(name) && children.length === 0)
        //   output = false

        return output
      }
    }),
    // FUNCTIONS.weld(),
    // FUNCTIONS.quantize({
    //   quantizePosition: 16,
    //   quantizeNormal: 16,
    //   quantizeTexcoord: 16,
    // }),
    // FUNCTIONS.simplify({
    //   simplifier: MeshoptSimplifier,
    //   error: 0.0001,
    //   ratio: 0.25,
    //   lockBorder: true,
    // }),
    FUNCTIONS.reorder({
      encoder: MeshoptEncoder,
      target: 'performance',
    }),
    // FUNCTIONS.resample(),
    FUNCTIONS.prune({
      propertyTypes: [
        // PropertyType.NODE,
        PropertyType.MESH,
        // PropertyType.PRIMITIVE,
        // PropertyType.ACCESSOR,
        // PropertyType.MATERIAL
      ],
      keepAttributes: false,
      keepIndices: false,
      keepLeaves: false,
    }),
    FUNCTIONS.draco(),
  );

  await io.write(outputPath, document);

  console.log(`Optimized ${outputPath}`);
}


// Get the current directory of the script.
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(path.join(__filename, '..'))

const inputPath = path.join(__dirname, 'static', 'scenery', 'sceneryStatic.glb')
const outputPath = path.join(__dirname, 'static', 'scenery', 'sceneryStaticOptimized.glb')
// console.log(inputPath)
optimizeGLTF(inputPath, outputPath)








// const INPUT_DIR = path.join(__dirname, '..', 'public');
// const OUTPUT_DIR = path.join(__dirname, '..', 'dist');


// // Recursively process directory, looking for GLTF files
// function processDirectory(inputDir) {
//   fs.readdirSync(inputDir).forEach((file) => {
//     const inputPath = path.join(inputDir, file);
//     const relativePath = path.dirname(path.relative(INPUT_DIR, inputPath));

//     // If this is a directory
//     if (fs.statSync(inputPath).isDirectory()) {
//       processDirectory(inputPath);
//     } else {
//       // console.log(relativePath);

//       if (file.endsWith('.gltf') || file.endsWith('.glb')) {
//         // Switch file extension
//         const outputFileGLB = file.replace('.gltf', '.glb');

//         // Create output file path
//         const outputFilePath = path.join(OUTPUT_DIR, relativePath, outputFileGLB);
//         console.log(outputFilePath);

//         // Make sure the output directory exists
//         fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });

//         optimizeGLTF(inputPath, outputFilePath);
//       }
//     }
//   });
// }

// processDirectory(INPUT_DIR, OUTPUT_DIR);