#!/bin/bash


# # #
# SETTINGS

email="carrismetropolitana@gmail.com"
staging=0 # Set to 1 if you're testing your setup to avoid hitting request limits

api_domain=api.carrismetropolitana.pt # The primary domain
switch_qr_domain=qr.carrismetropolitana.pt


# # #
# STARTUP

echo ">>> Cleaning letsencrypt directory..."
sudo rm -Rf "./letsencrypt/"

echo ">>> Downloading recommended TLS parameters ..."
mkdir -p "./letsencrypt"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "./letsencrypt/options-ssl-nginx.conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "./letsencrypt/ssl-dhparams.pem"
echo

echo ">>> Creating dummy certificate for "$api_domain"..."
mkdir -p "./letsencrypt/live/$api_domain"
docker compose run --rm --entrypoint "openssl req -x509 -nodes -newkey rsa:4096 -days 1 -keyout '/etc/letsencrypt/live/$api_domain/privkey.pem' -out '/etc/letsencrypt/live/$api_domain/fullchain.pem' -subj '/CN=localhost'" certbot
echo

echo ">>> Creating dummy certificate for "$switch_qr_domain"..."
mkdir -p "./letsencrypt/live/$switch_qr_domain"
docker compose run --rm --entrypoint "openssl req -x509 -nodes -newkey rsa:4096 -days 1 -keyout '/etc/letsencrypt/live/$switch_qr_domain/privkey.pem' -out '/etc/letsencrypt/live/$switch_qr_domain/fullchain.pem' -subj '/CN=localhost'" certbot
echo

echo ">>> Rebuilding nginx ..."
docker compose up -d --build --force-recreate --remove-orphans nginx
echo


# # #
# API

echo ">>> Preparing for "$api_domain"..."

echo ">>> Deleting dummy certificate..."
docker compose run --rm --entrypoint "rm -Rf /etc/letsencrypt/live/$api_domain && rm -Rf /etc/letsencrypt/archive/$api_domain && rm -Rf /etc/letsencrypt/renewal/$api_domain.conf" certbot
echo

echo ">>> Requesting Let's Encrypt certificate for "$api_domain"..."
if [ $staging != "0" ]; then staging_arg="--staging"; fi # Enable staging mode if needed
docker compose run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot $staging_arg -d $api_domain --email $email --rsa-key-size 4096 --agree-tos --noninteractive --verbose --force-renewal" certbot
echo


# # #
# QR SWITCH

echo ">>> Preparing for "$switch_qr_domain" ..."

echo ">>> Deleting dummy certificate..."
docker compose run --rm --entrypoint "rm -Rf /etc/letsencrypt/live/$switch_qr_domain && rm -Rf /etc/letsencrypt/archive/$switch_qr_domain && rm -Rf /etc/letsencrypt/renewal/$switch_qr_domain.conf" certbot
echo

echo ">>> Requesting Let's Encrypt certificate for "$switch_qr_domain"..."
if [ $staging != "0" ]; then staging_arg="--staging"; fi # Enable staging mode if needed
docker compose run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot $staging_arg -d $switch_qr_domain --email $email --rsa-key-size 4096 --agree-tos --noninteractive --verbose --force-renewal" certbot
echo


# # #
# CLEANUP

echo ">>> Rebuilding nginx ..."
docker compose up -d --build --force-recreate --remove-orphans nginx
echo

echo ">>> DONE!"