package net.justin_credible.theweek;

import android.os.AsyncTask;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.text.MessageFormat;

public class DownloadTask extends AsyncTask<String, DownloadStatus, DownloadResult> {

    private String baseStorageDir;
    private String baseContentURL;

    public void setBaseStorageDir(String baseStorageDir) {
        this.baseStorageDir = baseStorageDir;
    }

    public void setBaseContentURL(String baseContentURL) {
        this.baseContentURL = baseContentURL;
    }

    @Override
    protected DownloadResult doInBackground(String... params) {

        try {
            // It is possible the user cancelled before the task even kicked off.
            if (this.isCancelled()) {
                DownloadResult result = new DownloadResult("Download was cancelled before it started.");
                result.cancelled = true;
                return result;
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

            // Create the directory for this issue.
            // If the directory already exists from a failed download, delete it first.

            String issuePath = combinePaths(baseStorageDir, id);

            File issueDir = new File(issuePath);

            if (issueDir.isDirectory() && issueDir.exists()) {
                Boolean deleteSuccess = issueDir.delete();

                if (!deleteSuccess) {
                    return new DownloadResult(MessageFormat.format("Unable to delete existing directory: {0}", issueDir));
                }
            }

            Boolean createDirSuccess = issueDir.mkdirs();

            if (!createDirSuccess) {
                return new DownloadResult(MessageFormat.format("Unable to create directory: {0}", issueDir));
            }

            // Download the content.xml file for the issue.

            String userAgent = "PugpigNetwork 2.7.1, 1301 (iPhone, iOS 10.2) on phone";
            String xmlURL = MessageFormat.format("{0}/editions/{1}/content.xml", baseContentURL, id);
            String xml;

            try {
                xml = httpGet(xmlURL, userAgent);
            }
            catch (Exception exception) {

                String message = MessageFormat.format("An exception occurred during an HTTP request to: {0}\nException Message: {1}", xmlURL, exception.getMessage());

                DownloadResult result = new DownloadResult(message);
                result.cancelled = false;
                result.success = false;

                return result;
            }

            // We should have received the XML body at this point.
            if (xml == null || xml.equals("")) {

                String message = MessageFormat.format("No XML content was retrieved during a HTTP GET to: {0}", xmlURL);

                DownloadResult result = new DownloadResult(message);
                result.cancelled = false;
                result.success = false;

                return result;
            }

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

            DownloadResult result = new DownloadResult("Download complete!");
            result.cancelled = false;
            result.success = true;

            return result;
        }
        catch (Exception exception) {

            String message = MessageFormat.format("An unhandled exception occurred: {0}", exception.getMessage());

            DownloadResult result = new DownloadResult(message);
            result.cancelled = false;
            result.success = false;

            return result;
        }
    }

    /**
     * A quick and dirty way to combines two path fragments.
     *
     * @param path1
     * @param path2
     * @return The combination of the two paths.
     */
    private String combinePaths(String path1, String path2)
    {
        File file1 = new File(path1);
        File file2 = new File(file1, path2);

        return file2.getPath();
    }

    /**
     * Reads the stream into a single stream. Seriously.
     *
     * @param stream
     * @return
     * @throws IOException
     */
    private String readStream(InputStream stream) throws IOException {

        // It's 2017 and I cannot believe I have to implement a readline loop myself...
        // http://stackoverflow.com/a/2549222

        BufferedReader reader = new BufferedReader(new InputStreamReader(stream));
        StringBuilder result = new StringBuilder();
        String line;

        while((line = reader.readLine()) != null) {
            result.append(line);
        }

        return result.toString();
    }

    /**
     * Used to perform an HTTP get and retrieve it's response body.
     *
     * @param url The URL of the resource to request with a HTTP GET.
     * @return The response body as a string.
     * @throws Exception
     */
    private String httpGet(String url, String userAgent) throws Exception {

        URLConnection connection = new URL(url).openConnection();
        connection.setRequestProperty("User-Agent", userAgent);

        HttpURLConnection httpConnection = (HttpURLConnection) connection;
        int responseCode = httpConnection.getResponseCode();

        if (responseCode != 200) {
            String message = MessageFormat.format("A non-200 status code was encountered ({0}) when requesting the URL: {1}", responseCode, url);
            throw new Exception(message);
        }

        InputStream stream = connection.getInputStream();

        String content = readStream(stream);

        return content;
    }
}
