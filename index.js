const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { copySync } = require('fs-extra');
const pm = require('./Lib/index');

function allSubdirsOf(base = '.') {
    const subdirs = fs.readdirSync(base).filter(file => {
        const filePath = path.join(base, file);
        return fs.statSync(filePath).isDirectory();
    });
    return subdirs.map(dir => path.join(base, dir));
}

const ip = "0.0.0.0";
const port = 8080;

const papka = process.cwd(); 

process.chdir(path.join(papka, "Patch"));

console.log('Please wait until the patcher finishes running\n');
pm.make().then(() => {
    console.log("DPDone.");

    process.chdir(papka);

    const patchFolderBase = path.join(papka, "Patch", "Patchs");
    const allSubdirs = allSubdirsOf(patchFolderBase);
    
    if (allSubdirs.length === 0) {
        throw new Error(`No subdirectories found in ${patchFolderBase}`);
    }
    
    const patchFolder = allSubdirs.reduce((latest, dir) => {
        return fs.statSync(dir).ctime > fs.statSync(latest).ctime ? dir : latest;
    }, allSubdirs[0]);

    const latestFinger = path.join(patchFolder, 'fingerprint.json');

    if (!fs.existsSync(latestFinger)) {
        throw new Error(`File not found: ${latestFinger}`);
    }

    const parent = path.dirname(papka); // papka :3

    copySync(latestFinger, path.join(parent, 'GameAssets'));

    process.chdir(patchFolderBase); 
    const handler = http.createServer((req, res) => {
        const filePath = path.join(process.cwd(), req.url === '/' ? 'index.html' : req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end(JSON.stringify(err));
                return;
            }
            res.writeHead(200);
            res.end(data);
        });
    });

    handler.listen(port, ip, () => {
        const hostName = os.hostname();
        const hostIp = Object.values(os.networkInterfaces()).flat().find(i => i.family === 'IPv4' && !i.internal).address;

        console.log(`\nPatching HTTP server started at URL \nhttp://${hostIp}:${port}/\n`);
    });
}).catch((error) => {
    console.error(`Error: ${error.message}`);
});
