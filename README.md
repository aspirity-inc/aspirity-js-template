# Aspirity JS Template  
  
Project's goal - provide solution for fast developing of Web JS application.  
  
## Technologies:   
Docker, Node.js, Express.js, MongoDB, RabbitMQ, Nginx, Bluebird  
  
## Project contains:  
* user’s API (registration and authorization methods)  
* server side validation  
* simple ACL implementation  
* database migration  
* templates for SMS and E-mail notifications  
* template for RabbitMQ task  
  
  
## Quick start:  
* Clone repository (or download as ZIP)  
* Run `npm i` in project's root directory  
* Set MongoDB uri and RabbitMQ url for appropriated environment configuration file in `/lib/server/config/env` directory (default file is `dev-local.json`)  
* Run server  
  
## Future improvements:  
* Token authorization  
* ACL improvements  
* Deploy improvements  
* MongoDB filters  