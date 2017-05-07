
/**
 * Describes the photo viewer plugin.
 * 
 * npm ID: com-sarriaroman-photoviewer version 1.1.2
 * https://github.com/sarriaroman/photoviewer
 */
declare module PhotoViewerPlugin {

    interface PhotoViewerPluginStatic {

        /**
         * Used to show a full screen preview of the given image.
         * 
         * @param imageUrl The URL of the image to show a preview for.
         */
        show(imageUrl: string);

        /**
         * Used to show a full screen preview of the given image.
         * 
         * @param imageUrl The URL of the image to show a preview for.
         * @param title The optional title to display in the preview's toolbar.
         */
        show(imageUrl: string, title: string);
    }
}

// Extends the CordovaPlugins interface as defined in lib.d.ts.
interface Window {
    PhotoViewer: PhotoViewerPlugin.PhotoViewerPluginStatic;
}
