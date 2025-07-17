#!/bin/sh

# Start dev server in background
bun dev &

# Get PID of dev server
DEV_PID=$!

# Give server a bit of time to spin up
sleep 1

# Open Chromium fullscreen
prime-run chromium \
  --app=http://localhost:3000 \
  --start-fullscreen \
  --use-gl=desktop \
  --enable-accelerated-2d-canvas \
  --enable-gpu-rasterization \
  --enable-zero-copy \
  --enable-features=UseSkiaRenderer,CanvasOopRasterization \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --noerrdialogs \
  --disable-notifications \
  --disable-translate \
  --autoplay-policy=no-user-gesture-required \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --hide-scrollbars \
  --disable-features=TranslateUI \
  --disable-background-networking \
  --no-first-run \
  --disable-default-apps \
  --disable-component-update \
  --disable-sync \
  --no-default-browser-check




# When Chromium closes, kill dev server
kill $DEV_PID
