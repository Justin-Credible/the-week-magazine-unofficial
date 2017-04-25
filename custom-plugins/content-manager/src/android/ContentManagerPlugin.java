package net.justin_credible.theweek;

import android.content.Context;
import android.content.Intent;
import android.support.v4.app.NotificationManagerCompat;

import com.google.android.gms.analytics.GoogleAnalytics;
import com.google.android.gms.analytics.HitBuilders;
import com.google.android.gms.analytics.Logger;
import com.google.android.gms.analytics.Tracker;
import com.google.android.gms.analytics.ecommerce.Product;
import com.google.android.gms.analytics.ecommerce.ProductAction;
import com.google.android.gms.analytics.ecommerce.Promotion;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public final class ContentManagerPlugin extends CordovaPlugin {

    //region Plugin Entry Point

    @Override
    public synchronized boolean execute(String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        if (action == null) {
            return false;
        }

        if (action.equals("getDownloadedIssues")) {

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

    private synchronized void getDownloadedIssues(final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        // Map<String, Object> resultMap = new HashMap<String, Object>();
        // resultMap.put("android", nestedResultMap);

        // callbackContext.success(new JSONObject(resultMap));

        callbackContext.error("TODO: Not implemented.");
    }

    private synchronized void downloadIssue(final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        callbackContext.error("TODO: Not implemented.");
    }

    private synchronized void getDownloadStatus(final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        callbackContext.error("TODO: Not implemented.");
    }

    private synchronized void deleteIssue(final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        callbackContext.error("TODO: Not implemented.");
    }

    private synchronized void getIssueContentXML(final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        callbackContext.error("TODO: Not implemented.");
    }

    //endregion
}
