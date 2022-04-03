const Document = require('../../../document.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.documentid) {
      throw new Error('invalid-documentid')
    }
    try {
      await Document.remove(req.query.documentid)
    } catch (error) {
      throw new Error(error.message)
    }
    return true
  }
}
