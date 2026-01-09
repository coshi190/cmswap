# CMswap Documentation

Welcome to the CMswap documentation. CMswap is a multi-chain Web3 aggregation platform that enables users to swap tokens across DEXs, bridge assets across chains, and launch new memecoins.

## Quick Links

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | System architecture and design decisions |
| [Roadmap](./roadmap.md) | Implementation phases and TODO |

## Project Overview

CMswap is a Web3 aggregation platform with three core features:

1. **Aggregate Swap** - Multi-DEX swap aggregation with real-time price comparison across protocols (CMswap V3, Jibswap V2)
2. **Cross-Chain Bridge** - Seamless token bridging via LayerZero (coming)
3. **Memecoin Launchpad** - Token launch platform via Uniswap V4 (coming)

### Supported Chains

- BNB Chain (BSC)
- KUB Chain (Bitkub)
- KUB Testnet
- JB Chain (Jibchain)
- Base
- Worldchain

## Tech Stack Summary

| Category | Technology |
|----------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Web3 | wagmi v2, viem v2 |
| State | Zustand, TanStack Query |
| Runtime | Bun |
| Hosting | Vercel |

## Project Structure

```
cmswap/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── swap/              # Swap feature (implemented)
│   ├── bridge/            # Bridge feature (coming)
│   └── launchpad/         # Launchpad feature (coming)
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── landing/           # Landing page components
│   ├── web3/              # Web3-specific components
│   └── swap/              # Swap components
├── lib/
│   ├── abis/              # Contract ABIs (ERC20, Uniswap V3)
│   ├── dex-config.ts      # Multi-DEX protocol configuration
│   ├── tokens.ts          # Token lists per chain
│   ├── utils.ts           # Utility functions
│   └── wagmi.ts           # wagmi & chain configuration
├── services/              # DEX services, token utilities
├── hooks/                 # Custom React hooks
├── store/                 # Zustand state management
├── types/                 # TypeScript types
└── docs/                  # This documentation
```

## Development

### Prerequisites

- Bun 1.x+
- Node.js 18+

### Environment Variables

**Not required** - The app works out of the box with public RPCs.

Optional `.env.local` for enhanced features:

### Available Scripts

```bash
bun run dev      # Start development server
bun run build    # Build for production
bun run start    # Start production server
bun run lint     # Run ESLint
bun run clean    # Clean build artifacts (.next, tsconfig.tsbuildinfo)
bun run test     # Run tests (coming)
```

## Current Implementation

### Phase 2: Swap Feature & Multi-Chain Expansion (~60% complete)

**Live:**
- Multi-DEX swap aggregation (CMswap V3, Jibswap V2)
- Multi-hop routing for best prices
- Real-time quotes from all DEXs with price comparison
- DEX auto-select best price
- KUB Testnet integration (CMswap V3)
- JB Chain integration (CMswap V3 + Jibswap V2)
- KUB Mainnet integration (CMswap V3)
- Wallet connection with 6 chains
- Token approval flow
- Slippage protection (0.1%, 0.5%, 1%, custom)
- Transaction deadline settings
- Transaction simulation before execution
- Wrap/unwrap native tokens

**In Progress:**
- Base chain integration
- Worldchain integration
- BSX Chain integration

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT
