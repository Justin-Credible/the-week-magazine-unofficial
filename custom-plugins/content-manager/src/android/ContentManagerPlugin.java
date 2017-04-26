package net.justin_credible.theweek;

import android.content.Context;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public final class ContentManagerPlugin extends CordovaPlugin {

    private String baseContentURL;
    private DownloadTask currentDownloadTask;
    private DownloadStatus currentDownloadStatus = new DownloadStatus();

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
                this.getDownloadedIssues(args, callbackContext);
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
                this.cancelDownload(args, callbackContext);
            }
            catch (Exception exception) {
                callbackContext.error("ContentManagerPlugin.cancelDownload() uncaught exception: " + exception.getMessage());
            }

            return true;
        }
        else if (action.equals("getDownloadStatus")) {

            try {
                this.getDownloadStatus(args, callbackContext);
            }
            catch (Exception exception) {
                callbackContext.error("ContentManagerPlugin.getDownloadStatus() uncaught exception: " + exception.getMessage());
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
    }

    private synchronized void getDownloadedIssues(final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        callbackContext.error("TODO: Not implemented.");
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
            protected void onPostExecute(Boolean success) {
                currentDownloadTask = null;
                currentDownloadStatus = new DownloadStatus();
            }

            @Override
            protected void onCancelled() {
                currentDownloadTask = null;
                currentDownloadStatus = new DownloadStatus();
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

    private synchronized void cancelDownload(final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        if (currentDownloadTask == null) {
            callbackContext.error("A download is not currently in progress.");
            return;
        }

        currentDownloadTask.cancel(true);

        callbackContext.success();
    }

    private synchronized void getDownloadStatus(final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        Map<String, Object> resultMap = new HashMap<String, Object>();
        resultMap.put("inProgress", currentDownloadStatus.inProgress);
        resultMap.put("id", currentDownloadStatus.id);
        resultMap.put("statusText", currentDownloadStatus.statusText);
        resultMap.put("percentage", currentDownloadStatus.percentage);

        callbackContext.success(new JSONObject(resultMap));
    }

    private synchronized void deleteIssue(final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        callbackContext.error("TODO: Not implemented.");
    }

    private synchronized void getIssueContentXML(final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        callbackContext.error("TODO: Not implemented.");
    }

    //endregion
}
