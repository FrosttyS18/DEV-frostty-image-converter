const fs = require('fs');

const parseSBox = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const matches = content.match(/0x[0-9A-Fa-f]+/g);
    if (matches) {
        const sbox = matches.map(s => parseInt(s, 16));
        console.log(`Parsed ${sbox.length} entries.`);
        console.log(JSON.stringify(sbox));
    } else {
        console.log('No matches found');
    }
};

parseSBox('OZD conv.txt');
