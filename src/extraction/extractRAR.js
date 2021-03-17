const { unrar } = require('unrar-promise');

const extract = async (file) => {
    try {
        await unrar(file.source, file.tempFolders.pages);
    } catch {
        throw new Error(`Unable to extract file '${file.source}'`);
    }
}

module.exports = { extract }