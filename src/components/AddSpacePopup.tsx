import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './AddSpacePopup.css';

interface AddSpacePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onGeocode: (address: string) => Promise<{ lat: number; lng: number } | null>;
  onSubmit: (data: {
    spaceName: string;
    address: string;
    additionalInfo: string;
    email: string;
    lat?: number;
    lng?: number;
  }) => Promise<void>;
}

export function AddSpacePopup({ isOpen, onClose, onGeocode, onSubmit }: AddSpacePopupProps) {
  const [step, setStep] = useState<'address' | 'form' | 'success'>('address');
  const [address, setAddress] = useState('');
  const [geocodedLocation, setGeocodedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  
  const [formData, setFormData] = useState({
    spaceName: '',
    additionalInfo: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleAddressNext = async () => {
    if (!address.trim()) {
      setGeocodeError('Please enter an address');
      return;
    }

    setIsGeocoding(true);
    setGeocodeError('');

    try {
      const location = await onGeocode(address);
      if (location) {
        setGeocodedLocation(location);
        setStep('form');
      } else {
        setGeocodeError('Could not find this address. Please try again.');
      }
    } catch (err) {
      setGeocodeError(err instanceof Error ? err.message : 'Failed to geocode address');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.spaceName.trim() || !formData.email.trim()) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await onSubmit({
        spaceName: formData.spaceName,
        address: address,
        additionalInfo: formData.additionalInfo,
        email: formData.email,
        lat: geocodedLocation?.lat,
        lng: geocodedLocation?.lng,
      });
      setStep('success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('address');
    setAddress('');
    setGeocodedLocation(null);
    setGeocodeError('');
    setFormData({ spaceName: '', additionalInfo: '', email: '' });
    setSubmitError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="add-space-popup"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <button className="add-space-close" onClick={handleClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M15 5L5 15M5 5l10 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <AnimatePresence mode="wait">
          {step === 'address' && (
            <motion.div
              key="address"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="add-space-step"
            >
              <h2 className="add-space-title">Add a Space</h2>
              <p className="add-space-subtitle">Enter the address to get started</p>
              
              <div className="add-space-form-group">
                <label htmlFor="address-input">Address</label>
                <input
                  id="address-input"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., 123 Main St, Toronto, ON"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddressNext();
                    }
                  }}
                />
                {geocodeError && (
                  <div className="add-space-error">{geocodeError}</div>
                )}
              </div>

              <div className="add-space-actions">
                <button
                  type="button"
                  onClick={handleAddressNext}
                  disabled={isGeocoding}
                  className="add-space-btn add-space-btn-primary"
                >
                  {isGeocoding ? 'Finding location...' : 'Next'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="add-space-step"
            >
              <h2 className="add-space-title">Space Details</h2>
              <p className="add-space-subtitle">Tell us about this space</p>

              <form onSubmit={handleFormSubmit}>
                <div className="add-space-form-group">
                  <label htmlFor="spaceName">
                    Space Name <span className="required">*</span>
                  </label>
                  <input
                    id="spaceName"
                    type="text"
                    value={formData.spaceName}
                    onChange={(e) =>
                      setFormData({ ...formData, spaceName: e.target.value })
                    }
                    required
                    placeholder="e.g., Maker Space Toronto"
                  />
                </div>

                <div className="add-space-form-group">
                  <label htmlFor="email">
                    Email <span className="required">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    placeholder="your.email@example.com"
                  />
                  <small>We'll use this to follow up about your submission.</small>
                </div>

                <div className="add-space-form-group">
                  <label htmlFor="additionalInfo">Additional Info</label>
                  <textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) =>
                      setFormData({ ...formData, additionalInfo: e.target.value })
                    }
                    rows={4}
                    placeholder="Vibes, hours, pricing, website, or any other useful information..."
                  />
                </div>

                {submitError && (
                  <div className="add-space-error">{submitError}</div>
                )}

                <div className="add-space-actions">
                  <button
                    type="button"
                    onClick={() => setStep('address')}
                    className="add-space-btn add-space-btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="add-space-btn add-space-btn-primary"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="add-space-step add-space-success"
            >
              <div className="add-space-success-icon">✓</div>
              <h2 className="add-space-title">Submitted for Review</h2>
              <p className="add-space-subtitle">
                Thank you! Your submission has been received. We'll review it and get back to you soon.
              </p>
              <button
                onClick={handleClose}
                className="add-space-btn add-space-btn-primary"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

