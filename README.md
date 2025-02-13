# Environment setup

## Setup via Docker Compose

A Docker Compose script is provided in the `/infra` directory. Running this script will start two Docker containers: one for MySQL and one for Redis.

- Prerequisites: Docker and Docker Compose must be installed locally.
- Run: `docker-compose -p test-assessment -f docker-compose.yml up -d`

Once the containers are running, create a `.env` file in the `/server` directory and set the following variables:

```
DATABASE_HOST=localhost
DATABASE_PORT=3389
DATABASE_LOGGING_ENABLED=false
DATABASE_PASSWORD=test2@25
DATABASE_USER=testDbUser

REDIS_HOST=localhost
REDIS_PORT=6389
REDIS_PASSWORD=sb6CwUhNey4Y23cV8CA49GcwNnKJamGHI8n
REDIS_TLS_ENABLED=false
```

## Run DB migration to create users table

- Go to the `/server` directory
- Run:

```
npx sequelize-cli db:migrate
```

This will create "users" table in the database

## Run the server

- Go to the `/server` directory
- Run: `npm run start`

This will start the API in port: `7000`.
To access swagger, go to http://localhost:7000/api-docs/

This app runs both the API and the birthday greeter job, which is scheduled to run every hour as configured in `/server/common/config/configuration.js`

## Test the birthday greeter job by running the console

Run: `npm run birthday-greeter-send -- --serverSendTime="YYYY-MM-DD HH:00:00"`

This command mocks the scheduler's running time by passing the `serverSendTime` argument.
Note: This does not run the job directly. It only sends a job to the queue. Therefore, you still need to start the server for the job to be processed.
