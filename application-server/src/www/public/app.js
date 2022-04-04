const elements = {}

window.onload = function () {
  const cacheElements = [
    /* navigation */ 'create-button', 'list-button', 'organization-list-button',
    /* content */ 'list', 'organization-list', 'post-content', 'post-creator',
    /* viewing posts  */ 'view', 'view-organization', 'view-organization-post-owner', 'postid-1', 'postid-2', 'postid-3', 'line-numbers', 'post-preview', 'delete-1', 'delete-3',
    /* listing posts  */ 'list-table', 'organization-list-table', 'no-posts-1', 'no-posts-2',
    /* creating posts */ 'post-textarea', 'documentid', 'language', 'public', 'organization', 'organization-container', 'submit-button']
  for (let i = 0, len = cacheElements.length; i < len; i++) {
    elements[cacheElements[i]] = document.getElementById(cacheElements[i])
  }
  // main navigation buttons
  elements['create-button'].onclick = function () {
    elements['post-textarea'].value = ''
    elements['post-textarea'].focus()
    elements.language.selectedIndex = 0
    elements.documentid.value = ''
    return showContent('post-creator')
  }
  elements['list-button'].onclick = function () {
    if (elements['list-table'].rows.length === 1) {
      elements['list-table'].style.display = 'none'
      elements['no-posts-1'].style.display = ''
    } else {
      elements['list-table'].style.display = ''
      elements['no-posts-1'].style.display = 'none'
    }
    return showContent('list')
  }
  if (window.user.organizations && window.user.organizations.length) {
    elements['organization-list-button'].onclick = function () {
      if (elements['organization-list-table'].rows.length === 1) {
        elements['organization-list-table'].style.display = 'none'
        elements['no-posts-2'].style.display = ''
      } else {
        elements['organization-list-table'].style.display = ''
        elements['no-posts-2'].style.display = 'none'
      }
      return showContent('organization-list')
    }
  } else {
    elements['organization-list-button'].style.display = 'none'
    elements['organization-container'].style.display = 'none'
  }
  // other content buttons
  elements['submit-button'].onclick = saveNewDocument
  elements['delete-1'].onclick = deletePost
  elements['delete-3'].onclick = deletePost
  // clear default text when clicking textarea
  elements['post-textarea'].onclick = function () {
    if (this.value === 'Paste your text here...') {
      this.value = ''
    }
  }
  elements.language.onchange = function () {
    const extension = this.value
    if (!extension) {
      return
    }
    let newid = elements.documentid.value
    const oldPeriod = newid.indexOf('.')
    if (oldPeriod > -1) {
      newid = newid.substring(0, oldPeriod)
    }
    newid += '.' + extension
    elements.documentid.value = newid
  }
  // sets up your own posts with delete options
  listPosts()
  // sets up your organization's posts
  if (window.user.organizations && window.user.organizations.length) {
    for (let i = 0, len = window.user.organizations.length; i < len; i++) {
      listPosts(window.user.organizations[i].organizationid)
      const option = document.createElement('option')
      option.value = window.user.organizations[i].organizationid
      option.text = window.user.organizations[i].name
      elements.organization.appendChild(option)
    }
  }
  // display the initial content
  const content = window.sessionStorage.getItem('content')
  showContent(content || 'post-creator')
  if (content === 'post-content') {
    const post = window.sessionStorage.getItem('post')
    if (post) {
      showPostContents(JSON.parse(post))
    }
  }
  // list table
  if (elements['list-table'].rows.length === 1) {
    elements['list-table'].style.display = 'none'
    elements['no-posts-1'].style.display = ''
  } else {
    elements['list-table'].style.display = ''
    elements['no-posts-1'].style.display = 'none'
  }
}

function listPosts (organizationid) {
  const path = organizationid ? '/api/user/organization-documents?organizationid=' + organizationid : '/api/user/documents?accountid=' + window.user.account.accountid
  return send(path, null, 'GET', function (error, posts) {
    if (error) {
      return showMessage(error.message, 'error')
    }
    if (!window.user.organizations || !window.user.organizations.length) {
      document.getElementById('organization-column').style.display = 'none'
    }
    if (posts && posts.length) {
      for (let i = 0, len = posts.length; i < len; i++) {
        renderPostRow(!organizationid, posts[i])
      }
    }
  })
}

function loadDocument (event) {
  event.preventDefault()
  const link = event.target
  const path = '/api/user/document?documentid=' + link.innerHTML
  elements['post-preview'].innerHTML = ''
  elements['line-numbers'].innerHTML = ''
  return send(path, null, 'GET', function (error, result) {
    if (error) {
      return showMessage(error.message, 'error')
    }
    result.document = decodeURI(result.document)
    return showPostContents(result)
  })
}

function saveNewDocument () {
  const postSettings = {}
  if (window.user.organizations && window.user.organizations.length) {
    if (elements.organization.selectedIndex > 0) {
      postSettings.organizationid = elements.organization.options[elements.organization.selectedIndex].value
    }
  }
  const isPublic = elements.public = elements.public || document.getElementById('public')
  if (isPublic.checked) {
    postSettings.public = true
  }
  if (elements.documentid.value) {
    postSettings.documentid = elements.documentid.value
    // validate here
    const parts = postSettings.documentid.split('.')
    if (parts.length > 2) {
      return showMessage('Filenames must be alphanumeric, with optional supported file extensions.')
    } else if (parts.length === 2) {
      if (/[^a-zA-Z0-9]+/.test(parts[0])) {
        return showMessage('Filenames must be alphanumeric, with optional supported file extensions.')
      }
      const extension = parts[parts.length - 1].toLowerCase()
      let found = false
      for (let i = 0, len = elements.language.options.length; i < len; i++) {
        found = elements.language.options[i].value === extension
        if (found) {
          break
        }
      }
      if (!found) {
        return showMessage('An unsupported extension was provided')
      }
    } else {
      if (/[^a-zA-Z0-9]+/.test(parts[0])) {
        return showMessage('Filenames must be alphanumeric, with optional supported file extensions.')
      }
    }
  }
  if (!elements['post-textarea'].value || !elements['post-textarea'].value.length) {
    return showMessage('No document to save', 'error')
  }
  postSettings.document = encodeURI(elements['post-textarea'].value)
  return send('/api/user/create-document?accountid=' + window.user.account.accountid, postSettings, 'POST', function (error, result) {
    if (error) {
      return showMessage(error.message, 'error')
    }
    renderPostRow(!postSettings.organization, result)
    result.document = decodeURI(postSettings.document)
    return showPostContents(result)
  })
}

function deletePost (event) {
  const button = event.target
  const path = '/api/user/delete-document?documentid=' + button.documentid
  return send(path, null, 'DELETE', function (error) {
    if (error) {
      return showMessage(error.message, 'error')
    }
    const personal = document.getElementById('personal-' + button.documentid)
    if (personal) {
      personal.parentNode.removeChild(personal)
      if (elements['list-table'].rows.length === 1) {
        elements['list-table'].style.display = 'none'
        elements['no-posts-1'].style.display = ''
      } else {
        elements['list-table'].style.display = ''
        elements['no-posts-1'].style.display = 'none'
      }
    }
    const organization = document.getElementById('organization-' + button.documentid)
    if (organization) {
      organization.parentNode.removeChild(organization)
      if (elements['organization-list-table'].rows.length === 1) {
        elements['organization-list-table'].style.display = 'none'
        elements['no-posts-2'].style.display = ''
      } else {
        elements['organization-list-table'].style.display = ''
        elements['no-posts-2'].style.display = 'none'
      }
    }
    showContent('list')
    return showMessage('Key deleted successfully', 'success')
  })
}

function showPostContents (post) {
  window.sessionStorage.setItem('post', JSON.stringify(post))
  if (!post.organizationid) {
    elements.view.style.display = ''
    elements['view-organization'].style.display = 'none'
    elements['view-organization-post-owner'].style.display = 'none'
    elements['postid-1'].innerHTML = post.documentid
    elements['delete-1'].documentid = post.documentid
  } else if (post.accountid === window.user.accountid) {
    elements.view.style.display = 'none'
    elements['view-organization'].style.display = 'none'
    elements['view-organization-post-owner'].style.display = ''
    elements['postid-3'].innerHTML = post.documentid
    elements['delete-3'].documentid = post.documentid
  } else {
    elements.view.style.display = 'none'
    elements['view-organization'].style.display = ''
    elements['view-organization-post-owner'].style.display = 'none'
    elements['postid-2'].innerHTML = post.documentid
  }
  let high
  try {
    if (post.language === 'txt') {
      high = { value: htmlEscape(post.document) }
    } else if (post.language === 'html') {
      high = window.hljs.highlight('html', htmlEscape(post.document))
    } else if (post.language) {
      high = window.hljs.highlight(post.language, post.document)
    } else {
      high = window.hljs.highlightAuto(post.document)
    }
  } catch (error) {
    high = window.hljs.highlightAuto(post.document)
  }
  elements['post-preview'].innerHTML = high.value
  elements['post-preview'].focus()
  addLineNumbers(post.document.split('\n').length)
  return showContent('post-content')
}

function renderPostRow (personal, meta) {
  const table = document.getElementById(personal ? 'list-table' : 'organization-list-table')
  const row = table.insertRow(table.rows.length)
  row.id = (personal ? 'personal-' : 'organization-') + meta.documentid
  const keyLink = document.createElement('a')
  keyLink.id = meta.documentid
  keyLink.innerHTML = meta.documentid
  keyLink.onclick = loadDocument
  keyLink.href = '/document/' + meta.documentid
  const keyCell = row.insertCell(0)
  keyCell.appendChild(keyLink)
  const createdCell = row.insertCell(1)
  createdCell.innerHTML = meta.createdAt
  let nextCell = 2
  if (personal && window.user.organizations && window.user.organizations.length) {
    const organizationCell = row.insertCell(2)
    if (meta.organizationid) {
      organizationCell.innerHTML = 'yes'
    }
    nextCell = 3
  }
  const publicCell = row.insertCell(nextCell)
  if (meta.public) {
    const publicLink = document.createElement('a')
    publicLink.href = 'https://' + window.publicDomain + '/document/' + window.user.dashboard.split('://')[1] + '/' + meta.documentid
    publicLink.innerHTML = 'yes'
    publicLink.target = '_blank'
    publicCell.appendChild(publicLink)
  }
  if (personal) {
    const deleteCell = row.insertCell(nextCell + 1)
    const deleteButton = document.createElement('button')
    deleteButton.innerHTML = 'delete'
    deleteButton.documentid = meta.documentid
    deleteButton.onclick = deletePost
    deleteCell.appendChild(deleteButton)
  }
}

function showContent (type) {
  window.sessionStorage.setItem('content', type)
  // active content button
  elements['create-button'].className = type === 'post-creator' ? 'active' : ''
  elements['list-button'].className = type === 'list' ? 'active' : ''
  elements['organization-list-button'].className = type === 'organization-list' ? 'active' : ''
  // active content type
  elements.list.style.display = type === 'list' ? 'block' : 'none'
  elements['organization-list'].style.display = type === 'organization-list' ? 'block' : 'none'
  elements['post-content'].style.display = type === 'post-content' ? 'block' : 'none'
  elements['post-creator'].style.display = type === 'post-creator' ? 'block' : 'none'
  // list table
  if (elements['list-table'].rows.length === 1) {
    elements['list-table'].style.display = 'none'
    elements['no-posts-1'].style.display = ''
  } else {
    elements['list-table'].style.display = ''
    elements['no-posts-1'].style.display = 'none'
  }
}

function htmlEscape (s) {
  return s.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

function showMessage (message, css) {
  // TODO: message handling
}

function addLineNumbers (lineCount) {
  const h = ['<ol>']
  for (let i = 0; i < lineCount; i++) {
    h.push('<li></li>')
  }
  elements['line-numbers'].innerHTML = h.join('') + '</ol>'
}

function send (url, data, method, callback) {
  let postData
  if (data) {
    postData = new window.FormData()
    for (const key in data) {
      postData.append(key, data[key])
    }
  }
  let x
  if (window.useXMLHttpRequest || typeof XMLHttpRequest !== 'undefined') {
    window.useXMLHttpRequest = true
    x = new window.XMLHttpRequest()
  } else if (window.compatibleActiveXObject !== null) {
    x = new window.ActiveXObject(window.compatibleActiveXObject)
  } else {
    const xhrversions = ['MSXML2.XmlHttp.5.0', 'MSXML2.XmlHttp.4.0', 'MSXML2.XmlHttp.3.0', 'MSXML2.XmlHttp.2.0', 'Microsoft.XmlHttp']
    for (let i = 0, len = xhrversions.length; i < len; i++) {
      try {
        x = new window.ActiveXObject(xhrversions[i])
        window.compatibleActiveXObject = xhrversions[i]
      } catch (e) { }
    }
  }
  x.open(method, url, true)
  x.onreadystatechange = function () {
    if (x.readyState !== 4) {
      return
    }
    if (!x.responseText) {
      return callback()
    }
    let json
    switch (x.status) {
      case 200:
        try {
          json = JSON.parse(x.responseText)
          return callback(null, json)
        } catch (error) {
          return callback(error)
        }
      case 500:
        try {
          json = JSON.parse(x.responseText)
          return callback(new Error(json.message))
        } catch (error) {
          return callback(error)
        }
    }
  }
  x.send(postData)
}
