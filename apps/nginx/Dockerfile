# # #

FROM nginx:alpine-slim

WORKDIR /app

# # #
# Copy the config files

COPY apps/nginx/configs/. /etc/nginx/.


# # #
# Run Nginx	with auto-reload every 6 hours

CMD ["/bin/sh", "-c", "while :; do sleep 6h & wait ${!}; nginx -s reload; done & nginx -g 'daemon off;'"]
