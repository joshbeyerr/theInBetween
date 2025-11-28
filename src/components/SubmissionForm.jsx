import { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export function SubmissionForm() {
  const [formData, setFormData] = useState({
    spaceName: '',
    address: '',
    additionalInfo: '',
    email: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: null, message: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      // Use proxy path if API_BASE_URL is not set (for dev), otherwise use full URL
      const url = API_BASE_URL ? `${API_BASE_URL}/api/submissions` : '/api/submissions'
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      // Check content type before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response:', text.substring(0, 200))
        throw new Error(`Server returned ${response.status}. Please make sure the server is running.`)
      }

      if (!response.ok) {
        // Try to parse error, but handle HTML responses
        let errorMessage = 'Failed to submit'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON (e.g., HTML error page), use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setSubmitStatus({ type: 'success', message: 'Thank you! Your submission has been received. We\'ll review it and get back to you soon.' })
      
      // Reset form
      setFormData({
        spaceName: '',
        address: '',
        additionalInfo: '',
        email: '',
      })
    } catch (err) {
      setSubmitStatus({ type: 'error', message: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="submission-form">
      <div className="submission-form-grid">
        <div className="submission-form-group">
          <label htmlFor="spaceName">
            Space Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="spaceName"
            name="spaceName"
            value={formData.spaceName}
            onChange={handleChange}
            required
            placeholder="e.g., Maker Space Toronto"
          />
        </div>

        <div className="submission-form-group">
          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g., 123 Main St, Toronto, ON"
          />
        </div>

        <div className="submission-form-group submission-form-group-full">
          <label htmlFor="additionalInfo">Additional Info</label>
          <textarea
            id="additionalInfo"
            name="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleChange}
            rows="4"
            placeholder="Vibes, hours, pricing, website, or any other useful information..."
          />
        </div>

        <div className="submission-form-group submission-form-group-full">
          <label htmlFor="email">
            Email <span className="required">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="your.email@example.com"
          />
          <small>We'll use this to follow up about your submission.</small>
        </div>
      </div>

      {submitStatus.message && (
        <div className={`submission-status submission-status-${submitStatus.type}`}>
          {submitStatus.message}
        </div>
      )}

      <div className="submission-form-actions">
        <button type="submit" disabled={isSubmitting} className="submission-submit-btn">
          {isSubmitting ? 'Submitting...' : 'Submit Space'}
        </button>
      </div>
    </form>
  )
}

