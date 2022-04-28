if [ ! -d node_modules ]; then
  npm install
fi
APPLICATION_SERVER_TOKEN="this is the token" \
APPLICATION_SERVER="http://localhost:8300" \
DASHBOARD_SERVER="http://localhost:8200" \
APPLICATION_SERVER_PORT=8300 \
PORT=8200 \
node main.js 
