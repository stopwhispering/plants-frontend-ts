# Plants Frontend TS
Plants Library Frontend based on [Open UI5](https://openui5.hana.ondemand.com/), written in [TypeScript](https://sap.github.io/ui5-typescript/).

For the corresponding backend, visit [Plants Backend](https://github.com/stopwhispering/plants-backend).

## Deployment with Docker

Deploy with Docker Compose using [Nginx](https://hub.docker.com/_/nginx) behind a [Traefik](https://hub.docker.com/_/traefik) reverse proxy.
Traefik is expected to be running as described in [traefik-via-docker-with-sample-services](https://github.com/stopwhispering/traefik-via-docker-with-sample-services).

Transpile TypeScript to JavaScript and copy to dist folder.
```
    # transpile TypeScript to JavaScript and copy to dist folder
    npm run build --clean-dest
```

For deployment in PROD, set the environment variable `HOSTNAME` to the domain name of the server, preferably use 
a .env file in the root folder of the project.
```dotenv
    HOSTNAME=example.com
```

Deploy by building the docker image and running the container.
```
    # dev
    docker-compose -f ./docker-compose.base.yml -f ./docker-compose.dev.yml up --build --detach
    
    # prod
    docker-compose -f ./docker-compose.base.yml -f ./docker-compose.prod.yml up --build --detach
```


Test (DEV): Open in Browser - http://plants.localhost

Test (PROD): Open in Browser - http://plants.example.net


## Implementation Details
 
### Sequence of Loading Plant Details View
![Loading Plant Details](./diagrams/plant_details_loading_sequence.png?raw=true "Loading Plant Details")


## Image Attributions
* https://www.svgrepo.com/
* https://www.pngwing.com/