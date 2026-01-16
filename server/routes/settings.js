const express = require('express')
const { body, validationResult } = require('express-validator')
const Settings = require('../models/Settings')
const { auth, requireRole } = require('../middleware/auth')

const router = express.Router()

// Helper to get or create settings singleton
async function getOrCreateSettings() {
  // Add timeout to prevent hanging on slow database queries
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Database query timeout')), 5000)
  })
  
  const query = Settings.findOne()
  const doc = await Promise.race([query, timeout])
  
  if (!doc) {
    const newDoc = new Settings({})
    await newDoc.save()
    return newDoc
  }
  return doc
}

// @desc    Get store settings
// @route   GET /api/settings
// @access  Private/Admin
router.get('/', [auth, requireRole('admin')], async (req, res) => {
  try {
    const settings = await getOrCreateSettings()
    res.json({ status: 'success', data: { settings } })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ status: 'error', message: 'Server error' })
  }
})

// @desc    Get public store settings (limited fields)
// @route   GET /api/settings/public
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const settings = await getOrCreateSettings()
    const publicSettings = {
      currency: settings.currency,
      storePhone: settings.storePhone,
    }
    res.json({ status: 'success', data: { settings: publicSettings } })
  } catch (error) {
    console.error('Get public settings error:', error)
    res.status(500).json({ status: 'error', message: 'Server error' })
  }
})

// @desc    Update store settings
// @route   PUT /api/settings
// @access  Private/Admin
router.put('/', [
  auth,
  requireRole('admin'),
  body('storeName').optional().trim().isLength({ min: 2, max: 100 }),
  body('storeEmail').optional().isEmail().normalizeEmail(),
  body('storePhone').optional().trim().isLength({ min: 7, max: 30 }),
  body('storeAddress').optional().trim().isLength({ min: 5, max: 200 }),
  body('currency').optional().trim().isLength({ min: 2, max: 10 }),
  body('taxRate').optional().isFloat({ min: 0, max: 100 }),
  body('emailNotifications').optional().isBoolean(),
  body('orderNotifications').optional().isBoolean(),
  body('inventoryAlerts').optional().isBoolean(),
  body('maintenanceMode').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors: errors.array() })
    }

    const settings = await getOrCreateSettings()
    Object.assign(settings, req.body)
    await settings.save()

    res.json({ status: 'success', message: 'Settings updated successfully', data: { settings } })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ status: 'error', message: 'Server error' })
  }
})

module.exports = router