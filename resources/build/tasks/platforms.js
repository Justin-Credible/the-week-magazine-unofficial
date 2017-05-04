
// Native Node Modules
var fs = require("fs");
var path = require("path");

// Other Node Modules
var helper = require("./helper");
var sh = require("shelljs");

/**
 * Used to execute "cordova prepare PLATFORM" for each of the platforms.
 */
module.exports = function(gulp, plugins) {

    return function(cb) {

        if (helper.isPrepChrome() || helper.isPrepWeb()) {
            helper.info("Skipping cordova prepare because --prep web or --prep chrome was specified.");
            return;
        }

        var cordovaBin = path.join("node_modules", ".bin", "cordova");
        var installedPlatforms = helper.getDirectories("platforms");
        var prepareCommands = [];

        for (var i = 0; i < installedPlatforms.length; i++) {
            prepareCommands.push(cordovaBin + " prepare " + installedPlatforms[i]);
        }

        // Concatenate each of the commands together with && so we can run them in a single command.
        var command = prepareCommands.join("&&");

        helper.info("Running '" + command + "' to ensure all built web artifacts make it into the platform directories...");

        var result = sh.exec(command);

        if (result.code !== 0) {
            cb(new Error(result.output));
            return;
        }
    };
};
