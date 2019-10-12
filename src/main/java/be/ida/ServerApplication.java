package be.ida;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/**
 * Developer: Ben Oeyen
 * Date: 2019-10-10
 */

@SpringBootApplication
public class ServerApplication extends SpringBootServletInitializer {
    public static void main(String[] args) {
        SpringApplication.run(ServerApplication.class, args);
    }
}

