package be.ida.controller;

import be.ida.core.Message;
import be.ida.core.OutputMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Developer: Ben Oeyen
 * Date: 2019-10-12
 */

@Controller
@RequestMapping(value = "/app")
public class GameController {

    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public OutputMessage send(Message message) throws Exception {
        String time = new SimpleDateFormat("HH:mm").format(new Date());
        return new OutputMessage(time, message.getFrom(), message.getContent());
    }
}
