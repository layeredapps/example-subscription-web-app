NODE_ENV=testing \
PORT=9000 \
APPLICATION_SERVER=http://localhost:4000 \
APPLICATION_SERVER_TOKEN=token \
DASHBOARD_SERVER=http://localhost:9000 \
START_APPLICATION_SERVER=false \
APPLICATION_SERVER_PORT=4000 \
GENERATE_SCREENSHOTS=false \
SCREENSHOT_PATH=/home/appstore-project/workspace/dashboard/layeredapps.github.io/screenshots/example-subscription-web-app \
GENERATE_RESPONSE=false \
RESPONSE_PATH=/tmp \
SUBSCRIPTIONS_WEBHOOK_ENDPOINT_SECRET="asdf" \
SUBSCRIPTIONS_STRIPE_PUBLISHABLE_KEY=$CONNECT_STRIPE_PUBLISHABLE_KEY \
SUBSCRIPTIONS_STRIPE_KEY=$CONNECT_STRIPE_KEY \
npm run deploy-check
