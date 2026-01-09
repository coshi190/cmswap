# CMswap Architecture

> **Version**: 0.2.4
> **Status**: Multi-DEX Swap Aggregation Live

---

## System Overview

CMswap is a Web3 application built with Next.js featuring multi-DEX swap aggregation and wallet connection infrastructure.

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                            │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│   │  Landing UI  │  │   Header     │  │  Wallet UI   │      │
│   └──────────────┘  └──────────────┘  └──────────────┘      │
│        │                   │                   │            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js 15 (App Router)                 │   │
│  │              SSR + SSG + RSC                         │   │
│  └──────────────────────────────────────────────────────┘   │
│        │                   │                   │            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Web3 Layer (wagmi + viem)               │   │
│  │              TanStack Query + Zustand                │   │
│  └──────────────────────────────────────────────────────┘   │
│        │                   │                   │            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Swap Feature Layer                      │   │
│  │              Multi-DEX Router (V2 + V3)              │   │
│  │              Quote Aggregation                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────┼───────────────────┼───────────────────┼───────────┘
          │                   │                   │
┌─────────────────────────────────────────────────────────────┐
│              Chains: KUB Testnet, JBC, BSC, KUB, Base, World│
│              DEXs: CMswap (V3), Jibswap (V2)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Principles

### Why These Technologies?

**wagmi + viem**
- Type-safe Web3 interactions without code generation
- viem: 10x smaller than ethers, better performance
- wagmi: React hooks built on viem, SSR compatible

**Zustand over Redux**
- Minimal boilerplate (1/10 the code)
- Built-in TypeScript support
- Perfect for client-side swap state

**Multi-DEX Aggregation**
- Single interface for multiple liquidity sources
- Best price discovery across protocols
- Future-proof for adding more DEXs

**These Specific Chains**
- KUB ecosystem: Primary target audience
- JBC Chain: Partner protocol
- BSC/Base/World: Major liquidity hubs

### Key Decisions

**Server-Side Rendering**: Landing page pre-rendered for SEO and performance
**Client-Side Features**: Web3 interactions run client-side only
**Cookie Storage**: SSR-compatible state persistence
**Debounced Quotes**: 500ms delay reduces RPC calls by 80%+

---

## Frontend Architecture

### Routes

```
/              # Landing page (SSG)
/swap          # Swap feature (client-side)
```

### Component Structure

```
components/
├── ui/                    # shadcn/ui base components (14)
│   └── (button, dialog, dropdown, etc.)
│
├── landing/               # Landing page sections
│   ├── hero.tsx           # Hero with CTA
│   ├── features.tsx       # Features grid
│   ├── chains.tsx         # Supported chains
│   ├── cta.tsx            # Call-to-action
│   └── footer.tsx         # Footer
│
├── layout/
│   └── header.tsx         # Nav + wallet integration
│
├── web3/                  # Wallet connection (4 components)
│   ├── connect-button.tsx # Connection trigger
│   ├── connect-modal.tsx  # Wallet selector
│   ├── account-dropdown.tsx # Account actions
│   └── network-switcher.tsx # Chain switcher
│
└── swap/                  # Swap feature (4 components)
    ├── swap-card.tsx      # Main interface
    ├── dex-select-card.tsx # DEX comparison
    ├── token-select.tsx   # Token selector
    └── settings-dialog.tsx # Slippage/deadline
```

---

## Web3 Integration

### Supported Chains

| Chain | Chain ID | RPC | Explorer |
|-------|----------|-----|----------|
| BNB Chain | 56 | thirdweb.com | bscscan.com |
| KUB Chain | 96 | bitkubchain.io | bkcscan.com |
| KUB Testnet | 25925 | bitkubchain.io | scan.kimnet.com |
| JBC Chain | 8899 | rpc.jibchain.net | exp-l1.jibchain.net |
| Base | 8453 | base.org | basescan.org |
| Worldchain | 480 | alchemy.com | alchemy.com |

**Config**: `lib/wagmi.ts`

### Wallet Connection Flow

```
User clicks "Connect Wallet"
  └─> ConnectModal: List available wallets (injected, WalletConnect, Coinbase)
  └─> User selects → wagmi useConnect()
  └─> Success: Show address in ConnectButton
  └─> Click address → AccountDropdown (copy, explorer, disconnect)
```

**Components**: `components/web3/`

### DEX Configuration

| DEX | Protocol | Chains |
|-----|----------|--------|
| CMswap | Uniswap V3 | KUB Testnet, JBC |
| Jibswap | Uniswap V2 | JBC |

**Config**: `lib/dex-config.ts`

**KUB Testnet (CMswap V3)**:
- Factory/Quoter/Router: `0x31Cc7191Fd07664191E0A53bb5EEC3A0B2B6B6fD`
- Fee Tiers: 100, 500, 3000, 10000

**JBC Chain**:
- CMswap (V3): Same as above
- Jibswap (V2): Factory `0x6B5D03994C1D5a8B0fD3432C1bB29f93F9263B3b`, Router `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D`

---

## Swap Feature Architecture

### Multi-DEX System

```
User inputs amount
  └─> Debounced (500ms)
  └─> useMultiDexQuotes: Fetch all DEXs in parallel
      ├─> V3: Direct + Multi-hop routes
      └─> V2: Direct + Multi-hop routes
  └─> Compare outputs, select best
  └─> DexSelectCard: Show all options
  └─> User clicks Swap
      └─> Check allowance → Approve if needed
      └─> Build transaction (V2 or V3)
      └─> Simulate → User confirms → Execute
```

### Routing Logic

**Direct Route**: Token A → Token B (single pool)
**Multi-Hop**: Token A → Intermediate → Token B (better if 0.5%+ improvement)

**Services**: `services/dex/uniswap-v3.ts`, `services/dex/uniswap-v2.ts`
**Hooks**: `hooks/useSwapRouting.ts`, `hooks/useMultiDexQuotes.ts`

### Features

- Multi-DEX quotes with price comparison
- Auto-select best DEX (optional)
- Multi-hop routing for better rates
- Slippage protection (0.1%, 0.5%, 1%, custom)
- Transaction deadline settings
- Wrap/unwrap native tokens
- Transaction simulation before execution

**Execution Hooks**: `hooks/useUniV3SwapExecution.ts`, `hooks/useUniV2SwapExecution.ts`

---

## State Management

### Zustand Store

**Location**: `store/swap-store.ts`

Manages swap state with:
- Token selection (input/output pairs, amounts)
- Quote results with loading/error states
- DEX selection and multi-DEX quotes
- Settings (slippage, deadline, expert mode, auto-select)
- LocalStorage persistence for settings

### Caching (TanStack Query)

- Balance queries: 30s stale time
- Quote queries: No cache (real-time)
- Config: `app/providers.tsx`

---

## Security

### Implemented Measures

1. **No Private Keys** - All signing in user's wallet
2. **External Links** - `rel="noopener noreferrer"` on explorer links
3. **Clipboard Security** - Try/catch with user feedback
4. **User Rejection** - Error code 4001 handled gracefully
5. **TypeScript Strict Mode** - Type safety enforced
6. **Transaction Simulation** - All swaps simulated before execution
7. **Balance Validation** - Checks sufficient balance before swap
8. **Allowance Validation** - Checks token allowance before swap
9. **Slippage Protection** - User-defined limits enforced
10. **Deadline Protection** - Transactions expire after user deadline

---

## Performance

### Optimizations

1. **Static Generation** - Landing page pre-rendered
2. **Code Splitting** - Route-based automatic with Next.js
3. **Cookie Storage** - SSR-compatible state storage
4. **Image Optimization** - Next.js Image for chain logos
5. **Input Debouncing** - 500ms reduces RPC calls 80%+
6. **Aggressive Caching** - 30s stale time for balances
7. **Parallel Quotes** - Multiple DEXs queried simultaneously
8. **Smart Route Caching** - Quotes cached with proper invalidation

---

## Deployment

### Architecture

```
Vercel Edge
  └─> Next.js Application (Serverless Functions)
      ├─> Static Assets (CDN cached)
      ├─> API Routes (if needed)
      └─> Edge Functions (dynamic)
```

### RPC Providers

- BSC: thirdweb.com
- KUB/Testnet: bitkubchain.io
- JBC: rpc.jibchain.net
- Base: base.org
- World: alchemy.com

---

## Monitoring

- **Vercel Analytics** - Page views, Web Vitals
- **Sentry** - Error tracking (active)

---

## Code Reference

### Type Definitions
- `types/swap.ts` - Swap parameters, quotes, settings
- `types/dex.ts` - DEX types, metadata, registry
- `types/tokens.ts` - Token types, balances, approvals
- `types/routing.ts` - Route types, pool info
- `types/web3.ts` - Wallet connection types

### Services
- `services/tokens.ts` - Token balances, allowances, approvals
- `services/dex/uniswap-v3.ts` - V3 quoting, routing, execution
- `services/dex/uniswap-v2.ts` - V2 quoting, routing, execution

### Hooks
- `hooks/useMultiDexQuotes.ts` - Aggregate all DEX quotes
- `hooks/useSwapRouting.ts` - Direct and multi-hop routing
- `hooks/useUniV3Quote.ts` - V3 single-hop quoting
- `hooks/useUniV2Quote.ts` - V2 single-hop quoting
- `hooks/useUniV3MultiHopQuote.ts` - V3 multi-hop quoting
- `hooks/useUniV2MultiHopQuote.ts` - V2 multi-hop quoting
- `hooks/useUniV3SwapExecution.ts` - V3 swap execution
- `hooks/useUniV2SwapExecution.ts` - V2 swap execution
- `hooks/useTokenBalance.ts` - Token balance fetching
- `hooks/useTokenApproval.ts` - Approval flow
- `hooks/useSwapUrlSync.ts` - URL parameter sync
- `hooks/useDebounce.ts` - Input debouncing

### ABIs
- `lib/abis/erc20.ts` - ERC20 token standard
- `lib/abis/weth9.ts` - WETH9 wrapped native token
- `lib/abis/uniswap-v2-factory.ts` - V2 factory
- `lib/abis/uniswap-v2-router.ts` - V2 router
- `lib/abis/uniswap-v2-pair.ts` - V2 pair
- `lib/abis/uniswap-v3-factory.ts` - V3 factory
- `lib/abis/uniswap-v3-quoter.ts` - V3 quoter
- `lib/abis/uniswap-v3-pool.ts` - V3 pool
- `lib/abis/uniswap-v3-swap-router.ts` - V3 router

### Utilities
- `lib/utils.ts` - `cn()` class merger, `formatAddress()`
- `lib/toast.ts` - Toast notification helpers
- `lib/routing-config.ts` - Routing configuration
- `lib/swap-params.ts` - Swap parameter builders
- `lib/tokens.ts` - Token lists and utilities
- `lib/dex-config.ts` - DEX registry

---

## Dependencies

**Core**: Next.js 15.2, React 19, TypeScript 5.8
**Web3**: wagmi 2.15, viem 2.25, @tanstack/react-query 5.62
**State**: Zustand 5.0
**UI**: Radix UI, Tailwind 3.4, lucide-react, framer-motion, sonner
**Dev**: ESLint 9, Prettier 3.4, Husky 9.1, Vitest 2.1, Playwright 1.49
**Other**: React Hook Form 7.55, Zod 3.24
