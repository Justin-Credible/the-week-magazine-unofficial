package net.justin_credible.theweek;

public class DownloadResult {

    public String message;
    public Boolean success;
    public Boolean cancelled;

    public DownloadResult(String message) {
        this.message = message;
        this.success = false;
        this.cancelled = false;
    }
}
