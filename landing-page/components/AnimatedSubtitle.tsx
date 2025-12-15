'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const phrases = [
  'Find new friends.',
  'Find new roommates.',
  'Find new clubs.',
]

export default function AnimatedSubtitle() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % phrases.length)
    }, 2600) // Match the app's timing

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-16 sm:h-20 lg:h-24 flex items-center justify-center lg:justify-start overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-medium text-gray-700"
        >
          {phrases[currentIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
