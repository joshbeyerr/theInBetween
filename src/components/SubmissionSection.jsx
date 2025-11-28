import { useState } from 'react'
import { motion } from 'framer-motion'
import { SubmissionForm } from './SubmissionForm'

export function SubmissionSection() {
  return (
    <motion.section
      id="submission"
      className="section info-section"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="section-heading">
        <div className="section-label">Submit a Space</div>
        <h2>Know a space we should add?</h2>
        <p>
          Found a creative space that should be on the map? Submit it below and we'll review it.
          We'll verify the details and add it to the directory.
        </p>
      </div>

      <SubmissionForm />
    </motion.section>
  )
}

