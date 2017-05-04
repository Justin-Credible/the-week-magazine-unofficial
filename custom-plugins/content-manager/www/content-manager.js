"use strict";

var exec = require("cordova/exec");

/**
 * The Cordova plugin ID for this plugin.
 */
var PLUGIN_ID = "ContentManagerPlugin";

/**
 * The plugin which will be exported and exposed in the global scope.
 */
var ContentManagerPlugin = {};

/**
 * Used to set the base URL used for retrieving magazine content.
 * 
 * @param string baseURL - The base URL to use for retrieving magazine content.
 * @param [function] successCallback - The success callback for this asynchronous function.
 * @param [function] failureCallback - The failure callback for this asynchronous function; receives an error string.
 */
ContentManagerPlugin.setContentBaseURL = function setContentBaseURL(baseURL, successCallback, failureCallback) {

    if (typeof(baseURL) !== "string") {

        if (failureCallback) {
            failureCallback(new Error("An base URL is required."));
        }

        return;
    }

    exec(successCallback, failureCallback, PLUGIN_ID, "setContentBaseURL", [ baseURL ]);
};

/**
 * Used to get a list of issues that have been downloaded to the device.
 * 
 * @param [function] successCallback - The success callback for this asynchronous function.
 * @param [function] failureCallback - The failure callback for this asynchronous function; receives an error string.
 */
ContentManagerPlugin.getDownloadedIssues = function getDownloadedIssues(successCallback, failureCallback) {

    exec(successCallback, failureCallback, PLUGIN_ID, "getDownloadedIssues", []);
};

/**
 * Used to start a background download of the given issue.
 * 
 * @param string id - The ID of the issue to download.
 * @param [function] successCallback - The success callback for this asynchronous function.
 * @param [function] failureCallback - The failure callback for this asynchronous function; receives an error string.
 */
ContentManagerPlugin.downloadIssue = function downloadIssue(id, successCallback, failureCallback) {

    if (typeof(id) !== "string") {

        if (failureCallback) {
            failureCallback(new Error("An issue ID is required."));
        }

        return;
    }

    exec(successCallback, failureCallback, PLUGIN_ID, "downloadIssue", [ id ]);
};

/**
 * Used to cancel the current background download.
 * 
 * @param [function] successCallback - The success callback for this asynchronous function.
 * @param [function] failureCallback - The failure callback for this asynchronous function; receives an error string.
 */
ContentManagerPlugin.cancelDownload = function cancelDownload(successCallback, failureCallback) {

    exec(successCallback, failureCallback, PLUGIN_ID, "cancelDownload", [ id ]);
};

/**
 * Used to check the background download status.
 * 
 * @param [function] successCallback - The success callback for this asynchronous function.
 * @param [function] failureCallback - The failure callback for this asynchronous function; receives an error string.
 */
ContentManagerPlugin.getDownloadStatus = function getDownloadStatus(successCallback, failureCallback) {

    exec(successCallback, failureCallback, PLUGIN_ID, "getDownloadStatus", []);
};

/**
 * Used to check the result of the last download.
 * 
 * @param [function] successCallback - The success callback for this asynchronous function.
 * @param [function] failureCallback - The failure callback for this asynchronous function; receives an error string.
 */
ContentManagerPlugin.getLastDownloadResult = function getLastDownloadResult(successCallback, failureCallback) {

    exec(successCallback, failureCallback, PLUGIN_ID, "getLastDownloadResult", []);
};

/**
 * Used to remove the given issue from the device.
 * 
 * @param string id - The ID of the issue to delete.
 * @param [function] successCallback - The success callback for this asynchronous function.
 * @param [function] failureCallback - The failure callback for this asynchronous function; receives an error string.
 */
ContentManagerPlugin.deleteIssue = function deleteIssue(id, successCallback, failureCallback) {

    if (typeof(id) !== "string") {

        if (failureCallback) {
            failureCallback(new Error("An issue ID is required."));
        }

        return;
    }

    exec(successCallback, failureCallback, PLUGIN_ID, "deleteIssue", [ id ]);
};

/**
 * Used to retrieve the XML manifest data for a given issue.
 * 
 * @param string id - The ID of the issue to retrieve the content manifest for.
 * @param [function] successCallback - The success callback for this asynchronous function.
 * @param [function] failureCallback - The failure callback for this asynchronous function; receives an error string.
 */
ContentManagerPlugin.getIssueContentXML = function getIssueContentXML(id, successCallback, failureCallback) {

    if (typeof(id) !== "string") {

        if (failureCallback) {
            failureCallback(new Error("An issue ID is required."));
        }

        return;
    }

    exec(successCallback, failureCallback, PLUGIN_ID, "getIssueContentXML", [ id ]);
};

module.exports = ContentManagerPlugin;
