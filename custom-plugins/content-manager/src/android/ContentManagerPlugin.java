package net.justin_credible.theweek;

import android.content.Context;
import android.content.pm.LauncherApps;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.text.MessageFormat;
import java.util.HashMap;
import java.util.Map;

public final class ContentManagerPlugin extends CordovaPlugin {

    private String baseContentURL;
    private DownloadTask currentDownloadTask;
    private DownloadStatus currentDownloadStatus = new DownloadStatus();
    private DownloadResult lastDownloadResult;

    //region Plugin Entry Point

    @Override
    public synchronized boolean execute(String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        if (action == null) {
            return false;
        }

        if (action.equals("setContentBaseURL")) {

            try {
                this.setContentBaseURL(args, callbackContext);
            }
            catch (Exception exception) {
                callbackContext.error("ContentManagerPlugin.setContentBaseURL() uncaught exception: " + exception.getMessage());
            }

            return true;
        }
        else if (action.equals("getDownloadedIssues")) {

            try {
                this.getDownloadedIssues(callbackContext);
            }
            catch (Exception exception) {
                callbackContext.error("ContentManagerPlugin.getDownloadedIssues() uncaught exception: " + exception.getMessage());
            }

            return true;
        }
        else if (action.equals("downloadIssue")) {

            try {
                this.downloadIssue(args, callbackContext);
            }
            catch (Exception exception) {
                callbackContext.error("ContentManagerPlugin.downloadIssue() uncaught exception: " + exception.getMessage());
            }

            return true;
        }
        else if (action.equals("cancelDownload")) {

            try {
                this.cancelDownload(callbackContext);
            }
            catch (Exception exception) {
                callbackContext.error("ContentManagerPlugin.cancelDownload() uncaught exception: " + exception.getMessage());
            }

            return true;
        }
        else if (action.equals("getDownloadStatus")) {

            try {
                this.getDownloadStatus(callbackContext);
            }
            catch (Exception exception) {
                callbackContext.error("ContentManagerPlugin.getDownloadStatus() uncaught exception: " + exception.getMessage());
            }

            return true;
        }
        else if (action.equals("getLastDownloadResult")) {

            try {
                this.getLastDownloadResult(callbackContext);
            }
            catch (Exception exception) {
                callbackContext.error("ContentManagerPlugin.getLastDownloadResult() uncaught exception: " + exception.getMessage());
            }

            return true;
        }
        else if (action.equals("deleteIssue")) {

            try {
                this.deleteIssue(args, callbackContext);
            }
            catch (Exception exception) {
                callbackContext.error("ContentManagerPlugin.deleteIssue() uncaught exception: " + exception.getMessage());
            }

            return true;
        }
        else if (action.equals("getIssueContentXML")) {

            try {
                this.getIssueContentXML(args, callbackContext);
            }
            catch (Exception exception) {
                callbackContext.error("ContentManagerPlugin.getIssueContentXML() uncaught exception: " + exception.getMessage());
            }

            return true;
        }
        else if (action.equals("getCoverImageFilePath")) {

            try {
                this.getCoverImageFilePath(args, callbackContext);
            }
            catch (Exception exception) {
                callbackContext.error("ContentManagerPlugin.getCoverImageFilePath() uncaught exception: " + exception.getMessage());
            }

            return true;
        }
        else if (action.equals("getDownloadedIssuesSize")) {

            try {
                this.getDownloadedIssuesSize(callbackContext);
            }
            catch (Exception exception) {
                callbackContext.error("ContentManagerPlugin.getDownloadedIssuesSize() uncaught exception: " + exception.getMessage());
            }

            return true;
        }
        else if (action.equals("deleteAllDownloadedIssues")) {

            try {
                this.deleteAllDownloadedIssues(callbackContext);
            }
            catch (Exception exception) {
                callbackContext.error("ContentManagerPlugin.deleteAllDownloadedIssues() uncaught exception: " + exception.getMessage());
            }

            return true;
        }
        else {
            // The given action was not handled above.
            return false;
        }
    }

    //endregion

    //region Plugin Methods

    private synchronized void setContentBaseURL(final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        String baseContentURL = args.getString(0);

        if (baseContentURL == null || baseContentURL.equals("")) {
            callbackContext.error("A URL is required.");
            return;
        }

        this.baseContentURL = baseContentURL;

        callbackContext.success();
    }

    private synchronized void getDownloadedIssues(final CallbackContext callbackContext) throws JSONException {

        JSONArray array = new JSONArray();

        Context appContext = this.cordova.getActivity().getApplicationContext();
        String baseStorageDir = appContext.getFilesDir().toString();

        String issuesDirPath = Utilities.combinePaths(baseStorageDir, "issues");

        File issuesDir = new File(issuesDirPath);

        if (!issuesDir.exists() || !issuesDir.isDirectory()) {
            callbackContext.success(array);
            return;
        }

        for (File childFile : issuesDir.listFiles()) {

            if (!childFile.isDirectory()) {
                continue;
            }

            String completeTagPath = Utilities.combinePaths(childFile.getAbsolutePath(), "complete.id");

            File completeTagFile = new File(completeTagPath);

            JSONObject issue = new JSONObject();
            issue.put("id", childFile.getName());
            issue.put("ok", completeTagFile.exists());

            array.put(issue);
        }

        callbackContext.success(array);
    }

    private synchronized void downloadIssue(final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        if (baseContentURL == null) {
            callbackContext.error("A content base URL must be set using setContentBaseURL before invoking this method.");
            return;
        }

        if (currentDownloadTask != null) {
            callbackContext.error("Another download is already in progress.");
            return;
        }

        String id = args.getString(0);

        // Create an initial status so there is something to return if the client queries for
        // the status before the download task has gotten to do any work.
        currentDownloadStatus = new DownloadStatus();
        currentDownloadStatus.inProgress = true;
        currentDownloadStatus.id = id;
        currentDownloadStatus.statusText = "Starting";
        currentDownloadStatus.percentage = 0;

        currentDownloadTask = new DownloadTask() {

            @Override
            protected void onProgressUpdate(DownloadStatus... status) {
                currentDownloadStatus = status[0];
            }

            @Override
            protected void onPostExecute(DownloadResult result) {
                currentDownloadTask = null;
                currentDownloadStatus = new DownloadStatus();
                lastDownloadResult = result;
            }

            @Override
            protected void onCancelled() {
                currentDownloadTask = null;
                currentDownloadStatus = new DownloadStatus();
                lastDownloadResult = new DownloadResult("Download was cancelled.");
                lastDownloadResult.cancelled = true;
            }
        };

        Context appContext = this.cordova.getActivity().getApplicationContext();

        currentDownloadTask.setBaseStorageDir(appContext.getFilesDir().toString());
        currentDownloadTask.setBaseContentURL(baseContentURL);

        try {
            currentDownloadTask.execute(id);
        }
        catch (Exception exception) {

            currentDownloadTask = null;
            currentDownloadStatus = new DownloadStatus();

            callbackContext.error("An error occurred while starting the download: " + exception.getMessage());

            return;
        }

        callbackContext.success();
    }

    private synchronized void cancelDownload(final CallbackContext callbackContext) throws JSONException {

        if (currentDownloadTask == null) {
            callbackContext.error("A download is not currently in progress.");
            return;
        }

        currentDownloadTask.cancel(true);

        callbackContext.success();
    }

    private synchronized void getDownloadStatus(final CallbackContext callbackContext) throws JSONException {

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("inProgress", currentDownloadStatus.inProgress);
        resultMap.put("id", currentDownloadStatus.id);
        resultMap.put("statusText", currentDownloadStatus.statusText);
        resultMap.put("percentage", currentDownloadStatus.percentage);

        callbackContext.success(new JSONObject(resultMap));
    }

    private synchronized void getLastDownloadResult(final CallbackContext callbackContext) throws JSONException {

        if (lastDownloadResult == null) {
            callbackContext.success();
        }

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("message", lastDownloadResult.message);
        resultMap.put("success", lastDownloadResult.success);
        resultMap.put("cancelled", lastDownloadResult.cancelled);

        callbackContext.success(new JSONObject(resultMap));
    }

    private synchronized void deleteIssue(final JSONArray args, final CallbackContext callbackContext) throws Exception {

        String id = args.getString(0);

        if (id == null || id.equals("")) {
            callbackContext.error("An issue ID is required to delete an issue.");
            return;
        }

        Context appContext = this.cordova.getActivity().getApplicationContext();
        String baseStorageDir = appContext.getFilesDir().toString();

        String issueDirPath = Utilities.combinePaths(baseStorageDir, "issues");
        issueDirPath = Utilities.combinePaths(issueDirPath, id);

        File issueDir = new File(issueDirPath);

        if (!issueDir.exists() || !issueDir.isDirectory()) {
            callbackContext.error(MessageFormat.format("An issue directory for ID '{0}' was not found.", id));
            return;
        }

        Utilities.deleteDir(issueDir);

        callbackContext.success();
    }

    private synchronized void getIssueContentXML(final JSONArray args, final CallbackContext callbackContext) throws Exception {

        String id = args.getString(0);

        if (id == null || id.equals("")) {
            callbackContext.error("An issue ID is required to retrieve content XML for an issue.");
            return;
        }

        Context appContext = this.cordova.getActivity().getApplicationContext();
        String baseStorageDir = appContext.getFilesDir().toString();

        String issueDirPath = Utilities.combinePaths(baseStorageDir, "issues");
        issueDirPath = Utilities.combinePaths(issueDirPath, id);

        File issueDir = new File(issueDirPath);

        if (!issueDir.exists() || !issueDir.isDirectory()) {
            callbackContext.error(MessageFormat.format("An issue with ID '{0}' was not found.", id));
            return;
        }

        String contentXMLPath = Utilities.combinePaths(issueDirPath, "content.xml");
        File contentXMLFile = new File(contentXMLPath);

        if (!contentXMLFile.exists()) {
            callbackContext.error(MessageFormat.format("An content.xml manifest for issue with ID '{0}' was not found.", id));
            return;
        }

        String contentXML = Utilities.readFile(contentXMLPath);

        callbackContext.success(contentXML);
    }

    private synchronized void getCoverImageFilePath(final JSONArray args, final CallbackContext callbackContext) throws Exception {

        final String issueID = args.getString(0);

        if (issueID == null || issueID.equals("")) {
            callbackContext.error("An issue ID is required to retrieve a cover image file path for an issue.");
            return;
        }

        Context appContext = this.cordova.getActivity().getApplicationContext();
        String baseStorageDir = appContext.getFilesDir().toString();

        String issuesDirPath = Utilities.combinePaths(baseStorageDir, "issues");
        final String issueDirPath = Utilities.combinePaths(issuesDirPath, issueID);

        File issueDir = new File(issueDirPath);

        if (!issueDir.exists() || !issueDir.isDirectory()) {
            callbackContext.error(MessageFormat.format("An issue with ID '{0}' was not found.", issueID));
            return;
        }

        final String contentXMLPath = Utilities.combinePaths(issueDirPath, "content.xml");
        File contentXMLFile = new File(contentXMLPath);

        if (!contentXMLFile.exists()) {
            callbackContext.error(MessageFormat.format("An content.xml manifest for issue with ID '{0}' was not found.", issueID));
            return;
        }

        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    String contentXML = Utilities.readFile(contentXMLPath);

                    String coverPageID = Utilities.getCoverPageID(contentXML);

                    String pagePath = MessageFormat.format("editions/{0}/data/{1}", issueID, coverPageID);
                    String searchPath = Utilities.combinePaths(issueDirPath, pagePath);

                    String imagePath = Utilities.findFileWithExtension(searchPath, "jpg");

                    callbackContext.success(imagePath);
                }
                catch (Exception exception) {
                    callbackContext.error("ContentManagerPlugin.getCoverImageFilePath() exception during image path acquisition: " + exception.getMessage());
                }
            }
        });
    }

    private synchronized void getDownloadedIssuesSize(final CallbackContext callbackContext) throws Exception {

        Context appContext = this.cordova.getActivity().getApplicationContext();
        String baseStorageDir = appContext.getFilesDir().toString();

        String issuesDirPath = Utilities.combinePaths(baseStorageDir, "issues");
        File issuesDir = new File(issuesDirPath);

        if (!issuesDir.exists() || !issuesDir.isDirectory()) {
            callbackContext.success(0);
            return;
        }

        long totalSize = Utilities.getFileSize(issuesDir);

        callbackContext.success((int)totalSize);
    }


    private synchronized void deleteAllDownloadedIssues(final CallbackContext callbackContext) throws Exception {

        if (currentDownloadStatus != null && currentDownloadStatus.inProgress) {
            callbackContext.error("Cannot delete all issues because a download is currently in progress.");
            return;
        }

        Context appContext = this.cordova.getActivity().getApplicationContext();
        String baseStorageDir = appContext.getFilesDir().toString();

        String issuesDirPath = Utilities.combinePaths(baseStorageDir, "issues");
        final File issuesDir = new File(issuesDirPath);

        if (!issuesDir.exists()) {
            callbackContext.success();
            return;
        }

        cordova.getThreadPool().execute(new Runnable() {
            public void run() {
                try {
                    Utilities.deleteDir(issuesDir);
                    callbackContext.success();
                }
                catch (Exception exception) {
                    callbackContext.error("ContentManagerPlugin.deleteAllDownloadedIssues() exception during deletion: " + exception.getMessage());
                }
            }
        });
    }

    //endregion
}
