/* eslint-env mocha */
const assert = require('assert')
const fs = require('fs')
const pasteText = fs.readFileSync('./node_modules/@layeredapps/dashboard/readme.md').toString()
const TestHelper = require('./test-helper.js')
const TestHelperOrganizations = require('@layeredapps/organizations/test-helper.js')
const TestStripeAccounts = require('@layeredapps/stripe-subscriptions/test-stripe-accounts.js')

describe('example-subscription-web-app screenshots', () => {
  beforeEach(async () => {
    // Manually add "require subscription" normally this would go in the
    // package.json directly but for the Dashboard and Organizations test
    // suite to save screenshots they need to be able to access the home 
    // page without a subscription.  By adding the server script here a
    // subscription is only required for these screenshots.
    const requireSubscription = require.resolve('@layeredapps/stripe-subscriptions/src/server/require-subscription.js')
    global.packageJSON.dashboard.serverFilePaths.push(requireSubscription)
    global.packageJSON.dashboard.server.push(require(requireSubscription))
  })
  it('administrator creates product and plan', async () => {
    const owner = await TestHelper.createOwner()
    const req = TestHelper.createRequest('/home')
    req.account = owner.account
    req.session = owner.session
    req.filename = '/src/www/administrator-creates-product-plan.test.js'
    req.screenshots = [
      { hover: '#administrator-menu-container' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/create-product' },
      {
        fill: '#submit-form',
        body: {
          name: 'product',
          statement_descriptor: 'description',
          unit_label: 'thing'
        }
      },
      { click: '/administrator/subscriptions/publish-product' },
      { fill: '#submit-form' },
      { click: '/administrator/subscriptions' },
      { click: '/administrator/subscriptions/create-plan' },
      {
        fill: '#submit-form',
        body: {
          planid: 'plan' + new Date().getTime(),
          amount: '1000',
          interval: 'month',
          interval_count: '1',
          currency: 'usd',
          productid: 'product',
          usage_type: 'licensed'
        }
      },
      { click: '/administrator/subscriptions/publish-plan' },
      { fill: '#submit-form' }
    ]
    await req.post()
    assert.strictEqual(1, 1)
  })

  it('user 1 registers and must select plan', async () => {
    await TestStripeAccounts.createOwnerWithPlan()
    global.stripeJS = 3
    global.requireSubscription = true
    const req = TestHelper.createRequest('/')
    req.filename = '/src/www/user-creates-account-select-plan.test.js'
    req.screenshots = [
      { click: '/account/register' },
      {
        fill: '#submit-form',
        body: {
          username: 'FirstUser',
          password: '12345678',
          confirm: '12345678'
        },
        waitAfter: async (page) => {
          while (true) {
            try {
              const submitForm = await page.$('#submit-form')
              if (submitForm) {
                return
              }
            } catch (error) {
            }
            await TestHelper.wait(100)
          }
        }
      }
    ]
    const result = await req.post()
    assert.strictEqual(result.redirect, '/home')
  })

  it('user 1 selects plan and must enter billing information', async () => {
    const administrator = await TestStripeAccounts.createOwnerWithPlan()
    global.stripeJS = 3
    global.requireSubscription = true
    const req = TestHelper.createRequest('/')
    req.filename = '/src/www/user-selects-plan-enter-billing.test.js'
    req.screenshots = [
      { click: '/account/register' },
      {
        fill: '#submit-form',
        body: {
          username: 'FirstUser',
          password: '12345678',
          confirm: '12345678'
        },
        waitAfter: async (page) => {
          while (true) {
            try {
              const submitForm = await page.$('#submit-form')
              if (submitForm) {
                return
              }
            } catch (error) {
            }
            await TestHelper.wait(100)
          }
        }
      },
      {
        fill: '#submit-form',
        body: {
          planid: administrator.plan.planid
        },
        waitAfter: async (page) => {
          while (true) {
            try {
              const cardContainerChildren = await page.evaluate(async () => {
                const cardContainer = document.getElementById('card-container')
                return cardContainer && cardContainer.children.length
              })
              const cvcContainerChildren = await page.evaluate(async () => {
                const cvcContainer = document.getElementById('cvc-container')
                return cvcContainer && cvcContainer.children.length
              })
              const expiryContainerChildren = await page.evaluate(async () => {
                const expiryContainer = document.getElementById('expiry-container')
                return expiryContainer && expiryContainer.children.length
              })
              if (cardContainerChildren && cvcContainerChildren && expiryContainerChildren) {
                return
              }
            } catch (error) {
            }
            await TestHelper.wait(100)
          }
        }
      }
    ]
    const result = await req.post()
    assert.strictEqual(result.redirect, '/home')
  })

  it('user 1 registers and subscribes', async () => {
    const administrator = await TestStripeAccounts.createOwnerWithPlan()
    global.stripeJS = 3
    global.requireSubscription = true
    const userIdentity = TestHelper.nextIdentity()
    const req = TestHelper.createRequest('/')
    req.filename = '/src/www/user-creates-account-and-subscription.test.js'
    req.screenshots = [
      { click: '/account/register' },
      {
        fill: '#submit-form',
        body: {
          username: 'FirstUser',
          password: '12345678',
          confirm: '12345678'
        },
        waitAfter: async (page) => {
          while (true) {
            try {
              const submitForm = await page.$('#submit-form')
              if (submitForm) {
                return
              }
            } catch (error) {
            }
            await TestHelper.wait(100)
          }
        }
      },
      {
        fill: '#submit-form',
        body: {
          planid: administrator.plan.planid
        }
      },
      {
        fill: '#form-stripejs-v3',
        body: {
          email: userIdentity.email,
          description: 'Chase',
          name: `${userIdentity.firstName} ${userIdentity.lastName}`,
          'cvc-container': { type: true, value: '111' },
          'card-container': { type: true, value: '4111111111111111' },
          'expiry-container': { type: true, value: '12' + ((new Date().getFullYear() + 1).toString()).substring(2) },
          address_line1: '285 Fulton St',
          address_line2: 'Apt 893',
          address_city: 'New York',
          address_state: 'New York',
          'zip-container': { type: true, value: '10007' },
          address_country: 'US'
        },
        waitBefore: async (page) => {
          while (true) {
            try {
              const cardContainerChildren = await page.evaluate(async () => {
                const cardContainer = document.getElementById('card-container')
                return cardContainer && cardContainer.children.length
              })
              const cvcContainerChildren = await page.evaluate(async () => {
                const cvcContainer = document.getElementById('cvc-container')
                return cvcContainer && cvcContainer.children.length
              })
              const expiryContainerChildren = await page.evaluate(async () => {
                const expiryContainer = document.getElementById('expiry-container')
                return expiryContainer && expiryContainer.children.length
              })
              if (cardContainerChildren && cvcContainerChildren && expiryContainerChildren) {
                return
              }
            } catch (error) {
            }
            await TestHelper.wait(100)
          }
        }
      },
      {
        fill: '#submit-form',
        body: {},
        waitBefore: async (page) => {
          while (true) {
            try {
              const customeridChecked = await page.evaluate(async () => {
                const inputs = document.querySelectorAll('input')
                for (const input of inputs) {
                  if (input.type === 'radio' && input.name === 'customerid') {
                    input.parentNode.click()
                    if (input.checked) {
                      return true
                    }
                  }
                }
              })
              if (customeridChecked) {
                return true
              }
            } catch (error) {
            }
            await TestHelper.wait(100)
          }
        },
        waitAfter: async (page) => {
          while (true) {
            try {
              const postCreator = await page.evaluate(() => {
                const postCreator = document.getElementById('post-creator')
                return postCreator && postCreator.style.display ? postCreator.style.display : 'none'
              })
              if (postCreator === 'block') {
                return
              }
            } catch (error) {
            }
            await TestHelper.wait(100)
          }
        }
      }
    ]
    await req.post()
    assert.strictEqual(1, 1)
  })

  it('user 1 cancels subscription', async () => {
    const administrator = await TestStripeAccounts.createOwnerWithPlan({ amount: 1000 })
    const user = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
    global.requireSubscription = true
    const req = TestHelper.createRequest('/home')
    req.account = user.account
    req.session = user.session
    req.filename = '/src/www/user-cancels-subscription.test.js'
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/subscriptions' },
      { click: '/account/subscriptions/subscriptions' },
      { click: `/account/subscriptions/subscription?subscriptionid=${user.subscription.subscriptionid}` },
      { click: `/account/subscriptions/cancel-subscription?subscriptionid=${user.subscription.subscriptionid}` },
      { fill: '#submit-form' }
    ]
    await req.post()
    assert.strictEqual(1, 1)
  })

  it('user 1 creates post', async () => {
    const user = await TestHelper.createUser()
    const req = TestHelper.createRequest('/home')
    req.account = user.account
    req.session = user.session
    req.filename = '/src/www/user-creates-post.test.js'
    req.screenshots = [{
      fill: '#post-creator',
      body: {
        'post-textarea': pasteText,
        documentid: 'readme.md',
        language: 'MarkDown'
      },
      waitAfter: async (page) => {
        while (true) {
          const postContent = await page.evaluate(() => {
            const postContent = document.getElementById('post-content')
            return postContent.style.display
          })
          if (postContent === 'block') {
            return
          }
          await TestHelper.wait(100)
        }
      }
    }]
    await req.post()
    // TODO: can't detect the rendered post
    assert.strictEqual(1, 1)
  })

  it('user 1 creates organization', async () => {
    const user = await TestHelper.createUser()
    const req = TestHelper.createRequest('/home')
    req.account = user.account
    req.session = user.session
    req.filename = '/src/www/user-creates-organization.test.js'
    req.screenshots = [
      { hover: '#account-menu-container' },
      { click: '/account/organizations' },
      { click: '/account/organizations/create-organization' },
      {
        fill: '#submit-form',
        body: {
          name: 'Developers',
          email: 'organization@email.com',
          'pin': '7890',
          'display-name': 'pm',
          'display-email': 'pm@email.com'
        }
      }
    ]
    const result = await req.post()
    assert.strictEqual(result.redirect.endsWith('message=success'), true)
  })

  it('user 2 creates shared post', async () => {
    const user = await TestHelper.createUser()
    global.userProfileFields = ['display-name', 'display-email']
    global.membershipProfileFields = ['display-name', 'display-email']
    await TestHelper.createProfile(user, {
      'display-name': user.profile.firstName,
      'display-email': user.profile.contactEmail
    })
    await TestHelperOrganizations.createOrganization(user, {
      email: 'organization@' + user.profile.displayEmail.split('@')[1],
      name: 'My organization',
      profileid: user.profile.profileid,
      pin: '1230'
    })
    await TestHelperOrganizations.createInvitation(user)
    const user2 = await TestHelper.createUser()
    global.userProfileFields = ['display-name', 'display-email']
    await TestHelper.createProfile(user2, {
      'display-name': user2.profile.firstName,
      'display-email': user2.profile.contactEmail
    })
    await TestHelperOrganizations.acceptInvitation(user2, user)
    const req = TestHelper.createRequest('/home')
    req.account = user2.account
    req.session = user2.session
    req.filename = '/src/www/user-creates-shared-post.test.js'
    req.screenshots = [
      { save: true },
      {
        fill: '#post-creator',
        body: {
          'post-textarea': pasteText,
          documentid: 'readme.md',
          language: 'MarkDown',
          organization: 'My organization'
        },
        waitAfter: async (page) => {
          while (true) {
            const postContent = await page.evaluate(() => {
              const postContent = document.getElementById('post-content')
              return postContent.style.display
            })
            if (postContent === 'block') {
              return
            }
            await TestHelper.wait(100)
          }
        }
      }]
    await req.post()
    assert.strictEqual(1, 1)
  })

  it('user 1 views shared post', async () => {
    const owner = await TestStripeAccounts.createOwnerWithPlan()
    const user = await TestStripeAccounts.createUserWithPaidSubscription(owner.plan)
    global.userProfileFields = ['display-name', 'display-email']
    global.membershipProfileFields = ['display-name', 'display-email']
    await TestHelper.createProfile(user, {
      'display-name': user.profile.firstName,
      'display-email': user.profile.contactEmail
    })
    await TestHelperOrganizations.createOrganization(user, {
      email: 'organization@' + user.profile.displayEmail.split('@')[1],
      name: 'My organization',
      profileid: user.profile.profileid,
      pin: '1230'
    })
    await TestHelperOrganizations.createInvitation(user)
    const req = TestHelper.createRequest('/home')
    req.account = user.account
    req.session = user.session
    req.body = {
      'post-textarea': pasteText,
      documentid: 'readme.md',
      language: 'MarkDown',
      organization: 'My organization'
    }
    req.waitBefore = async (page) => {
      while (true) {
        const postCreator = await page.evaluate(() => {
          const postCreator = document.getElementById('post-creator')
          return postCreator ? postCreator.style.display : null
        })
        if (postCreator === 'block') {
          return
        }
        await TestHelper.wait(100)
      }
    }
    req.waitAfter = async (page) => {
      while (true) {
        const postContent = await page.evaluate(() => {
          const postContent = document.getElementById('post-content')
          return postContent ? postContent.style.display : null
        })
        if (postContent === 'block') {
          return
        }
        await TestHelper.wait(100)
      }
    }
    await req.post()
    const user2 = await TestStripeAccounts.createUserWithPaidSubscription(owner.plan)
    global.userProfileFields = ['display-name', 'display-email']
    await TestHelper.createProfile(user2, {
      'display-name': user2.profile.firstName,
      'display-email': user2.profile.contactEmail
    })
    await TestHelperOrganizations.acceptInvitation(user2, user)
    const req2 = TestHelper.createRequest('/home')
    req2.account = user2.account
    req2.session = user2.session
    req2.filename = '/src/www/user-views-shared-post.test.js'
    req2.screenshots = [
      { save: true },
      {
        click: '#organization-list-button',
        waitAfter: async (page) => {
          while (true) {
            const postLink = await page.evaluate(() => {
              const postLinks = document.getElementsByTagName('a')
              for (let i = 0, len = postLinks.length; i < len; i++) {
                if (postLinks[i].innerHTML === 'readme.md') {
                  return true
                }
              }
              return false
            })
            if (postLink) {
              return
            }
            await TestHelper.wait(100)
          }
        }
      },
      {
        click: '/document/readme.md',
        waitAfter: async (page) => {
          while (true) {
            const postContent = await page.evaluate(() => {
              const postContent = document.getElementById('post-content')
              return postContent.style.display
            })
            if (postContent === 'block') {
              return
            }
            await TestHelper.wait(100)
          }
        }
      }
    ]
    await req2.get()
    assert.strictEqual(1, 1)
  })
})
