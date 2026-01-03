import { createAppKit } from '@reown/appkit/react'
import { projectId, supportedChains } from './wagmi'

// Reown AppKit configuration
// Note: For MVP, we'll use wagmi directly. Reown AppKit can be integrated
// later for a more polished wallet connection UI.

// This is a placeholder for when we integrate Reown AppKit's UI
// For now, wallet connections will be handled through wagmi directly

export const appkit = createAppKit({
    networks: [...supportedChains],
    projectId,
    metadata: {
        name: 'cmswap',
        description: 'Multi-chain Web3 aggregation platform - Swap, Bridge, and Launchpad',
        url: 'https://cmswap.io',
        icons: ['https://avatars.githubusercontent.com/u/37784886'],
    },
    features: {
        analytics: true,
        email: false,
    },
    themeMode: 'dark',
    themeVariables: {
        '--w3m-color-mix': '#00FF41',
        '--w3m-color-mix-strength': 20,
        '--w3m-font-family': 'system-ui, sans-serif',
        '--w3m-z-index': 9999,
    },
})

// Export Reown AppKit hooks for future use
export { useAppKit, useAppKitAccount, useAppKitProvider, useAppKitState } from '@reown/appkit/react'
