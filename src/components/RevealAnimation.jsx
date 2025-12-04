import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function RevealAnimation({ token, amount, onComplete }) {
  const [stage, setStage] = useState('mystery') // mystery -> opening -> revealed

  useEffect(() => {
    // Auto-progress through stages
    const timer1 = setTimeout(() => setStage('opening'), 500)
    const timer2 = setTimeout(() => setStage('revealed'), 1500)
    const timer3 = setTimeout(() => onComplete && onComplete(), 3000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Mystery Stage */}
        {stage === 'mystery' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-6"
          >
            <div className="text-8xl animate-float">🎁</div>
            <h2 className="text-3xl font-bold text-gray-300">Opening your potato...</h2>
          </motion.div>
        )}

        {/* Opening Stage */}
        {stage === 'opening' && (
          <motion.div
            initial={{ scale: 1, rotate: 0 }}
            animate={{ scale: 1.2, rotate: 360 }}
            transition={{ duration: 0.8 }}
            className="text-8xl"
          >
            ✨
          </motion.div>
        )}

        {/* Revealed Stage */}
        {stage === 'revealed' && (
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="space-y-6"
          >
            <div className="text-9xl">{token.logo}</div>
            <div>
              <h2 className="text-2xl text-gray-400 mb-2">You received</h2>
              <div className="text-6xl font-bold gradient-text">
                {amount} {token.symbol}
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-toxic text-xl font-semibold"
            >
              🎉 Potato claimed successfully!
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
