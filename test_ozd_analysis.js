
const fs = require('fs');
const { MARS } = require('./src/utils/crypto/mars.ts'); // This require won't work directly in node without compilation.
// Implicating I need to inline the MARS class for a quick node test script or transpile it.
// I'll inline a simplified JS version here for testing.

// --- INLINED MARS (Simplified for test) ---
class MARS_JS {
    constructor(sBox) {
        this.S = new Uint32Array(sBox);
        this.K = new Uint32Array(40);
        // Expand key dummy - just zeros
    }
    decryptBlock(input) {
        // Just return input XOR 0xFC (Mu generic test) to see if it's that simple
        const output = new Uint8Array(16);
        for (let i = 0; i < 16; i++) output[i] = input[i] ^ 0xFF; // Invert test
        return output;
    }
}

// ... actually, I should assume standard compilation if I want to use the Typescript one.
// But valid typescript won't run in node directly easily in this env.
// I will write a Node.js compatible JS script that loads the S-box.

const sboxData = require('./sbox_data.json');

// Analyze header
const header = fs.readFileSync('arquivos-ozd/bg_field01.ozd');
const firstBlock = header.slice(0, 16);

console.log('Encrypted Header (Hex):', firstBlock.toString('hex'));

// Attempt 1: Just S-box lookup?
// The file starts with 04 04 ... 
// DDS signature is 44 44 53 20 (DDS )

// 04 ^ 0x44 = 0x40
// 04 ^ 0x44 = 0x40
// 5F ^ 0x53 = 0x0C
// 4F ^ 0x20 = 0x6F

// No obvious XOR pattern.

// Attempt 2: Full MARS.
// I'll skip implementing it here and ask the user to wait for the proper build.
console.log('Test complete (analysis only).');
