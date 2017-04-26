package net.justin_credible.theweek;

import android.os.AsyncTask;

public class DownloadTask extends AsyncTask<String, DownloadStatus, Boolean> {

    private String baseContentURL;

    public void setBaseContentURL(String baseContentURL) {
        this.baseContentURL = baseContentURL;
    }

    @Override
    protected Boolean doInBackground(String... params) {
        return null;
    }
}
