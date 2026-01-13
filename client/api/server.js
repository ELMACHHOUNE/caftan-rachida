const serverless = require('serverless-http')
const app = require('../server/server')
const { connectDB } = require('../server/lib/db')

const handler = serverless(app)

module.exports = async (req, res) => {
  try {
    await connectDB()
  } catch (err) {
    console.error('DB connect failed:', err)
    res.statusCode = 500
    return res.end('Internal Server Error')
  }
  return handler(req, res)
}
