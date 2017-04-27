package net.justin_credible.theweek;

import android.os.AsyncTask;

import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.io.StringReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.text.MessageFormat;
import java.util.ArrayList;

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

            // The is the ID of the issue we want to download.
            String id = params[0];

            // Publish the initial status update.

            DownloadStatus status = new DownloadStatus();
            status.inProgress = true;
            status.id = id;
            status.statusText = "Checking storage";
            status.percentage = 0;
            this.publishProgress(status);

            // Create the directory for this issue.
            // If the directory already exists from a failed download, delete it first.

            String issueDirPath = combinePaths(baseStorageDir, "issues");
            issueDirPath = combinePaths(issueDirPath, id);

            File issueDir = new File(issueDirPath);

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

            if (this.isCancelled()) {
                DownloadResult result = new DownloadResult("Download was cancelled.");
                result.cancelled = true;
                return result;
            }

            status.statusText = "Retrieving issue manifest";
            status.percentage = 5;
            this.publishProgress(status);

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

            // Write XML body to content.xml

            String contentXMLPath = combinePaths(issueDirPath, "content.xml");
            writeFile(contentXMLPath, xml);

            if (this.isCancelled()) {
                DownloadResult result = new DownloadResult("Download was cancelled.");
                result.cancelled = true;
                return result;
            }

            status.statusText = "Reading issue manifest";
            status.percentage = 10;
            this.publishProgress(status);

            // Parse the XML into a document and query for all the entry nodes.

            Document document = getDocument(xml);

            XPathFactory xpathFactory = XPathFactory.newInstance();
            XPath xpath = xpathFactory.newXPath();

            XPathExpression entryExpression = xpath.compile("/feed/entry");
            NodeList entries = (NodeList) entryExpression.evaluate(document, XPathConstants.NODESET);

            // This will hold the ZIP file name for the shared theme.
            String themePackagePath = null;

            // This will hold the ZIP file names for each of the articles.
            ArrayList<String> articlePackagePaths = new ArrayList<String>();

            // Loop over each of the entry nodes.
            for (int i = 0; i < entries.getLength(); i++) {

                Node entryNode = entries.item(i);

                NodeList childNodes = entryNode.getChildNodes();

                String articlePackagePath = null;

                // Loop over each of the child nodes for the entry to get the article ZIP package
                // name for each as well as the first shared theme ZIP package name we find.
                for (int j = 0; j < childNodes.getLength(); j++) {

                    // If we've already determined the paths for this entry node there is no
                    // need to continue iterating the link nodes.
                    if (themePackagePath != null || articlePackagePath != null) {
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
                    if (themePackagePath == null && href.contains("pp-shared-theme")) {
                        themePackagePath = href;
                    }

                    // If we haven't determined an article yet, check to see if this is an article.
                    if (articlePackagePath == null && href.contains("pp-article")) {
                        articlePackagePath = href;
                    }
                }

                // If we were able to find a ZIP file for an article package, add it to the list.
                if (articlePackagePath != null) {
                    articlePackagePaths.add(articlePackagePath);
                }
            }

            // Download the shared theme ZIP file.

            if (this.isCancelled()) {
                DownloadResult result = new DownloadResult("Download was cancelled.");
                result.cancelled = true;
                return result;
            }

            status.statusText = "Downloading theme";
            status.percentage = 15;
            this.publishProgress(status);

            // TODO

            // Loop over each article ZIP and download them.

            if (this.isCancelled()) {
                DownloadResult result = new DownloadResult("Download was cancelled.");
                result.cancelled = true;
                return result;
            }

            status.statusText = "Downloading articles";
            status.percentage = 20;
            this.publishProgress(status);

            // TODO: 60 percentage points allocated for the files; determine how many percent per file.

            for (String articleZip : articlePackagePaths) {
                // TODO
                // TODO Strip leading ../.. in path
                // TODO Build URL
                // TODO Retrieve file
                // TODO Write to disk
                // TODO Increment percentage
            }

            // Loop over each article ZIP we downloaded earlier and extract the contents.

            if (this.isCancelled()) {
                DownloadResult result = new DownloadResult("Download was cancelled.");
                result.cancelled = true;
                return result;
            }

            status.statusText = "Unpacking articles";
            status.percentage = 80;
            this.publishProgress(status);

            // TODO: 19 percentage points allocated for the extraction; determine how many percent per file.

            // TODO Get ZIPs on disk
            // for (String zip : zipsOnDisk) {
            //     TODO Extract
            //     TODO increment percentage
            // }

            // Write an empty file that is used to indicate a successful download.

            status.statusText = "Finalizing";
            status.percentage = 99;
            this.publishProgress(status);

            String completeTagPath = combinePaths(issueDirPath, "complete.id");
            writeFile(completeTagPath, "");

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
        catch (Exception exception) {
            throw exception;
        }
        finally {
            writer.close();
        }
    }

    /**
     * Parses the given XML and returns a document object.
     *
     * @param xml
     * @return
     * @throws Exception
     */
    private Document getDocument(String xml) throws Exception {

        InputSource source = new InputSource(new StringReader(xml));

        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
        DocumentBuilder db = dbf.newDocumentBuilder();
        Document document = db.parse(source);

        return document;
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

        return attributeValue == null ? false : attributeValue.equals(value);
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
        catch (Exception exception) {
            throw exception;
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
     * @return The response body as a string.
     * @throws Exception
     */
    private String httpGet(String url, String userAgent) throws Exception {

        HttpURLConnection httpURLConnection = null;
        InputStream stream = null;

        try {

            URLConnection connection = new URL(url).openConnection();
            connection.setRequestProperty("User-Agent", userAgent);

            HttpURLConnection httpConnection = (HttpURLConnection) connection;
            int responseCode = httpConnection.getResponseCode();

            if (responseCode != 200) {
                String message = MessageFormat.format("A non-200 status code was encountered ({0}) when requesting the URL: {1}", responseCode, url);
                throw new Exception(message);
            }

            stream = connection.getInputStream();

            String content = readStream(stream);

            return content;
        }
        catch (Exception exception) {
            throw exception;
        }
        finally {

            if (httpURLConnection != null) {
                httpURLConnection.disconnect();
            }

            if (stream != null) {
                stream.close();
            }
        }
    }
}
