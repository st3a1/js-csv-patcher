const lzma = require('lzma-native');
const crypto = require('crypto');

function len2bytes(datalen, maxLen = 4) {
    const data = [];
    while (datalen > 0) {
        const item = datalen % 256;
        datalen = Math.floor(datalen / 256);
        data.push(item);
    }
    while (data.length < maxLen) {
        data.push(0);
    }
    return data;
}

function compress(data, maxLen = 4) {
    const filters = [
        {
            id: lzma.FILTER_LZMA1,
            dict_size: 256 * 1024,
            lc: 3,
            lp: 0,
            pb: 2,
            mode: lzma.MODE_NORMAL,
        },
    ];

    const compressedData = lzma.compress(Buffer.from(data), { filters, format: lzma.FORMAT_ALONE });
    const lzmadata = [];

    for (let i = 0; i < 5; i++) {
        lzmadata.push(compressedData[i]);
    }

    const dataSize = len2bytes(data.length, maxLen);

    for (const size of dataSize) {
        lzmadata.push(size);
    }

    for (let i = 13; i < compressedData.length; i++) {
        lzmadata.push(compressedData[i]);
    }

    return Buffer.from(lzmadata);
}

module.exports = { len2bytes, compress };
