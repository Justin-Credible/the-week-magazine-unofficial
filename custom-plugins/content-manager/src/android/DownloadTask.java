package net.justin_credible.theweek;

import android.os.AsyncTask;

public class DownloadTask extends AsyncTask<String, DownloadStatus, Boolean> {

    private String baseStorageDir;
    private String baseContentURL;

    public void setBaseStorageDir(String baseStorageDir) {
        this.baseStorageDir = baseStorageDir;
    }

    public void setBaseContentURL(String baseContentURL) {
        this.baseContentURL = baseContentURL;
    }

    @Override
    protected Boolean doInBackground(String... params) {

        // It is possible the user cancelled before the task even kicked off.
        if (this.isCancelled()) {
            return false;
        }

        // The is the ID of the issue we want to download.
        String id = params[0];

        // Publish the initial status update.

        DownloadStatus status = new DownloadStatus();
        status.inProgress = true;
        status.id = id;
        status.statusText = "Starting";
        status.percentage = 0;

        this.publishProgress(status);

        // TODO: Create issue directory: issues/id (delete if already exists?)

        // TODO: Retrieve content.xml

        // TODO: Write issues/id/content.xml

        // TODO: Read content.xml into queryable document

        // TODO: Get shared theme from first entry node and download

        // TODO: Loop over entry nodes

            // TODO: Download article zip to issues/id/parts

        // TODO: Loop over each zip in issues/id/parts and extract to issues/id/

        // TODO: Write empty file to issues/id/complete.id

        status.percentage = 100;
        status.statusText = "Complete";
        this.publishProgress(status);

        return true;
    }
}
