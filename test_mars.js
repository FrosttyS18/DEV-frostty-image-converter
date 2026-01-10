const CryptoJS = require('crypto-js');

try {
    console.log('Checking for MARS...');
    if (CryptoJS.MARS) {
        console.log('MARS found in CryptoJS!');
    } else {
        console.log('MARS NOT found in CryptoJS (standard build).');
        console.log('Available algos:', Object.keys(CryptoJS).filter(k => k !== 'lib' && k !== 'mode' && k !== 'pad' && k !== 'enc' && k !== 'algo'));
    }
} catch (e) {
    console.error(e);
}
