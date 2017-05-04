package net.justin_credible.theweek;

import android.os.AsyncTask;

import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.io.File;
import java.text.MessageFormat;
import java.util.ArrayList;

import javax.xml.xpath.XPathFactory;
import javax.xml.xpath.*;

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

            String issueDirPath = Utilities.combinePaths(baseStorageDir, "issues");
            issueDirPath = Utilities.combinePaths(issueDirPath, id);

            File issueDir = new File(issueDirPath);

            if (issueDir.isDirectory() && issueDir.exists()) {
                Utilities.deleteDir(issueDir);
            }

            // Create the directory for the issue.

            Boolean createDirSuccess = issueDir.mkdirs();

            if (!createDirSuccess) {
                return new DownloadResult(MessageFormat.format("Unable to create issue directory: {0}", issueDirPath));
            }

            // Create the directory for the ZIP file downloads.

            String downloadDirPath = Utilities.combinePaths(issueDirPath, "_downloads");
            File downloadDir = new File(downloadDirPath);

            if (downloadDir.isDirectory() && downloadDir.exists()) {
                Utilities.deleteDir(downloadDir);
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
            String xml = Utilities.httpGet(xmlURL, userAgent);

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

            String contentXMLPath = Utilities.combinePaths(issueDirPath, "content.xml");
            Utilities.writeFile(contentXMLPath, xml);

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

            Document document = Utilities.getDocument(xml);

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
                    if (themePackageURL != null && articleURL != null) {
                        break;
                    }

                    Node childNode = childNodes.item(j);

                    // We only care about link nodes.
                    if (!childNode.getNodeName().equals("link")) {
                        continue;
                    }

                    Boolean isRelEnclosure = Utilities.attributeEquals("rel", "enclosure", childNode);
                    Boolean isTypeZIP = Utilities.attributeEquals("type", "application/zip", childNode);

                    // We only care about rel="enclosure" and type="application/zip" nodes.
                    if (!isRelEnclosure || !isTypeZIP) {
                        continue;
                    }

                    String href = Utilities.getAttributeValue("href", childNode);

                    if (href == null || href.equals("")) {
                        continue;
                    }

                    // If we haven't determined a theme yet, check to see if this is a theme.
                    if (themePackageURL == null && href.contains("pp-shared-theme")) {
                        themePackageURL = Utilities.buildAssetURLFromFragment(href, baseContentURL);
                    }

                    // If we haven't determined an article yet, check to see if this is an article.
                    if (articleURL == null && href.contains("pp-article")) {
                        articleURL = Utilities.buildAssetURLFromFragment(href, baseContentURL);
                    }
                }

                // If we were able to find a ZIP file for an article package, add it to the list.
                if (articleURL != null) {
                    articleURLs.add(articleURL);
                }
            }

            // Sanity check; we should have found articles at this point.
            if (articleURLs.size() == 0) {
                throw new Exception("No articles were found in content.xml");
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

            String themePackageFileName = Utilities.getFileNameFromURL(themePackageURL);
            String themePackagePath = Utilities.combinePaths(downloadDirPath, themePackageFileName);

            Utilities.httpGetDownload(themePackageURL, userAgent, themePackagePath);

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
            double downloadPercentageFragment = (double)60 / (double)articleURLs.size();

            for (String articleURL : articleURLs) {

                if (this.isCancelled()) {
                    DownloadResult result = new DownloadResult("Download was cancelled.");
                    result.cancelled = true;
                    return result;
                }

                String articleFileName = Utilities.getFileNameFromURL(articleURL);
                String articleFilePath = Utilities.combinePaths(downloadDirPath, articleFileName);

                Utilities.httpGetDownload(articleURL, userAgent, articleFilePath);

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
            double extractPercentageFragment = (double)19 / (double)downloadDir.listFiles().length;

             for (File downloadedFile : downloadDir.listFiles()) {

                 Utilities.unzip(downloadedFile, issueDir);

                 // Increment the percentage and then add to the base percentage for the update.
                 extractPercentage += extractPercentageFragment;
                 status.percentage = extractBasePercentage + (int)Math.floor(extractPercentage);
                 this.publishProgress(status);
             }

            // *************************************************************************************
            // Clean up the downloads directory.

            Utilities.deleteDir(downloadDir);

            // *************************************************************************************
            // Write an empty file that is used to indicate a successful download.

            status.statusText = "Finalizing";
            status.percentage = 99;
            this.publishProgress(status);

            String completeTagPath = Utilities.combinePaths(issueDirPath, "complete.id");
            Utilities.writeFile(completeTagPath, "");

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
}
