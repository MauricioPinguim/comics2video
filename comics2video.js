/**
 * comics2video - Converts Comic Book files to videos to be watched on TV/Video players
 *
 * @author   Maurício Antunes Oliveira <mauricio_pinguim@hotmail.com>
 * @license  Apache-2.0
 * 
 * https://github.com/MauricioPinguim/comics2video
 */

const dependencies = require('./src/util/dependencies');

(async () => {
    if (dependencies.checkDependencies()) {
        if (dependencies.availableFeatures.wizard) {
            const terminalWizard = require('./src/terminal/terminalWizard');
            await terminalWizard.start();
            process.exit();
        } else {
            const terminalBasic = require('./src/terminal/terminalBasic');
            await terminalBasic.start();
        }
    } else {
        dependencies.showDependenciesMessage();
    }
})();