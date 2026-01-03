# cmswap Documentation

Welcome to the cmswap documentation. cmswap is a multi-chain Web3 aggregation platform that enables users to swap tokens across DEXs, bridge assets across chains, and launch new memecoins.

## Quick Links

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | System architecture and design decisions |
| [Roadmap](./roadmap.md) | Implementation phases and TODO |

## Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd cmswap

# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build
```

## Project Overview

cmswap is a Web3 aggregation platform with three core features:

1. **Aggregate Swap** - Best rates across 150+ DEXs via 1inch API
2. **Cross-Chain Bridge** - Seamless token bridging via LayerZero
3. **Memecoin Launchpad** - Token launch platform via Uniswap V4

### Supported Chains

- Ethereum (ETH)
- BNB Chain (BSC)
- Polygon (MATIC)
- Arbitrum
- Optimism
- Base

## Tech Stack Summary

| Category | Technology |
|----------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Web3 | wagmi, viem, Reown AppKit |
| State | Zustand, TanStack Query |
| Runtime | Bun |
| Hosting | Vercel |

## Project Structure

```
cmswap/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── swap/              # Swap feature (coming)
│   ├── bridge/            # Bridge feature (coming)
│   └── launchpad/         # Launchpad feature (coming)
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── landing/           # Landing page components
│   ├── web3/              # Web3-specific components
│   ├── swap/              # Swap components (coming)
│   ├── bridge/            # Bridge components (coming)
│   └── launchpad/         # Launchpad components (coming)
├── lib/
│   ├── wagmi.ts          # wagmi & chain configuration
│   └── utils.ts          # Utility functions
├── services/             # API clients (1inch, etc.)
├── hooks/                # Custom React hooks
└── docs/                 # This documentation
```

## Development

### Prerequisites

- Bun 1.x+
- Node.js 18+

### Environment Variables

Create a `.env.local` file:

```bash
# Get your API keys from respective services
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_1INCH_API_KEY=your_1inch_key
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
```

### Available Scripts

```bash
bun run dev      # Start development server
bun run build    # Build for production
bun run start    # Start production server
bun run lint     # Run ESLint
bun run test     # Run tests (coming)
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

[Your License Here]
