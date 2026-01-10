const fs = require('fs');
const path = require('path');

const extractStrings = (filePath, minLength = 4) => { // Reduced minLength to 4
    try {
        const buffer = fs.readFileSync(filePath);
        let currentString = '';
        const strings = [];

        for (let i = 0; i < buffer.length; i++) {
            const byte = buffer[i];
            // ASCII printable characters (32-126)
            if (byte >= 32 && byte <= 126) {
                currentString += String.fromCharCode(byte);
            } else {
                if (currentString.length >= minLength) {
                    // Filter: Must contain letters, not just numbers/symbols
                    if (/[a-zA-Z]/.test(currentString) && currentString.length < 100) {
                        strings.push(currentString);
                    }
                }
                currentString = '';
            }
        }

        if (currentString.length >= minLength) {
            if (/[a-zA-Z]/.test(currentString) && currentString.length < 100) {
                strings.push(currentString);
            }
        }

        return strings;
    } catch (error) {
        console.error(`Error reading file: ${error.message}`);
        return [];
    }
};

const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Usage: node extract_strings.js <file1> <file2> ...');
} else {
    args.forEach(file => {
        const strings = extractStrings(file);
        const uniqueStrings = [...new Set(strings)];
        const outputFile = path.basename(file) + '_strings.txt';
        fs.writeFileSync(outputFile, uniqueStrings.join('\n'), 'utf8');
        console.log(`Extracted ${uniqueStrings.length} strings from ${file} to ${outputFile}`);
    });
}
