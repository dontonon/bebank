import { useState } from 'react'

const CATEGORIES = [
  'Protocol Partnerships',
  'Content Creation',
  'Consulting/Advisory',
  'Dune Analytics',
  'Other'
]

const FREQUENCIES = [
  'Monthly',
  'Bi-weekly',
  'Weekly',
  'One-time',
  'Quarterly',
  'Annually'
]

function AddEditSource({ source, onSave, onClose }) {
  const [formData, setFormData] = useState(source || {
    name: '',
    category: 'Protocol Partnerships',
    monthlyAmount: '',
    frequency: 'Monthly',
    startDate: new Date().toISOString().split('T')[0],
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.monthlyAmount) {
      alert('Please fill in all required fields')
      return
    }
    onSave(formData)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-2xl p-8 max-w-2xl w-full border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold gradient-text">
            {source ? 'Edit Income Source' : 'Add New Income Source'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-gray-300 font-semibold mb-2">
              Source Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Aave Partnership, YouTube Ad Revenue"
              className="w-full bg-dark-bg border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-toxic-green focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-gray-300 font-semibold mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-toxic-green focus:outline-none transition-colors"
              required
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Amount and Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Monthly Amount ($) *
              </label>
              <input
                type="number"
                name="monthlyAmount"
                value={formData.monthlyAmount}
                onChange={handleChange}
                placeholder="5000"
                step="0.01"
                min="0"
                className="w-full bg-dark-bg border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-toxic-green focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Frequency
              </label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                className="w-full bg-dark-bg border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-toxic-green focus:outline-none transition-colors"
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-gray-300 font-semibold mb-2">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full bg-dark-bg border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-toxic-green focus:outline-none transition-colors"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-toxic-green to-neon-purple text-dark-bg py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-toxic-green/50 transition-all duration-300 transform hover:scale-105"
            >
              {source ? 'Update Source' : 'Add Source'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 text-gray-300 py-3 rounded-lg font-bold hover:bg-gray-600 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddEditSource
