const dashboard = require('@layeredapps/dashboard')
dashboard.start(__dirname)
delete (global.sitemap['/'])
delete (global.sitemap['/home'])
