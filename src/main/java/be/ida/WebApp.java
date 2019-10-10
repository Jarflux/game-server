package be.ida;

import io.dropwizard.Application;
import io.dropwizard.Configuration;
import io.dropwizard.setup.Environment;

/**
 * Developer: Ben Oeyen
 * Date: 2019-10-10
 */
public class WebApp extends Application<Configuration> {

    public static void main(String[] args) throws Exception {
        new WebApp().run(args);
    }

    @Override
    public void run(Configuration configuration, Environment environment) throws Exception {

    }
}
