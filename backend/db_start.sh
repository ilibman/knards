#!/bin/bash

docker run -it -e POSTGRES_PASSWORD=postgres -p 5432:5432 --rm -d postgres:17
ID=$(docker ps | grep "postgres:17" | cut -d' ' -f 1)
docker cp ./db.dump $ID:/db.dump
sleep 5
docker exec -it $ID psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
docker exec -it $ID psql -U postgres -c "CREATE DATABASE $DB_NAME WITH OWNER $DB_USER;"
docker exec -it $ID psql -U postgres -c "DROP SCHEMA public;"
docker exec -it $ID pg_restore --host=localhost -e -U postgres -d ${DB_NAME} -h localhost ./db.dump
