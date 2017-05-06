package net.justin_credible.theweek;

import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.xml.sax.InputSource;

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
import java.util.LinkedList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

public class Utilities {

    /**
     * A quick and dirty way to combines two path fragments.
     *
     * @param path1 The first part of the path.
     * @param path2 The second part of the path.
     * @return The combination of the two paths.
     */
    public static String combinePaths(String path1, String path2)
    {
        File file1 = new File(path1);
        File file2 = new File(file1, path2);

        return file2.getPath();
    }

    /**
     * Removes a directory and all of its children.
     *
     * http://stackoverflow.com/a/29175213
     *
     * @param file The directory to remove.
     */
    public static void deleteDir(File file) throws Exception {

        File[] contents = file.listFiles();

        if (contents != null) {
            for (File f : contents) {
                deleteDir(f);
            }
        }

        boolean success = file.delete();

        if (!success) {
            throw new Exception(MessageFormat.format("Unable to delete '{0}'", file.getAbsolutePath()));
        }
    }

    /**
     * A simple helper to read a file.
     *
     * @param path The path to read from.
     * @return The contents of the file as a string.
     * @throws Exception
     */
    public static String readFile(String path) throws Exception {

        FileInputStream fileInputStream = null;

        try {
            fileInputStream = new FileInputStream(path);
            return readStream(fileInputStream);
        }
        finally {

            if (fileInputStream != null) {
                fileInputStream.close();
            }
        }
    }

    /**
     * A simple helper to write a file.
     *
     * @param path The path to write to.
     * @param contents The contents of the file to be written.
     * @throws Exception
     */
    public static void writeFile(String path, String contents) throws Exception {

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
     * Returns the total file size of the given file (or all children if given a directory).
     *
     * http://stackoverflow.com/a/23443160
     *
     * @param file The file or directory to examine.
     * @return The file size, in bytes.
     */
    public static long getFileSize(final File file) {

        if (file == null || !file.exists()) {
            return 0;
        }

        if (!file.isDirectory()) {
            return file.length();
        }

        final List<File> dirs = new LinkedList<File>();

        dirs.add(file);

        long result=0;

        while (!dirs.isEmpty())  {

            final File dir = dirs.remove(0);

            if(!dir.exists()) {
                continue;
            }

            final File[] listFiles = dir.listFiles();

            if (listFiles == null || listFiles.length == 0) {
                continue;
            }

            for (final File child : listFiles) {

                result += child.length();

                if (child.isDirectory()) {
                    dirs.add(child);
                }
            }
        }

        return result;
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
    public static Document getDocument(String xml) throws Exception {

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
    public static String getAttributeValue(String name, Node node) {

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
    public static Boolean attributeEquals(String name, String value, Node node) {

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
    public static String readStream(InputStream stream) throws Exception {

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
    public static String httpGet(String url, String userAgent) throws Exception {

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
    public static void httpGetDownload(String url, String userAgent, String filePath) throws Exception {

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
    public static String getFileNameFromURL(String url) {

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
    public static String buildAssetURLFromFragment(String assetFragmentPath, String baseContentURL) {

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
