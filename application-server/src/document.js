const { Sequelize, Model, DataTypes } = require('sequelize')
const crypto = require('crypto')
const validExtensions = [
  'bash', 'coffee', 'cpp', 'css', 'pas',
  'diff', 'erl', 'go', 'hs', 'html', 'ini',
  'java', 'js', 'json', 'lisp', 'lua', 'md',
  'm', 'php', 'pl', 'py', 'rb', 'scala',
  'sm', 'sql', 'swift', 'tex', 'txt', 'vala',
  'vbs', 'xml'
]

let sequelize
if (process.env.SQLITE_DATABASE_FILE) {
  sequelize = new Sequelize(process.env.SQLITE_DATABASE || 'dashboard', '', '', {
    storage: process.env.SQLITE_DATABASE_FILE,
    dialect: 'sqlite',
    logging: false
  })
} else {
  sequelize = new Sequelize('sqlite::memory', {
    dialect: 'sqlite',
    logging: false
  })
}

class Document extends Model {}
Document.init({
  documentid: {
    type: DataTypes.STRING(32),
    primaryKey: true,
    defaultValue: () => {
      return Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2)
    }
  },
  accountid: DataTypes.STRING(32),
  organizationid: DataTypes.STRING(32),
  document: DataTypes.TEXT
}, {
  sequelize,
  modelName: 'document'
})

sequelize.sync()

module.exports = {
  load,
  list,
  listOrganization,
  remove,
  create
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

async function create (document, documentid, public, accountid, organizationid) {
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
  return Document.create({
    documentid,
    document,
    accountid,
    organizationid,
    public,
  })
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

function md5 (str) {
  const md5sum = crypto.createHash('md5')
  md5sum.update(str)
  return md5sum.digest('hex')
}
