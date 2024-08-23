const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const LZMA = require('lzma-native');
const { promisify } = require('util');
const zlib = require('zlib');
const compress = promisify(zlib.deflate);
const { copySync } = require('fs-extra');

const log = (...args) => {
    console.log('[INFO]', ...args);
};

const make = async () => {
    const backup = process.cwd();

    const FP = (arg) => {
        return arg.replace(/\\/g, '/').replace('Gamefiles\\/', '');
    };

    const iterateOver = (dirPath) => {
        const files = [];
        const readDir = (currentPath) => {
            const dirContents = fs.readdirSync(currentPath, { withFileTypes: true });
            dirContents.forEach((entry) => {
                const fullPath = path.join(currentPath, entry.name);
                if (entry.isFile() && entry.name !== 'fingerprint.json') {
                    files.push(fullPath);
                } else if (entry.isDirectory()) {
                    readDir(fullPath);
                }
            });
        };
        readDir(dirPath);
        return files;
    };

    const shash = (input) => {
        return crypto.createHash('sha1').update(input).digest('hex');
    };

    const masterHasher = () => {
        const time = String(Math.floor(Date.now() / 1000));
        return shash(Buffer.from(time));
    };

    const MH = masterHasher();
    const base = {
        files: [],
        sha: MH,
        version: `20.93.${Math.floor(Math.random() * 9) + 1}`
    };

    log(`MasterHash is ${MH}\n`);

    const allFiles = iterateOver('Gamefiles');

    for (const file of allFiles) {
        log(`Processing ${file} ...`);
        let fileContent;
        if (file.endsWith('.csv')) {
            fileContent = await compress(fs.readFileSync(file));
        } else {
            fileContent = fs.readFileSync(file);
        }

        const sha = shash(fileContent);
        base.files.push({ file: FP(file), sha: sha });
    }

    process.chdir('Patchs');
    copySync(`${backup}/Gamefiles`, `${process.cwd()}/${MH}`);
    process.chdir(MH);

    const newFiles = iterateOver('./');

    for (const file of newFiles) {
        if (file.endsWith('.csv')) {
            const fileContent = await compress(fs.readFileSync(file));
            fs.writeFileSync(file, fileContent);
        } else {
            log(`Skipping compression for ${file}`);
        }
    }

    fs.writeFileSync('fingerprint.json', JSON.stringify(base, null, 2));
};

module.exports = { make };
if (require.main === module) {
    make().catch((error) => {
        console.error(`[ERROR] ${error}`);
    });
}
