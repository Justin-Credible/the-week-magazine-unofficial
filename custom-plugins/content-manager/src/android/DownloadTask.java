package net.justin_credible.theweek;

import android.os.AsyncTask;

import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.io.StringReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.MessageFormat;
import java.util.ArrayList;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipEntry;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPathFactory;
import javax.xml.xpath.*;

import org.xml.sax.InputSource;

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

            // *************************************************************************************
            // Parameter Setup

            // The is the ID of the issue we want to download.
            String id = params[0];

            // The user agent to use for all HTTP requests.
            String userAgent = "PugpigNetwork 2.7.1, 1301 (iPhone, iOS 10.2) on phone";

            // Publish the initial status update.

            DownloadStatus status = new DownloadStatus();
            status.inProgress = true;
            status.id = id;
            status.statusText = "Checking storage";
            status.percentage = 0;
            this.publishProgress(status);

            // *************************************************************************************
            // Setup Directories

            // If the directory already exists from a failed download, delete it first.

            String issueDirPath = combinePaths(baseStorageDir, "issues");
            issueDirPath = combinePaths(issueDirPath, id);

            File issueDir = new File(issueDirPath);

            if (issueDir.isDirectory() && issueDir.exists()) {
                Boolean deleteSuccess = issueDir.delete();

                if (!deleteSuccess) {
                    return new DownloadResult(MessageFormat.format("Unable to delete existing directory: {0}", issueDirPath));
                }
            }

            // Create the directory for the issue.

            Boolean createDirSuccess = issueDir.mkdirs();

            if (!createDirSuccess) {
                return new DownloadResult(MessageFormat.format("Unable to create issue directory: {0}", issueDirPath));
            }

            // Create the directory for the ZIP file downloads.

            String downloadDirPath = combinePaths(issueDirPath, "_downloads");
            File downloadDir = new File(downloadDirPath);

            if (downloadDir.isDirectory() && downloadDir.exists()) {
                Boolean deleteSuccess = downloadDir.delete();

                if (!deleteSuccess) {
                    return new DownloadResult(MessageFormat.format("Unable to delete existing directory: {0}", downloadDirPath));
                }
            }

            createDirSuccess = downloadDir.mkdirs();

            if (!createDirSuccess) {
                return new DownloadResult(MessageFormat.format("Unable to create download directory: {0}", downloadDirPath));
            }

            // *************************************************************************************
            // Download the content.xml file for the issue.

            if (this.isCancelled()) {
                DownloadResult result = new DownloadResult("Download was cancelled.");
                result.cancelled = true;
                return result;
            }

            status.statusText = "Retrieving issue manifest";
            status.percentage = 5;
            this.publishProgress(status);

            String xmlURL = MessageFormat.format("{0}/editions/{1}/content.xml", baseContentURL, id);
            String xml = httpGet(xmlURL, userAgent);

            // We should have received the XML body at this point.
            if (xml == null || xml.equals("")) {

                String message = MessageFormat.format("No XML content was retrieved during a HTTP GET to: {0}", xmlURL);

                DownloadResult result = new DownloadResult(message);
                result.cancelled = false;
                result.success = false;

                return result;
            }

            // *************************************************************************************
            // Write XML body to content.xml

            status.statusText = "Saving issue manifest";
            status.percentage = 7;
            this.publishProgress(status);

            String contentXMLPath = combinePaths(issueDirPath, "content.xml");
            writeFile(contentXMLPath, xml);

            if (this.isCancelled()) {
                DownloadResult result = new DownloadResult("Download was cancelled.");
                result.cancelled = true;
                return result;
            }

            status.statusText = "Parsing issue manifest";
            status.percentage = 10;
            this.publishProgress(status);

            // *************************************************************************************
            // Parse the XML into a document and query for all the entry nodes.

            Document document = getDocument(xml);

            XPathFactory xpathFactory = XPathFactory.newInstance();
            XPath xpath = xpathFactory.newXPath();

            XPathExpression entryExpression = xpath.compile("/feed/entry");
            NodeList entries = (NodeList) entryExpression.evaluate(document, XPathConstants.NODESET);

            // This will hold the ZIP file name for the shared theme.
            String themePackageURL = null;

            // This will hold the ZIP file names for each of the articles.
            ArrayList<String> articleURLs = new ArrayList<String>();

            // Loop over each of the entry nodes.
            for (int i = 0; i < entries.getLength(); i++) {

                Node entryNode = entries.item(i);

                NodeList childNodes = entryNode.getChildNodes();

                String articleURL = null;

                // Loop over each of the child nodes for the entry to get the article ZIP package
                // name for each as well as the first shared theme ZIP package name we find.
                for (int j = 0; j < childNodes.getLength(); j++) {

                    // If we've already determined the paths for this entry node there is no
                    // need to continue iterating the link nodes.
                    if (themePackageURL != null || articleURL != null) {
                        break;
                    }

                    Node childNode = childNodes.item(j);

                    // We only care about link nodes.
                    if (!childNode.getNodeName().equals("link")) {
                        continue;
                    }

                    Boolean isRelEnclosure = attributeEquals("rel", "enclosure", childNode);
                    Boolean isTypeZIP = attributeEquals("type", "application/zip", childNode);

                    // We only care about rel="enclosure" and type="application/zip" nodes.
                    if (!isRelEnclosure || !isTypeZIP) {
                        continue;
                    }

                    String href = getAttributeValue("href", childNode);

                    if (href == null || href.equals("")) {
                        continue;
                    }

                    // If we haven't determined a theme yet, check to see if this is a theme.
                    if (themePackageURL == null && href.contains("pp-shared-theme")) {
                        themePackageURL = buildAssetURLFromFragment(href, baseContentURL);
                    }

                    // If we haven't determined an article yet, check to see if this is an article.
                    if (articleURL == null && href.contains("pp-article")) {
                        articleURL = buildAssetURLFromFragment(href, baseContentURL);
                    }
                }

                // If we were able to find a ZIP file for an article package, add it to the list.
                if (articleURL != null) {
                    articleURLs.add(articleURL);
                }
            }

            // *************************************************************************************
            // Download the shared theme ZIP file.

            if (this.isCancelled()) {
                DownloadResult result = new DownloadResult("Download was cancelled.");
                result.cancelled = true;
                return result;
            }

            status.statusText = "Downloading theme";
            status.percentage = 15;
            this.publishProgress(status);

            String themePackageFileName = getFileNameFromURL(themePackageURL);
            String themePackagePath = combinePaths(downloadDirPath, themePackageFileName);

            httpGetDownload(themePackageURL, userAgent, themePackagePath);

            // *************************************************************************************
            // Loop over each article ZIP and download them.

            if (this.isCancelled()) {
                DownloadResult result = new DownloadResult("Download was cancelled.");
                result.cancelled = true;
                return result;
            }

            // We arbitrarily choose 20% to be when we start downloading files.
            int downloadBasePercentage = 20;

            status.statusText = "Downloading articles";
            status.percentage = downloadBasePercentage;
            this.publishProgress(status);

            // We have 60 percentage points allocated for downloading of the files. The first var is
            // the running total of percentage points while downloading, and the fragment is calculated
            // so we know how many percentage points each file should count for.
            double downloadPercentage = 0.0;
            double downloadPercentageFragment = 60 / articleURLs.size();

            for (String articleURL : articleURLs) {

                if (this.isCancelled()) {
                    DownloadResult result = new DownloadResult("Download was cancelled.");
                    result.cancelled = true;
                    return result;
                }

                String articleFileName = getFileNameFromURL(articleURL);
                String articleFilePath = combinePaths(downloadDirPath, articleFileName);

                httpGetDownload(articleURL, userAgent, articleFilePath);

                // Increment the percentage and then add to the base percentage for the update.
                downloadPercentage += downloadPercentageFragment;
                status.percentage = downloadBasePercentage + (int)Math.floor(downloadPercentage);
                this.publishProgress(status);
            }

            // *************************************************************************************
            // Loop over each article ZIP we downloaded earlier and extract the contents.

            if (this.isCancelled()) {
                DownloadResult result = new DownloadResult("Download was cancelled.");
                result.cancelled = true;
                return result;
            }

            // We arbitrarily choose 80% to be when we start extracting files.
            int extractBasePercentage = 80;

            status.statusText = "Unpacking articles";
            status.percentage = extractBasePercentage;
            this.publishProgress(status);

            // We have 19 percentage points allocated for extracting of the files. The first var is
            // the running total of percentage points while extracting, and the fragment is calculated
            // so we know how many percentage points each file should count for.
            double extractPercentage = 0.0;
            double extractPercentageFragment = 19 / downloadDir.listFiles().length;

             for (File downloadedFile : downloadDir.listFiles()) {

                 unzip(downloadedFile, issueDir);

                 // Increment the percentage and then add to the base percentage for the update.
                 extractPercentage += extractPercentageFragment;
                 status.percentage = extractBasePercentage + (int)Math.floor(extractPercentage);
                 this.publishProgress(status);
             }

            // *************************************************************************************
            // Write an empty file that is used to indicate a successful download.

            status.statusText = "Finalizing";
            status.percentage = 99;
            this.publishProgress(status);

            String completeTagPath = combinePaths(issueDirPath, "complete.id");
            writeFile(completeTagPath, "");

            // *************************************************************************************
            // Update the final statuses and return from the task.

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
     * @param path1 The first part of the path.
     * @param path2 The second part of the path.
     * @return The combination of the two paths.
     */
    private String combinePaths(String path1, String path2)
    {
        File file1 = new File(path1);
        File file2 = new File(file1, path2);

        return file2.getPath();
    }

    /**
     * A simple helper to write a file.
     *
     * @param path The path to write to.
     * @param contents The contents of the file to be written.
     * @throws Exception
     */
    private void writeFile(String path, String contents) throws Exception {

        PrintWriter writer = null;

        try {
            writer = new PrintWriter(path);
            writer.println(contents);
        }
        finally {

            if (writer != null) {
                writer.close();
            }
        }
    }

    /**
     * Used to extract the contents of a ZIP file to the given location.
     *
     * http://stackoverflow.com/a/27050680
     *
     * @param zipFile The ZIP file to read.
     * @param targetDirectory The location to extract the files to.
     */
    public static void unzip(File zipFile, File targetDirectory) throws IOException {

        ZipInputStream zis = new ZipInputStream(
                new BufferedInputStream(new FileInputStream(zipFile)));

        try {
            ZipEntry ze;
            int count;
            byte[] buffer = new byte[8192];

            while ((ze = zis.getNextEntry()) != null) {

                File file = new File(targetDirectory, ze.getName());
                File dir = ze.isDirectory() ? file : file.getParentFile();

                if (!dir.isDirectory() && !dir.mkdirs()) {
                    throw new FileNotFoundException("Failed to ensure directory: " +
                            dir.getAbsolutePath());
                }

                if (ze.isDirectory()) {
                    continue;
                }

                FileOutputStream outputStream = new FileOutputStream(file);

                try {
                    while ((count = zis.read(buffer)) != -1)
                        outputStream.write(buffer, 0, count);
                }
                finally {
                    outputStream.close();
                }

                /* if time should be restored as well
                long time = ze.getTime();
                if (time > 0)
                    file.setLastModified(time);
                */

            }
        }
        finally {
            zis.close();
        }
    }

    /**
     * Parses the given XML and returns a document object.
     *
     * @param xml The raw XML string to parse.
     * @return The parsed XML document.
     * @throws Exception
     */
    private Document getDocument(String xml) throws Exception {

        InputSource source = new InputSource(new StringReader(xml));

        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        DocumentBuilder db = dbf.newDocumentBuilder();
        return db.parse(source);
    }

    /**
     * Helper to get the value of an attribute by name.
     *
     * @param name The name of the attribute to get a value for.
     * @param node The node with the attributes to examine.
     * @return The value of the attribute if one exists.
     */
    private String getAttributeValue(String name, Node node) {

        if (name == null || node == null || node.getAttributes() == null) {
            return null;
        }

        Node attribute = node.getAttributes().getNamedItem(name);

        return attribute == null ? null : attribute.getNodeValue();
    }

    /**
     * Helper to determine if an attribute's value matches the given value.
     *
     * @param name The name of the attribute to examine.
     * @param value The expected value of the attribute.
     * @param node The node with the attributes to examine.
     * @return True if the value of the attribute matches, false otherwise.
     */
    private Boolean attributeEquals(String name, String value, Node node) {

        if (name == null || value == null || node == null || node.getAttributes() == null) {
            return null;
        }

        Node attribute = node.getAttributes().getNamedItem(name);

        String attributeValue = attribute == null ? null : attribute.getNodeValue();

        return attributeValue != null && attributeValue.equals(value);
    }

    /**
     * Reads an input stream into a single string.
     *
     * @param stream The input stream to read from.
     * @return A single string of content from the given stream.
     * @throws Exception
     */
    private String readStream(InputStream stream) throws Exception {

        // It's 2017 and I cannot believe I have to implement a readline loop myself...
        // http://stackoverflow.com/a/2549222

        BufferedReader reader = null;

        try {
            reader = new BufferedReader(new InputStreamReader(stream));
            StringBuilder result = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                result.append(line);
            }

            return result.toString();
        }
        finally {

            if (reader != null) {
                reader.close();
            }
        }
    }

    /**
     * Used to perform an HTTP get and retrieve it's response body.
     *
     * @param url The URL of the resource to request with a HTTP GET.
     * @param userAgent The value of the User-Agent header sent with the request.
     * @return The response body as a string.
     * @throws Exception
     */
    private String httpGet(String url, String userAgent) throws Exception {

        HttpURLConnection connection = null;
        InputStream stream = null;

        try {

            connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setRequestMethod("GET");
            connection.setRequestProperty("User-Agent", userAgent);

            int responseCode = connection.getResponseCode();

            if (responseCode != 200) {
                String message = MessageFormat.format("A non-200 status code was encountered ({0}) when requesting the URL: {1}", responseCode, url);
                throw new Exception(message);
            }

            stream = connection.getInputStream();

            return readStream(stream);
        }
        finally {

            if (connection != null) {
                connection.disconnect();
            }

            if (stream != null) {
                stream.close();
            }
        }
    }

    /**
     * Used to perform an HTTP get and retrieve it's response body and write it to disk as a file.
     *
     * @param url The URL of the resource to request with a HTTP GET.
     * @param userAgent The value of the User-Agent header sent with the request.
     * @param filePath The path of the file to write.
     * @throws Exception
     */
    private void httpGetDownload(String url, String userAgent, String filePath) throws Exception {

        HttpURLConnection connection = null;
        InputStream inputStream = null;

        try {

            connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setRequestMethod("GET");
            connection.setRequestProperty("User-Agent", userAgent);

            int responseCode = connection.getResponseCode();

            if (responseCode != 200) {
                String message = MessageFormat.format("A non-200 status code was encountered ({0}) when requesting the URL: {1}", responseCode, url);
                throw new Exception(message);
            }

            FileOutputStream outputStream = new FileOutputStream(filePath);
            inputStream = connection.getInputStream();

            byte[] buffer = new byte[1024];
            int bufferLength;

            while ((bufferLength = inputStream.read(buffer)) > 0 ) {
                outputStream.write(buffer, 0, bufferLength);
            }

            outputStream.close();
        }
        finally {

            if (connection != null) {
                connection.disconnect();
            }

            if (inputStream != null) {
                inputStream.close();
            }
        }
    }

    /**
     * Quick and dirty way to get the "file name" portion of a URL.
     *
     * Currently, just returns the remaining characters after the last forward slash.
     *
     * @param url The URL to obtain a file name from.
     * @return The file name from the given URL.
     */
    private String getFileNameFromURL(String url) {

        if (url == null) {
            return null;
        }

        return url.substring(url.lastIndexOf("/") + 1, url.length());
    }

    /**
     * Takes a relative path to an asset (i.e. article ZIP) and returns an absolute URL.
     *
     * @param assetFragmentPath The relative asset path.
     * @param baseContentURL The absolute base path URL used to build the full URL.
     * @return A relative URL for the given resource.
     */
    private String buildAssetURLFromFragment(String assetFragmentPath, String baseContentURL) {

        if (assetFragmentPath == null) {
            return null;
        }

        // The asset path fragments from content.xml are relative to content.xml.
        // Technically, this should be resolved against the content.xml URL, but I'll
        // just hardcode this for now. Two directories up from the XML file is the root.
        if (assetFragmentPath.startsWith("../../")) {
            assetFragmentPath = assetFragmentPath.replace("../../", "");
        }

        return MessageFormat.format("{0}/{1}", baseContentURL, assetFragmentPath);
    }
}
