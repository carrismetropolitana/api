FROM nginx:stable
COPY nginx.conf /etc/nginx/nginx.conf
CMD ["/bin/sh", "-c", "while true; do sleep 6h & wait ${!}; nginx -s reload; done & nginx -g \"daemon off;\""]