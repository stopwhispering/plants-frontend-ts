# Plants Frontend
Typescript Edition
t.b.d. 
see also [Plants Backend](https://github.com/stopwhispering/plants-backend)

## Image Attributions
* https://www.svgrepo.com/
* https://www.pngwing.com/

## Deployment
Git Clone

    git clone git@github.com:stopwhispering/plants-frontend.git
    cd plants-frontend

Create & Run Docker Container

    # dev
    docker compose -f ./docker-compose.base.yml -f ./docker-compose.dev.yml up --build --detach
    
    # prod
    docker compose -f ./docker-compose.base.yml -f ./docker-compose.prod.yml up --build --detach

Test (dev): Open in Browser - http://plants.localhost

## Implementation Details
 
### Sequence of Loading Plant Details View
![Loading Plant Details](./diagrams/plant_details_loading_sequence.png?raw=true "Loading Plant Details")
