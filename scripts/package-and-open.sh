#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/out"
APP_NAME="itracksy"

cd "${ROOT_DIR}"

echo "==> Killing running ${APP_NAME} processes (if any)..."
if pgrep -x "${APP_NAME}" >/dev/null 2>&1; then
  pkill -x "${APP_NAME}" || true
  sleep 2
fi

if pgrep -f "${APP_NAME}" >/dev/null 2>&1; then
  pkill -f "${APP_NAME}" || true
  sleep 1
fi

echo "==> Clearing ${OUT_DIR}..."
rm -rf "${OUT_DIR}"

echo "==> Running npm run package..."
npm run package

echo "==> Locating packaged app..."
APP_PATH="$(find "${OUT_DIR}" -maxdepth 3 -type d -name "${APP_NAME}.app" | head -n 1 || true)"

if [[ -n "${APP_PATH}" && -d "${APP_PATH}" ]]; then
  echo "==> Opening ${APP_PATH}..."
  open "${APP_PATH}"
else
  echo "WARN: Could not find ${APP_NAME}.app in ${OUT_DIR}. Opening folder instead."
  if [[ -d "${OUT_DIR}" ]]; then
    open "${OUT_DIR}"
  else
    echo "ERROR: ${OUT_DIR} does not exist after packaging."
    exit 1
  fi
fi

