const crypto = require('crypto')
const { Sequelize, Model, DataTypes } = require('sequelize')
const validExtensions = [
  'bash', 'coffee', 'cpp', 'css', 'pas',
  'diff', 'erl', 'go', 'hs', 'html', 'ini',
  'java', 'js', 'json', 'lisp', 'lua', 'md',
  'm', 'php', 'pl', 'py', 'rb', 'scala',
  'sm', 'sql', 'swift', 'tex', 'txt', 'vala',
  'vbs', 'xml'
]

let sequelize
class Document extends Model {}

module.exports = {
  start: async () => {
    if (sequelize) {
      await sequelize.close()
      sequelize = null
    }
    sequelize = new Sequelize('sqlite::memory', {
      dialect: 'sqlite',
      logging: false
    })
    Document.init({
      documentid: {
        type: DataTypes.STRING(32),
        primaryKey: true,
        defaultValue: () => {
          return crypto.randomBytes(32).toString('hex').substring(0, 6)
        }
      },
      accountid: DataTypes.STRING(32),
      organizationid: DataTypes.STRING(32),
      document: DataTypes.TEXT,
      public: DataTypes.BOOLEAN
    }, {
      sequelize,
      modelName: 'document'
    })
    // table creation
    await sequelize.sync()
  },
  validExtensions,
  load,
  list,
  listOrganization,
  remove,
  create,
  flush
}

async function flush () {
  await Document.sync({ force: true })
}

async function load (documentid) {
  if (!documentid || !documentid.length) {
    throw new Error('invalid-documentid')
  }
  const documentInfo = await Document.findOne({
    where: {
      documentid
    }
  })
  return documentInfo.dataValues
}

async function list (accountid) {
  const documentInfo = await Document.findAll({
    where: {
      accountid
    }
  })
  const documents = []
  for (const documentItem of documentInfo) {
    documents.push(documentItem.dataValues)
  }
  return documents
}

async function listOrganization (organizationid) {
  const documentInfo = await Document.findAll({
    where: {
      organizationid
    }
  })
  const documents = []
  for (const documentItem of documentInfo) {
    documents.push(documentItem.dataValues)
  }
  return documents
}

async function remove (documentid) {
  if (!documentid || !documentid.length) {
    throw new Error('invalid-documentid')
  }
  await Document.destroy({
    where: {
      documentid
    }
  })
  return true
}

async function create (document, documentid, isPublic, accountid, organizationid) {
  if (!document || !document.length) {
    throw new Error('invalid-document')
  }
  if (global.maxLength && document.length > global.maxLength) {
    throw new Error('invalid-document-length')
  }
  if (documentid) {
    const parts = documentid.split('.')
    if (parts.length > 2) {
      throw new Error('invalid-filename')
    } else if (parts.length === 2) {
      if (/[^a-zA-Z0-9]+/.test(parts[0])) {
        throw new Error('invalid-filename')
      }
      const extension = parts[parts.length - 1].toLowerCase()
      if (validExtensions.indexOf(extension) === -1) {
        throw new Error('invalid-filename-extension')
      }
    } else {
      if (/[^a-zA-Z0-9]+/.test(parts[0])) {
        throw new Error('invalid-filename')
      }
    }
    try {
      const existing = await load(documentid)
      if (existing) {
        throw new Error('duplicate-documentid')
      }
    } catch (error) {
    }
  } else {
    documentid = await generateUniqueKey()
  }
  const record = await Document.create({
    documentid,
    document,
    accountid,
    organizationid,
    public: !!isPublic
  })
  return record.dataValues
}

async function generateUniqueKey () {
  const keyspace = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  while (true) {
    let text = ''
    for (let i = 0; i < global.keyLength; i++) {
      const index = Math.floor(Math.random() * keyspace.length)
      text += keyspace.charAt(index)
    }
    try {
      await load(text)
    } catch (error) {
      return text
    }
  }
}
