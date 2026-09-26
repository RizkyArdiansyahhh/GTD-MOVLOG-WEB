#!/bin/sh
set -e

# Ensure public/storage symlink exists AND resolves inside the container.
# A symlink created from the WSL host points to a host-absolute path
# (e.g. /home/shaman/...), which is broken inside the container and makes
# every /storage/* URL (avatars, PDFs) return 404 even though the file
# was saved correctly. Recreate it when missing or broken.
LINK="/var/www/html/public/storage"
if [ ! -L "$LINK" ] || [ ! -e "$LINK" ]; then
  echo "[entrypoint] (re)creating storage symlink..."
  rm -f "$LINK"
  php /var/www/html/artisan storage:link || echo "[entrypoint] storage:link failed (may already exist)"
else
  echo "[entrypoint] storage symlink OK -> $(readlink $LINK)"
fi

exec "$@"
