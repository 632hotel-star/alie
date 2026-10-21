#!/bin/bash
# Rebuild and (re)start the production server on :3100 for QA.
cd "$(dirname "$0")/.." || exit 1
pkill -f "[n]ext-server" 2>/dev/null
sleep 1
timeout 500 npx next build > /tmp/qa-build.log 2>&1 || { tail -30 /tmp/qa-build.log; exit 1; }
(nohup npx next start -p 3100 > /tmp/qa-start.log 2>&1 &)
sleep 4
curl -sS -o /dev/null -w "prod server: %{http_code}\n" http://localhost:3100/
