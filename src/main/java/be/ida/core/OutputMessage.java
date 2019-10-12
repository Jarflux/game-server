package be.ida.core;

/**
 * Developer: Ben Oeyen
 * Date: 2019-10-10
 */
public class OutputMessage {

    private String time;
    private String from;
    private String content;

    public OutputMessage(String time, String from, String content) {
        this.time = time;
        this.from = from;
        this.content = content;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
