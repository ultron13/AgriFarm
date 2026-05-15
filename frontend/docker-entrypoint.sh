#!/bin/sh
set -e
# Substitute only BACKEND_URL so nginx variables like $host are left untouched.
envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf
exec "$@"
