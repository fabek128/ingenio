#!/bin/sh
set -eu

speed="${INGENIO_RESPONSE_TYPE_SPEED_MS:-6}"
case "$speed" in
  ''|*[!0-9]*) speed="6" ;;
esac

cat > /usr/share/nginx/html/env.js <<EOF_JS
// INGENIO/64 frontend runtime config.
// Public config only. Do not put secrets here.
window.INGENIO_RESPONSE_TYPE_SPEED_MS = ${speed};
EOF_JS
