const mongoose = require('mongoose')

const SettingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'Aguizoul Caftan', trim: true },
  storeEmail: { type: String, default: 'info@caftanelegance.com', trim: true },
  storePhone: { type: String, default: '+212 5XX-XXXXXX', trim: true },
  storeAddress: { type: String, default: '123 Medina Street, Casablanca, Morocco', trim: true },
  currency: { type: String, default: 'MAD', trim: true },
  taxRate: { type: Number, default: 20 },
  emailNotifications: { type: Boolean, default: true },
  orderNotifications: { type: Boolean, default: true },
  inventoryAlerts: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
}, { timestamps: true })

// Ensure a singleton settings document by index
SettingsSchema.index({}, { unique: false })

module.exports = mongoose.model('Settings', SettingsSchema)