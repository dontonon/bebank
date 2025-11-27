/**
 * Analytics utility for tracking user events
 * Uses Plausible Analytics for privacy-focused tracking
 */

/**
 * Track a custom event with Plausible
 * @param {string} eventName - Name of the event
 * @param {object} props - Optional properties to track with the event
 */
export function trackEvent(eventName, props = {}) {
  // Check if Plausible is loaded
  if (typeof window !== 'undefined' && window.plausible) {
    try {
      window.plausible(eventName, { props })
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }
}

/**
 * Track link creation
 */
export function trackPotatoCreated(tokenSymbol, amount) {
  trackEvent('Link Created', {
    token: tokenSymbol,
    amount: parseFloat(amount).toFixed(4)
  })
}

/**
 * Track link claim
 */
export function trackPotatoClaimed(tokenReceived, amountReceived, tokenGiven, amountGiven) {
  trackEvent('Link Claimed', {
    tokenReceived,
    amountReceived: parseFloat(amountReceived).toFixed(4),
    tokenGiven,
    amountGiven: parseFloat(amountGiven).toFixed(4)
  })
}

/**
 * Track wallet connection
 */
export function trackWalletConnected(walletType) {
  trackEvent('Wallet Connected', {
    walletType: walletType || 'unknown'
  })
}

/**
 * Track share button clicks
 */
export function trackShare(method, potatoId) {
  trackEvent('Share Button Clicked', {
    method, // 'copy' or 'twitter'
    linkId: potatoId?.toString()
  })
}

/**
 * Track feedback submission
 */
export function trackFeedbackSubmitted() {
  trackEvent('Feedback Submitted')
}

/**
 * Track page views (handled automatically by Plausible and GA)
 */
export function trackPageView(path) {
  // Plausible tracks page views automatically
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible('pageview', { u: window.location.origin + path })
  }

  // Google Analytics tracks page views automatically
  // This is here for manual tracking if needed
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path
    })
  }
}

/**
 * Send event to Google Analytics
 * @param {string} eventName - Name of the event
 * @param {object} params - Event parameters
 */
export function trackGoogleEvent(eventName, params = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params)
  }
}
