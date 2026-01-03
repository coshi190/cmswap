import { http, createConfig } from 'wagmi'
import { cookieStorage, createStorage } from 'wagmi'
import { mainnet, bsc, polygon, arbitrum, optimism, base } from 'wagmi/chains'

// Get projectId from Reown (formerly WalletConnect)
// Get your project ID at https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'demo-project-id'

// Supported chains for cmswap
export const supportedChains = [mainnet, bsc, polygon, arbitrum, optimism, base] as const

// Default chain for the app
export const defaultChain = mainnet

// Alchemy RPC configuration (add your API key to .env.local)
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || ''

// Configure RPC URLs
const rpcUrls = {
    [mainnet.id]: alchemyApiKey
        ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
        : 'https://cloudflare-eth.com',
    [bsc.id]: 'https://bsc-dataseed.binance.org',
    [polygon.id]: 'https://polygon-rpc.com',
    [arbitrum.id]: 'https://arb1.arbitrum.io/rpc',
    [optimism.id]: 'https://mainnet.optimism.io',
    [base.id]: 'https://mainnet.base.org',
}

// Wagmi configuration for cmswap
export const wagmiConfig = createConfig({
    chains: supportedChains,
    transports: {
        [mainnet.id]: http(rpcUrls[mainnet.id]),
        [bsc.id]: http(rpcUrls[bsc.id]),
        [polygon.id]: http(rpcUrls[polygon.id]),
        [arbitrum.id]: http(rpcUrls[arbitrum.id]),
        [optimism.id]: http(rpcUrls[optimism.id]),
        [base.id]: http(rpcUrls[base.id]),
    },
    ssr: true,
    storage: createStorage({
        storage: cookieStorage,
    }),
})

// Chain IDs for easy reference
export const chainIds = {
    ethereum: mainnet.id,
    bsc: bsc.id,
    polygon: polygon.id,
    arbitrum: arbitrum.id,
    optimism: optimism.id,
    base: base.id,
} as const

// Chain metadata for UI display
export const chainMetadata = {
    [mainnet.id]: {
        name: 'Ethereum',
        symbol: 'ETH',
        icon: '/chains/ethereum.svg',
        color: '#627EEA',
    },
    [bsc.id]: {
        name: 'BNB Chain',
        symbol: 'BNB',
        icon: '/chains/bsc.svg',
        color: '#F0B90B',
    },
    [polygon.id]: {
        name: 'Polygon',
        symbol: 'MATIC',
        icon: '/chains/polygon.svg',
        color: '#8247E5',
    },
    [arbitrum.id]: {
        name: 'Arbitrum',
        symbol: 'ETH',
        icon: '/chains/arbitrum.svg',
        color: '#28A0F0',
    },
    [optimism.id]: {
        name: 'Optimism',
        symbol: 'ETH',
        icon: '/chains/optimism.svg',
        color: '#FF0420',
    },
    [base.id]: {
        name: 'Base',
        symbol: 'ETH',
        icon: '/chains/base.svg',
        color: '#0052FF',
    },
} as const

// Get chain metadata by ID
export function getChainMetadata(chainId: number) {
    return chainMetadata[chainId as keyof typeof chainMetadata]
}
