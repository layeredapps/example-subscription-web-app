const dashboard = require('@layeredapps/dashboard')
dashboard.start(__dirname)

// Manually add "require subscription" normally this would go in the
// package.json directly but for the Dashboard and Organizations test
// suite to save screenshots they need to be able to access the home 
// page without a subscription.  By adding the server script here a
// subscription is only required when the server is started normally.
const requireSubscription = require.resolve('@layeredapps/stripe-subscriptions/src/server/require-subscription.js')
global.packageJSON.dashboard.serverFilePaths.push(requireSubscription)
global.packageJSON.dashboard.server.push(require(requireSubscription))