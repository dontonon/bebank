import { memo } from 'react'

function TransactionProgress({ isPending, isConfirming, isSuccess }) {
  if (!isPending && !isConfirming && !isSuccess) {
    return null
  }

  const getStep = () => {
    if (isSuccess) return 3
    if (isConfirming) return 2
    if (isPending) return 1
    return 0
  }

  const currentStep = getStep()

  const steps = [
    { id: 1, label: 'Confirm in Wallet', icon: '👛' },
    { id: 2, label: 'Processing Transaction', icon: '⏳' },
    { id: 3, label: 'Success', icon: '✅' }
  ]

  return (
    <div className="bg-dark-card border border-gray-700 rounded-xl p-4 mb-4">
      <div className="space-y-3">
        {steps.map((step) => {
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id

          return (
            <div key={step.id} className="flex items-center space-x-3">
              {/* Step Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                isActive
                  ? 'bg-toxic text-dark animate-pulse'
                  : isCompleted
                  ? 'bg-green-500 text-dark'
                  : 'bg-gray-800 text-gray-600'
              }`}>
                {isCompleted ? '✓' : step.icon}
              </div>

              {/* Step Label and Progress */}
              <div className="flex-1">
                <div className={`font-semibold text-sm transition-all ${
                  isActive
                    ? 'text-toxic'
                    : isCompleted
                    ? 'text-green-400'
                    : 'text-gray-600'
                }`}>
                  {step.label}
                </div>

                {isActive && (
                  <div className="mt-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-toxic to-purple animate-progress"></div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default memo(TransactionProgress)
