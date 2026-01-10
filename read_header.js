const fs = require('fs');

const readHeader = (filePath, length = 64) => {
    try {
        const buffer = fs.readFileSync(filePath);
        const header = buffer.slice(0, length);
        console.log(`File: ${filePath}`);
        console.log('Hex:');
        console.log(header.toString('hex').match(/../g).join(' '));
        console.log('ASCII:');
        let ascii = '';
        for (const byte of header) {
            ascii += byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
        }
        console.log(ascii);
        console.log('-------------------');
    } catch (error) {
        console.error(`Error reading ${filePath}: ${error.message}`);
    }
};

const files = process.argv.slice(2);
files.forEach(f => readHeader(f));
