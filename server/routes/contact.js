const express = require('express')
const { body, validationResult } = require('express-validator')
const ContactMessage = require('../models/ContactMessage')

const router = express.Router()

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('subject').trim().isLength({ min: 3, max: 150 }).withMessage('Subject must be between 3 and 150 characters'),
    body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: errors.array(),
        })
      }

      const { name, email, subject, message } = req.body

      const doc = await ContactMessage.create({
        name,
        email,
        subject,
        message,
        ip: req.ip,
        userAgent: req.get('user-agent') || '',
      })

      return res.status(201).json({
        status: 'success',
        message: 'Message received. We will get back to you shortly.',
        data: {
          id: doc._id,
          createdAt: doc.createdAt,
        },
      })
    } catch (error) {
      console.error('Contact submit error:', error)
      return res.status(500).json({ status: 'error', message: error?.message || 'Server error' })
    }
  }
)

module.exports = router
