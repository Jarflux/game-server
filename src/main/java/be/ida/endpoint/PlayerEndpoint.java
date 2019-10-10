package be.ida.endpoint;

import be.ida.core.Message;
import be.ida.decoder.MessageDecoder;
import be.ida.encoder.MessageEncoder;

import javax.websocket.*;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.HashMap;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Developer: Ben Oeyen
 * Date: 2019-10-10
 */
@ServerEndpoint(value = "/game/{username}",
        decoders = MessageDecoder.class,
        encoders = MessageEncoder.class )
public class PlayerEndpoint {

    private Session session;
    private static Set<PlayerEndpoint> playerEndpoints = new CopyOnWriteArraySet<>();
    private static HashMap<String, String> players = new HashMap<>();

    @OnOpen
    public void onOpen(Session session, @PathParam("username") String username){
        this.session = session;
        playerEndpoints.add(this);
        players.put(session.getId(), username);
        Message message = new Message();
        message.setFrom(username);
        message.setContent("Connected!");
        broadcast(message);
    }

    @OnMessage
    public void onMessage(Session session, Message message){
        message.setFrom(players.get(session.getId()));
        broadcast(message);
    }

    @OnClose
    public void onClose(Session session){
        playerEndpoints.remove(this);
        Message message = new Message();
        message.setFrom(players.get(session.getId()));
        message.setContent("Disconnected!");
        broadcast(message);
    }

    @OnError
    public void onError(Session session, Throwable throwable) {
        // Do error handling here
    }

    private static void broadcast(Message message){
        playerEndpoints.forEach(endpoint -> {
            synchronized (endpoint) {
                try {
                    endpoint.session.getBasicRemote().
                            sendObject(message);
                } catch (IOException | EncodeException e) {
                    e.printStackTrace();
                }
            }
        });
    }
}
