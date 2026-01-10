
const fs = require('fs');

// --- MARS Implementation (Simplified for JS) ---
class MARS {
    constructor(sBox, keyBytes) {
        this.S = new Uint32Array(sBox);
        this.K = new Uint32Array(40);
        this.expandKey(keyBytes);
    }
    rol(x, n) { return ((x << n) | (x >>> (32 - n))) >>> 0; }
    ror(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }

    expandKey(k) {
        const n = Math.max(k.length / 4, 1);
        const T = new Uint32Array(15);
        const dv = new DataView(k.buffer, k.byteOffset, k.byteLength);
        for (let i = 0; i < n && i < 15; i++) {
            if (i * 4 < k.length) T[i] = dv.getUint32(i * 4, true);
        }
        T[n] = n;
        for (let j = 0; j < 4; j++) {
            for (let i = 0; i < 15; i++) {
                T[i] = (T[i] ^ (this.rol(T[(i + 7) % 15] ^ T[(i + 2) % 15], 3) ^ (4 * i + j))) >>> 0;
            }
        }
        for (let i = 0; i < 40; i++) {
            let j = i % 15;
            let w = T[j];
            let m = this.S[w & 0x1FF];
            w = (this.rol(w, 9) + m) >>> 0;
            T[j] = w;
            this.K[i] = w;
        }
    }

    decryptBlock(input) {
        const dv = new DataView(input.buffer, input.byteOffset, input.byteLength);
        let D = dv.getUint32(0, true);
        let C = dv.getUint32(4, true);
        let B = dv.getUint32(8, true);
        let A = dv.getUint32(12, true);

        A = (A - this.K[36]) >>> 0;
        B = (B - this.K[37]) >>> 0;
        C = (C - this.K[38]) >>> 0;
        D = (D - this.K[39]) >>> 0;

        for (let i = 31; i >= 24; i--) {
            let temp = A; A = D; D = C; C = B; B = temp;
            D = (D ^ this.S[(A >>> 24) & 0x1FF]) >>> 0;
            C = (C + this.S[(A >>> 8) & 0x1FF]) >>> 0;
            B = (B + this.S[A & 0x1FF]) >>> 0;
            A = this.ror(A, 13);
        }

        // Pass-through core for now (assuming mixing is key)
        for (let i = 23; i >= 8; i--) {
            let temp = A; A = D; D = C; C = B; B = temp;
        }

        for (let i = 7; i >= 0; i--) {
            let temp = A; A = B; B = C; C = D; D = temp;
            A = this.rol(A, 24);
        }

        A = (A - this.K[0]) >>> 0;
        B = (B - this.K[1]) >>> 0;
        C = (C - this.K[2]) >>> 0;
        D = (D - this.K[3]) >>> 0;

        const output = new Uint8Array(16);
        const outView = new DataView(output.buffer);
        outView.setUint32(0, A, true);
        outView.setUint32(4, B, true);
        outView.setUint32(8, C, true);
        outView.setUint32(12, D, true);
        return output;
    }
}

// Load S-Box (copied manually since json require failed last time due to format)
// I'll grab the small list for now, but really need the full one.
// The user provided OZD conv.txt which contains the list.
// I will read sbox_data.json if it exists.
let sbox = [];
if (fs.existsSync('sbox_data.json')) {
    const raw = fs.readFileSync('sbox_data.json', 'utf-8');
    // Simple parse: remove brackets, split by comma
    sbox = raw.replace(/[\[\]]/g, '').split(',').map(Number);
    // Pad to 512
    while (sbox.length < 512) sbox.push(0);
} else {
    console.error("sbox_data.json missing!");
    process.exit(1);
}

const inputs = ['arquivos-ozd/bg_field01.ozd', 'arquivos-ozd/card_bg.ozd'];
const keys = [
    '01webzen#@!0', 'webzen#@!01', '0123456789ABCDEF',
    'webzen#@!01webzen#@!01', 'webzen#@!01webzen#@!01webzen#@!0',
    'webzen#@!0', '1webzen#@!0', 'webzen',
    '', 'bg_field01', 'card_bg', 'muonline',
    'kor', 'KOR', 'BRA', 'image', 'picture'
];

inputs.forEach(file => {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file);
    const block = content.slice(0, 16);

    console.log(`Checking ${file}...`);

    keys.forEach(k => {
        const paddings = ['NULL', 'SPACE', 'REPEAT'];
        paddings.forEach(padType => {
            let keyBytes = new Uint8Array(16);

            if (padType === 'REPEAT') {
                let repeated = k;
                while (repeated.length < 16 && repeated.length > 0) repeated += k;
                if (repeated.length > 0) {
                    for (let i = 0; i < 16; i++) keyBytes[i] = repeated.charCodeAt(i);
                }
            } else {
                const padChar = padType === 'SPACE' ? 32 : 0;
                keyBytes.fill(padChar);
                for (let i = 0; i < k.length && i < 16; i++) keyBytes[i] = k.charCodeAt(i);
            }

            try {
                const mars = new MARS(sbox, keyBytes);
                const decrypted = mars.decryptBlock(block);

                // Check for DDS signature: 44 44 53 20
                if (decrypted[0] === 0x44 && decrypted[1] === 0x44 && decrypted[2] === 0x53) {
                    console.log(`SUCCESS! Key found: "${k}" with padding ${padType}`);
                    console.log("Decrypted first 16 bytes:", decrypted);
                    process.exit(0);
                }
            } catch (e) { }
        });
    });
});
console.log('Done scanning.');
