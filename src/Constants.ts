import ManagedObject from "sap/ui/base/ManagedObject";

/**
 * @namespace plants.ui
 */
export default class Constants extends ManagedObject {

    public static base_url = (() => {
        // we want to make this work both in dev environment and in production
        if ((window.location.hostname === "localhost") && (["8080", "8085"].includes(window.location.port))){
            // in dev environment (serving via ui5 cli as localhost:8080), we usually run the backend on localhost:5000 via pycharm
            return 'http://localhost:5000/api/';
        } else if (window.location.hostname.endsWith('localhost') && (window.location.port !== "8080")){
            // in dev environment (testing dockerized backend as plants.localhost:80), we usually run the backend on plants.localhost:80/api via traefik
            return 'http://plants.localhost/api/';
        } else {
            // in prod environment, we usually run the backend on any-nonlocal-host:80/443
            const plants_host = window.location.host;  // e.g. plants.example.net
            const domain = plants_host.substring('plants'.length + 1);  // e.g. example.net
            return window.location.protocol + '//plants.' + domain + '/api/';  // e.g. https://plants.example.net/api/
        }
    })();

    // keep in sync with backend constant LENGTH_SHORTENED_PLANT_NAME_FOR_TAG
    public static LENGTH_SHORTENED_PLANT_NAME_FOR_TAG = 25;
    public static LENGTH_SHORTENED_KEYWORD_FOR_TOKEN_DISPLAY = 30;
}