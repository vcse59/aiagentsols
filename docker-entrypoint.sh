#!/bin/sh
set -eu

STORAGE_ROOT="${ARTICLE_STORAGE_DIR:-/data}"
RUNTIME_UID="${RUNTIME_UID:-1000}"
RUNTIME_GID="${RUNTIME_GID:-1000}"

# Mounted volumes may appear after container boot; wait briefly so setup runs
# against the real mount rather than the image filesystem.
attempt=0
until [ -d "${STORAGE_ROOT}" ] || [ "$attempt" -ge 30 ]; do
  attempt=$((attempt + 1))
  sleep 1
done

mkdir -p "${STORAGE_ROOT}"
mkdir -p "${STORAGE_ROOT}/markdown"
chown -R "${RUNTIME_UID}:${RUNTIME_GID}" "${STORAGE_ROOT}"
chmod -R 0777 "${STORAGE_ROOT}"

exec su-exec "${RUNTIME_UID}:${RUNTIME_GID}" node server/index.js