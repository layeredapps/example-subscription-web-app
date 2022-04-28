NODE_ENV=testing \
GENERATE_SCREENSHOTS=true \
SCREENSHOT_PATH=/home/appstore-project/workspace/dashboard/layeredapps.github.io/screenshots/example-subscription-web-app \
PORT=9000 \
APPLICATION_SERVER=http://localhost:4000 \
APPLICATION_SERVER_TOKEN=token \
DASHBOARD_SERVER=http://localhost:9000 \
START_APPLICATION_SERVER=false \
APPLICATION_SERVER_PORT=4000 \
SUBSCRIPTIONS_WEBHOOK_ENDPOINT_SECRET="asdf" \
SUBSCRIPTIONS_STRIPE_PUBLISHABLE_KEY=$CONNECT_STRIPE_PUBLISHABLE_KEY \
SUBSCRIPTIONS_STRIPE_KEY=$CONNECT_STRIPE_KEY \
mocha --file test-helper.js --timeout 480000 --ignore 'node_modules/hpagent/**/*' --slow 480000 --recursive --extension .test.js --retries 2 . 2>&1 | tee tests.txt
