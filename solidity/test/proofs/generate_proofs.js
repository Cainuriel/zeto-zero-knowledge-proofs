const snarkjs = require("snarkjs");
const fs     = require("fs");
const path   = require("path");

async function makeProof(name) {
  console.log(`\n=== Generating proof for '${name}' ===`);

  // Directorio dinámico en artifacts/circuits: deposit_js o withdraw_js
  const circuitDir = path.resolve(__dirname, `../../artifacts/circuits/${name}_js`);
  const circuitWasm = path.join(circuitDir, `${name}.wasm`);
  const zkey        = path.join(circuitDir, `${name}.zkey`);

  console.log("Circuit directory:", circuitDir);
  console.log("  - wasm path:", circuitWasm);
  console.log("  - zkey path:", zkey);

  if (!fs.existsSync(circuitWasm)) {
    throw new Error(`WASM no encontrado: ${circuitWasm}`);
  }
  if (!fs.existsSync(zkey)) {
    throw new Error(`ZKey no encontrado: ${zkey}`);
  }

  // Archivos de entrada y salida dentro de test/proofs
  const inputDir   = path.resolve(__dirname);
  console.log("Input directory:", inputDir);
  const inputFile  = path.join(inputDir, `${name}_input.json`);
  const proofFile  = path.join(inputDir, `${name}_proof.json`);
  const publicFile = path.join(inputDir, `${name}_public.json`);

  console.log("Input directory:", inputDir);
  console.log("  - inputFile:", inputFile);

  if (!fs.existsSync(inputFile)) {
    throw new Error(`Input JSON no encontrado: ${inputFile}`);
  }

  // Carga input
  let input;
  try {
    input = JSON.parse(fs.readFileSync(inputFile, "utf8"));
  } catch (err) {
    throw new Error(`Error al leer/parsear ${inputFile}: ${err.message}`);
  }
  console.log(`  • Loaded input (${Object.keys(input).length} fields)`);

  // Genera la proof
  console.log("  • Running snarkjs.groth16.fullProve...");
  let proof, publicSignals;
  try {
    ({ proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      circuitWasm,
      zkey
    ));
  } catch (err) {
    throw new Error(`Error en fullProve: ${err.message}`);
  }

  // Guarda los artefactos JSON
  try {
    fs.writeFileSync(proofFile,  JSON.stringify(proof,        null, 2));
    fs.writeFileSync(publicFile, JSON.stringify(publicSignals, null, 2));
  } catch (err) {
    throw new Error(`Error al escribir outputs: ${err.message}`);
  }

  console.log(`✔ Generated proofs for '${name}':`);
  console.log(`   • Proof ➞ ${path.relative(process.cwd(), proofFile)}`);
  console.log(`   • Public ➞ ${path.relative(process.cwd(), publicFile)}`);
}

async function run() {
  console.log(">>> Starting proof generation script");
  await makeProof("deposit");
  await makeProof("withdraw");
  console.log(">>> All proofs generated successfully!");
}

run().catch(err => {
  console.error("\n❌ Fatal error:", err.message);
  console.error(err.stack);
  process.exit(1);
});

