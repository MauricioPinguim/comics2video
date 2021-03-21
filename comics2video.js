/**
 * comics2video - Converts Comic Book files to videos to be watched on TV/Video players
 *
 * @author   Maurício Antunes Oliveira <mauricio_pinguim@hotmail.com>
 * @license  Apache-2.0
 * 
 * https://github.com/MauricioPinguim/comics2video
 */

const dependencies = require('./src/util/dependencies');

if (dependencies.checkDependencies()) {
    if (dependencies.availableFeatures.wizard) {
        const indexWizard = require('./src/terminal/terminalWizard');
        indexWizard.start().then(r => {
            process.exit();
        });
    } else {
        const indexBasic = require('./src/terminal/terminalBasic');
        indexBasic.start().then();
    }
}