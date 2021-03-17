const { unzip } = require('cross-unzip');

const extract = async (file) => {
    return new Promise((resolve, reject) => {
        unzip(file.source, file.tempFolders.pages, err => {
            if (err) {
                return reject(`Unable to extract file '${file.source}'`);
            }
            resolve();
        })
    })
}

module.exports = { extract }