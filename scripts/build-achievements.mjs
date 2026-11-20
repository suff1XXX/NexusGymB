import {copyFileSync} from 'node:fs';

// Keep the browser catalogue identical to the server's scoring contract.
copyFileSync(new URL('../functions/lib/achievement-catalog.js',import.meta.url),new URL('../public/js/achievement-catalog.js',import.meta.url));
console.log('Achievement catalog synchronized.');
