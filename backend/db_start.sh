#!/bin/bash

docker run -it -e POSTGRES_PASSWORD=postgres -p 5432:5432 --rm -d postgres:12
ID=$(docker ps | grep "postgres:12" | cut -d' ' -f 1)
docker cp ./db.dump $ID:/db.dump
sleep 5
docker exec -it $ID psql -U postgres -c "CREATE DATABASE $DB_NAME;"
docker exec -it $ID psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
docker exec -it $ID psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
docker exec -it $ID psql -U postgres -c "DROP SCHEMA public;"
docker exec -it $ID pg_restore -e -U postgres -d ${DB_NAME} -h localhost ./db.dump
