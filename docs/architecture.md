# cmswap Architecture

> **Version**: 0.2.4
> **Status**: Swap Feature Live - Multi-DEX Aggregation Implemented

## System Overview

cmswap is a modern Web3 application built with a server-side rendered frontend with multi-DEX swap aggregation, wallet connection infrastructure, and landing page. Bridge and launchpad features are planned for future phases.

```
┌─────────────────────────────────────────────────────────────┐
│                     User Browser                            │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Landing UI  │  │   Header     │  │  Wallet UI   │      │
│  │  (IMPLEMENTED)│  │  (IMPLEMENTED)│  │  (IMPLEMENTED)│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                   │                   │            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js 15 (App Router)                 │   │
│  │              - React Server Components               │   │
│  │              - Server-Side Rendering                │   │
│  │              - Static Site Generation               │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                   │                   │            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Web3 Integration Layer                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│  │  │ wagmi v2  │  │  viem    │  │ Custom Wallet UI │  │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │     TanStack Query (Data Caching)           │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │     Zustand (State Management)              │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                   │                   │            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Swap Feature Layer (IMPLEMENTED)         │   │
│  │  ┌──────────────────┐  ┌──────────────────────┐  │   │
│  │  │ Multi-DEX Router │  │ Quote Aggregation    │  │   │
│  │  │ (V2 + V3)        │  │ (Price Comparison)   │  │   │
│  │  └──────────────────┘  └──────────────────────┘  │   │
│  │  ┌──────────────────┐  ┌──────────────────────┐  │   │
│  │  │ Token Management │  │ Swap Execution       │  │   │
│  │  │ (Approvals)      │  │ (Multi-hop Support)  │  │   │
│  │  └──────────────────┘  └──────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                   │                   │            │
└─────────┼───────────────────┼───────────────────┼────────────┘
          │                   │                   │
┌─────────────────────────────────────────────────────────────┐
│              Blockchain Networks (EVM Chains)               │
│  KUB Testnet, JBC Chain, BSC, Bitkub Chain, Base, World    │
└─────────────────────────────────────────────────────────────┘
          │                   │                   │
┌─────────────────────────────────────────────────────────────┐
│              DEX Protocols (IMPLEMENTED)                     │
│  CMswap (Uniswap V3) | Jibswap (Uniswap V2)                 │
└─────────────────────────────────────────────────────────────┘

⚠️ Bridge & Launchpad Integration (LayerZero, Token Factory) - NOT YET IMPLEMENTED
```

---

## Current Implementation (v0.2.4)

### ✅ Implemented Features

- **Landing Page**: Hero, Features, Supported Chains, CTA, Footer sections
- **Web3 Wallet Connection**: Full 4-component wallet connection system
- **Multi-Chain Support**: 6 chains with network switching
- **shadcn/ui Integration**: 14 UI components configured
- **Responsive Header**: Desktop/mobile navigation with wallet integration
- **Swap Feature**: Full-featured DEX aggregator
  - Multi-DEX support (Uniswap V2 + V3 protocols)
  - Multi-hop routing for best prices
  - Real-time quotes from all DEXs
  - DEX price comparison with auto-select
  - Token approval flow
  - Wrap/unwrap native tokens
  - Slippage protection (0.1%, 0.5%, 1%, custom)
  - Transaction deadline settings
  - Balance validation
  - Transaction simulation
- **State Management**: Zustand store for swap state
- **Custom Hooks**: 12+ hooks for balances, quotes, routing, execution
- **Token Management**: Per-chain token lists with custom token support

### ❌ Not Implemented (Planned)

- **Bridge Feature**: Cross-chain transfers via LayerZero (Phase 4)
- **Launchpad**: Token creation and liquidity pools (Phase 5)
- **Earn/Staking**: Liquidity pool staking rewards (Phase 3)
- **Points/Quests**: User engagement system (Phase 7)

---

## Frontend Architecture

### Next.js App Router

**Configuration:**
- React Server Components enabled
- Server-Side Rendering for initial page load
- Static Site Generation for landing page
- Client-Side Rendering for Web3 features

**Current Routes:**
```
/              # Landing page (SSG) ✅
/swap          # Swap feature (IMPLEMENTED) ✅
/bridge        # Bridge feature (Phase 4) ❌
/launchpad     # Launchpad feature (Phase 5) ❌
/earn          # Earn/Staking feature (Phase 3) ❌
/points        # Points/Quests feature (Phase 7) ❌
```

### Component Architecture (ACTUAL)

```
components/
├── ui/                    # shadcn/ui base components ✅
│   ├── avatar.tsx         # Avatar with fallback support
│   ├── badge.tsx          # Badge/tag component
│   ├── button.tsx         # Button with variants
│   ├── card.tsx           # Card component with subcomponents
│   ├── dialog.tsx         # Modal dialog component
│   ├── dropdown-menu.tsx  # Full dropdown menu system
│   ├── input.tsx          # Text input component
│   ├── label.tsx          # Form label component
│   ├── navigation-menu.tsx # Navigation menu for site nav
│   ├── scroll-area.tsx    # Scrollable area component
│   ├── select.tsx         # Dropdown select component
│   ├── separator.tsx      # Visual separator/divider
│   ├── sheet.tsx          # Side sheet (mobile menu)
│   └── sonner.tsx         # Toast notification wrapper
│
├── landing/               # Landing page components ✅
│   ├── hero.tsx           # Hero section with CTA
│   ├── features.tsx       # Features grid
│   ├── chains.tsx         # Supported chains display
│   ├── cta.tsx            # Call-to-action section
│   └── footer.tsx         # Footer component
│
├── layout/                # Layout components ✅
│   └── header.tsx         # Main navigation header with wallet integration
│
├── web3/                  # Web3/Wallet components ✅
│   ├── connect-button.tsx # Main wallet connection trigger
│   ├── connect-modal.tsx  # Wallet selection dialog
│   ├── account-dropdown.tsx # Account actions (copy, explorer, disconnect)
│   └── network-switcher.tsx # Network/chain switching dropdown
│
├── swap/                  # Swap feature (IMPLEMENTED) ✅
│   ├── swap-card.tsx      # Main swap interface (528 lines)
│   │   - Token selection and input
│   │   - Real-time quoting
│   │   - Multi-DEX support
│   │   - Slippage settings
│   │   - Balance display
│   │   - Approval flow
│   │   - Wrap/unwrap operations
│   │   - Flippable rate display
│   │   - Route information
│   ├── dex-select-card.tsx # DEX comparison card (160 lines)
│   │   - All available DEXs
│   │   - Price quotes comparison
│   │   - Best price highlighting
│   │   - Auto-select best DEX
│   ├── token-select.tsx    # Token selection dropdown
│   └── settings-dialog.tsx # Slippage and deadline settings
│
├── bridge/                # Bridge feature (Phase 4) ❌
├── launchpad/             # Launchpad feature (Phase 5) ❌
├── earn/                  # Earn feature (Phase 3) ❌
└── points/                # Points feature (Phase 7) ❌
```

---

## Web3 Integration Layer (IMPLEMENTED)

### Chain Configuration

**Location:** `lib/wagmi.ts`

**Supported Chains (6):**

| Chain | Chain ID | RPC URL | Explorer | Symbol |
|-------|----------|---------|----------|--------|
| **BNB Chain (BSC)** | 56 | thirdweb.com | bscscan.com | BNB |
| **KUB Chain (Bitkub)** | 96 | bitkubchain.io | bkcscan.com | KUB |
| **KUB Testnet** | 25925 | bitkubchain.io | scan.kimnet.com | KUB |
| **JBC Chain** | 8899 | rpc.jibchain.net | exp-l1.jibchain.net | JBC |
| **Base** | 8453 | base.org | basescan.org | ETH |
| **Worldchain** | 480 | alchemy.com | alchemy.com | ETH |

**Default Chain:** KUB Testnet (chain ID 25925) - for swap feature

**Wagmi Configuration:**
```typescript
export const wagmiConfig = createConfig({
  chains: supportedChains,        // 6 chains listed above
  transports: { ... },            // RPC URLs per chain
  ssr: true,                      // Server-side rendering support
  storage: createStorage({
    storage: cookieStorage,        // Cookie-based storage
  }),
})
```

### Wallet Connection Components

**Component Hierarchy:**
```
ConnectButton (components/web3/connect-button.tsx)
├── When Disconnected:
│   └── Shows "Connect Wallet" button
│       └── Opens ConnectModal
└── When Connected:
    └── Shows AccountInfo (formatted address)
        └── Opens AccountDropdown
            ├── Copy Address
            ├── View on Explorer
            └── Disconnect

NetworkSwitcher (components/web3/network-switcher.tsx)
└── Shows current chain with icon
    └── Opens dropdown with all chains
        └── Allows chain switching
```

**Component Details:**

#### ConnectButton (`connect-button.tsx`)
- **Purpose:** Main entry point for wallet connection
- **Hooks:** `useAccount()`, `useConnect()`
- **States:** Connected → Shows address, Disconnected → Shows button
- **Dependencies:** ConnectModal, AccountDropdown, Button component

#### ConnectModal (`connect-modal.tsx`)
- **Purpose:** Wallet selection interface
- **Hooks:** `useConnect()`
- **Features:**
  - Lists available wallet connectors (injected, walletConnect, coinbaseWallet)
  - Custom wallet name mapping for better UX
  - Loading state during connection
  - Error handling with user rejection detection (error code 4001)
  - Toast notifications for feedback
  - Modal stays open on error for retry

#### AccountDropdown (`account-dropdown.tsx`)
- **Purpose:** Account management menu
- **Hooks:** `useAccount()`, `useBalance()`, `useDisconnect()`, `useChainId()`
- **Features:**
  - Displays formatted address (e.g., `0x1234...5678`)
  - Shows token balance with symbol
  - Avatar with address initials (e.g., `12`)
  - Copy address to clipboard (with error handling)
  - View on block explorer (opens in new tab with `rel="noopener noreferrer"`)
  - Disconnect wallet
  - Chain metadata integration for explorer URLs

#### NetworkSwitcher (`network-switcher.tsx`)
- **Purpose:** Network/chain switching interface
- **Hooks:** `useChainId()`, `useSwitchChain()`
- **Features:**
  - Shows current network name and icon
  - Active chain indicator (green dot)
  - Lists all supported chains with icons
  - Loading state during switch
  - Toast notifications for success/failure
  - Uses Next.js Image component for chain logos

### DEX Configuration

**Location:** `lib/dex-config.ts` (408 lines)

**Supported DEX Protocols:**

| DEX | Protocol Type | Chains Supported |
|-----|---------------|------------------|
| **CMswap** | Uniswap V3 | KUB Testnet, JBC Chain |
| **Jibswap** | Uniswap V2 | JBC Chain |
| **CommuDAO** | (Planned) | TBD |

**Per-Chain Protocol Configuration:**

**KUB Testnet:**
- CMswap (V3)
  - Factory: `0x31Cc7191Fd07664191E0A53bb5EEC3A0B2B6B6fD`
  - Quoter: `0x31Cc7191Fd07664191E0A53bb5EEC3A0B2B6B6fD`
  - SwapRouter: `0x31Cc7191Fd07664191E0A53bb5EEC3A0B2B6B6fD`
  - Fee Tiers: 100, 500, 3000, 10000

**JBC Chain:**
- CMswap (V3)
  - Factory: `0x31Cc7191Fd07664191E0A53bb5EEC3A0B2B6B6fD`
  - Quoter: `0x31Cc7191Fd07664191E0A53bb5EEC3A0B2B6B6fD`
  - SwapRouter: `0x31Cc7191Fd07664191E0A53bb5EEC3A0B2B6B6fD`
- Jibswap (V2)
  - Factory: `0x6B5D03994C1D5a8B0fD3432C1bB29f93F9263B3b`
  - Router: `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D`
  - Wrapped Native: `0xA74856B423eb578C59732bcF689c7FcEa7C4BD3d` (WJBC)

**Token Configuration:**
- Per-chain token lists with native and wrapped tokens
- Custom token support
- Token search and lookup utilities

### viem Usage

Currently used for:
- Type-safe chain configuration
- Transport layer (HTTP RPC calls)
- Wallet method signatures (via wagmi)
- Contract interactions (Swap, V2, V3 protocols)
- Transaction encoding/decoding
- Multicall encoding for native output
- Custom contract calls

---

## State Management

### Current State (v0.2.4)

**Zustand** - Swap state store (IMPLEMENTED):
**Location:** `store/swap-store.ts` (191 lines)

```typescript
interface SwapStore {
  // Token state
  tokenIn: Token | null
  tokenOut: Token | null
  amountIn: string
  amountOut: string

  // Quote state
  quote: QuoteResult | null
  isLoading: boolean
  error: string | null

  // DEX selection
  selectedDex: string | null
  dexQuotes: DexQuote[]
  bestQuoteDex: string | null

  // Settings
  settings: {
    slippage: number        // 0.1, 0.5, 1, or custom
    deadline: number        // minutes
    expertMode: boolean
    autoSelectBestDex: boolean
  }

  // Actions
  setTokens: (tokenIn: Token | null, tokenOut: Token | null) => void
  setAmount: (amount: string) => void
  setQuote: (quote: QuoteResult | null) => void
  setSelectedDex: (dex: string | null) => void
  setDexQuotes: (quotes: DexQuote[]) => void
  updateSettings: (settings: Partial<SwapSettings>) => void
  swapTokens: () => void
  reset: () => void
}
```

**Persistence:**
- LocalStorage with partialize (only settings persisted)
- Smart merge for new fields
- URL parameter sync for amounts and tokens

**Selectors:**
- `useSwapSettings` - Get swap settings
- `useSwapTokens` - Get selected tokens
- `useSwapAmounts` - Get input amounts
- `useDexQuotes` - Get all DEX quotes
- `useBestQuoteDex` - Get best DEX
- `useAutoSelectBestDex` - Check auto-select preference

**TanStack Query** - Data caching:
- Used by wagmi for internal caching
- Used by custom hooks for balances, quotes, allowances
- QueryClient configured in `app/providers.tsx`
- 30s stale time for balance queries

**React State** - Component-level state:
- Modal open/close states
- Mobile menu state
- Form inputs (slippage, deadline)

---

## Swap Feature Architecture (IMPLEMENTED)

### Multi-DEX Support

**Supported Protocols:**
- **Uniswap V3** - Concentrated liquidity AMM
  - Fee tiers: 100, 500, 3000, 10000
  - Multi-hop routing via pool hopping
  - Multicall for native token output
- **Uniswap V2** - Constant product AMM
  - Factory/Router pattern
  - Multi-hop routing via intermediate tokens
  - Custom wrapped native token support

**DEX Comparison:**
- Real-time quotes from all available DEXs
- Price difference calculation (basis points)
- Best DEX auto-selection (optional)
- Manual DEX selection with visual comparison

### Routing System

**Multi-Hop Routing:**
- Automatic route discovery for indirect pairs
- Direct vs multi-hop comparison
- Minimum improvement threshold (50 bips)
- Intermediary token selection
- Route information display (token path, fees, gas)

**Route Selection Logic:**
```typescript
// services/dex/uniswap-v3.ts
function getBestRoute(
  tokenIn: Token,
  tokenOut: Token,
  amountIn: bigint
): RouteQuote | null {
  // Try direct route first
  const direct = tryDirectRoute(tokenIn, tokenOut, amountIn)

  // Try multi-hop via popular intermediaries
  const multiHops = tryMultiHopRoutes(tokenIn, tokenOut, amountIn)

  // Select best route (must be 0.5% better than direct)
  return selectBestRoute(direct, multiHops, MIN_IMPROVEMENT_BIPS)
}
```

### Quote System

**Quote Aggregation:**
- Parallel quote fetching from all DEXs
- Debounced input (500ms) to reduce RPC calls
- Price comparison with best DEX highlighting
- Real-time quote updates

**Quote Flow:**
```
1. User inputs amount
   └─> Debounced input triggers quote fetch
2. useMultiDexQuotes hook aggregates quotes
   ├─> Fetch V2 quotes (direct + multi-hop)
   ├─> Fetch V3 quotes (direct + multi-hop)
   └─> Compare all quotes
3. Best quote selected
   └─> Display to user with DEX info
4. User can manually select DEX
   └─> Or enable auto-select best DEX
```

### Execution Flow

**Swap Execution:**
```
1. User clicks "Swap"
   ├─> Check token allowance
   ├─> If insufficient: trigger approval flow
   └─> If sufficient: proceed to swap

2. Approval Flow (if needed)
   ├─> Build approval transaction
   ├─> User confirms approval in wallet
   ├─> Wait for approval confirmation
   └─> Proceed to swap

3. Swap Transaction
   ├─> Build swap transaction (V2 or V3)
   │   ├─> Encode path (token addresses)
   │   ├─> Calculate minimum output (slippage)
   │   └─> Set deadline
   ├─> Simulate transaction
   ├─> User confirms swap in wallet
   └─> Wait for confirmation

4. Post-Swap
   ├─> Update balances
   ├─> Show success toast
   ├─> Track transaction status
   └─> Provide explorer link
```

**Wrap/Unwrap Support:**
- Native token ↔ Wrapped token detection
- Special handling for ETH/BNB/KUB → WETH/WBNB/WKKUB
- No approval needed for wrap/unwrap
- Direct router call

### Token Management

**Token Lists:**
- Per-chain token lists (`lib/tokens.ts`)
- Native token configuration
- Wrapped token configuration
- Custom token import
- Token search by address/symbol

**Supported Tokens:**
- KUB Testnet: KUB (native), tKKUB (wrapped), testKUB, testToken
- JBC Chain: JBC (native), WJBC (wrapped), jWJBC, JUSDT, USDT, CMJ, DoiJIB, BB

---

## Services & Hooks (IMPLEMENTED)

### Services

**Location:** `services/`

**tokens.ts** (283 lines)
- Token balance queries
- Token allowance queries
- Approval transaction builders
- Token formatting utilities
- Native/wrapped token handling
- Same-token detection
- Wrap/unwrap operation detection

**dex/uniswap-v3.ts** (335 lines)
- V3 path encoding
- Quote parameter building
- Swap parameter building
- Multi-hop routing support
- Multicall encoding for native output
- Fee tier management
- Min output calculation with slippage

**dex/uniswap-v2.ts** (220 lines)
- V2 path building
- Quote parameter building
- Swap parameter building
- Multi-hop routing support
- Custom wrapped native token support
- Min output calculation with slippage

### Hooks

**Location:** `hooks/`

**useMultiDexQuotes.ts** (211 lines)
- Aggregates quotes from all DEXs
- Compares V2 and V3 protocols
- Multi-hop route integration
- Best route selection
- Price difference calculations

**useSwapRouting.ts** (123 lines)
- Direct route fetching
- Multi-hop route fetching
- Route comparison and selection
- Minimum improvement threshold check

**useUniV3Quote.ts** - V3 single-hop quoting
**useUniV2Quote.ts** - V2 single-hop quoting
**useUniV3MultiHopQuote.ts** - V3 multi-hop quoting
**useUniV2MultiHopQuote.ts** - V2 multi-hop quoting

**useUniV3SwapExecution.ts** (228 lines)
- V3 swap execution
- Wrap/unwrap handling
- Native token support
- Multi-hop execution
- Multicall for native output
- Simulation and confirmation tracking

**useUniV2SwapExecution.ts** (221 lines)
- V2 swap execution
- Wrap/unwrap handling
- Native token support
- Multi-hop execution
- Custom wrapped native support
- Simulation and confirmation tracking

**useTokenBalance.ts** - Token balance fetching
**useTokenApproval.ts** - Token approval flow
**useSwapUrlSync.ts** - URL parameter synchronization
**useDebounce.ts** - Input debouncing

**Total:** 1,824+ lines of hooks and services

---

## Planned Features (Roadmap)

### Phase 3: Bridge Feature

**Components to Create:**
```
components/bridge/
├── bridge-panel.tsx       # Main bridge interface
├── chain-select.tsx       # Chain selector
└── bridge-status.tsx      # Bridge status tracker
```

**Protocol Integration:**
```typescript
// PLANNED: services/layerzero.ts
// Stargate SDK for token bridging
```

### Phase 4: Earn/Staking

**Components to Create:**
```
components/earn/
├── earn-panel.tsx        # Main earn interface
├── pool-list.tsx         # Available liquidity pools
└── staking-position.tsx  # User's staking positions
```

**Protocol Integration:**
- Liquidity pool staking
- Reward distribution
- APY calculation

### Phase 5: Launchpad

**Smart Contracts:**
```solidity
// PLANNED: contracts/src/
├── LaunchpadToken.sol        # ERC20 implementation
├── LaunchpadFactory.sol      # Factory pattern
└── interfaces/
    └── ILaunchpad.sol         # Launchpad interface
```

**Components to Create:**
```
components/launchpad/
├── launch-form.tsx           # Token creation form
├── deploy-status.tsx         # Deployment progress
├── pool-config.tsx           # Liquidity pool setup
└── token-page.tsx            # Deployed token page
```

### Phase 6: Advanced Swap Features

- Limit orders
- TWAP (Time-Weighted Average Price)
- DCA (Dollar Cost Averaging)
- Advanced price charts
- Transaction history

### Phase 7: Points & Quests

**Components to Create:**
```
components/points/
├── points-dashboard.tsx     # Points overview
├── quest-list.tsx           # Available quests
└── rewards.tsx              # Reward claiming
```

---

## Security Architecture

### Implemented Security Measures (v0.2.4)

1. **No Private Keys** - All signing happens in user's wallet
2. **External Links** - `rel="noopener noreferrer"` on explorer links
3. **Clipboard Security** - Try/catch wrapper with user feedback
4. **User Rejection Detection** - Error code 4001 handled gracefully
5. **Input Validation** - TypeScript strict mode enabled
6. **Transaction Simulation** - All transactions simulated before execution
7. **Balance Validation** - Checks user has sufficient balance before swap
8. **Allowance Validation** - Checks token allowance before swap
9. **Slippage Protection** - User-defined slippage limits enforced
10. **Deadline Protection** - Transactions expire after user-defined deadline

### Planned Security Measures

1. **Zod Validation** - Schemas for all user inputs
2. **Rate Limiting** - API call throttling
3. **CSP Headers** - Content Security Policy
4. **Smart Contract Audit** - Third-party security audit before mainnet

---

## Performance Optimizations

### Implemented (v0.2.4)

1. **Static Generation** - Landing page pre-rendered at build time
2. **Code Splitting** - Route-based splitting automatic with Next.js
3. **Cookie Storage** - Efficient SSR-compatible state storage
4. **Image Optimization** - Next.js Image component for chain logos
5. **Input Debouncing** - 500ms debounce to reduce RPC calls
6. **Aggressive Caching** - TanStack Query with 30s stale time for balances
7. **Parallel Quote Fetching** - Multiple DEXs queried simultaneously
8. **Smart Route Caching** - Route quotes cached with proper invalidation

### Planned Optimizations

1. **Streaming** - Suspense support for faster initial load
2. **Component Lazy Loading** - For large feature components
3. **CDN Caching** - Vercel Edge Network for static assets

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Vercel Edge                       │
│  ┌───────────────────────────────────────────────┐  │
│  │  Next.js Application (Serverless Functions)  │  │
│  └───────────────────────────────────────────────┘  │
│         │                   │                      │
│  ┌──────▼──────────┐  ┌───▼────────┐  ┌─────────▼───┐
│  │ Static Assets   │  │  API Routes │  │  Edge Functions │
│  │ (CDN Cached)    │  │  (Optional) │  │  (Dynamic)   │
│  └─────────────────┘  └────────────┘  └──────────────┘
└─────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    ┌─────────┐    ┌──────────┐    ┌──────────┐
    │  RPCs   │    │ Planned  │    │ Planned  │
    │ (Thirdweb/   │ 1inch   │    │LayerZero │
    │  Alchemy)│   │   API   │    │   API    │
    └─────────┘    └──────────┘    └──────────┘
```

**Current RPC Providers:**
- BSC: thirdweb.com
- KUB Chain: bitkubchain.io
- KUB Testnet: bitkubchain.io (kimnet.com explorer)
- JBC Chain: rpc.jibchain.net
- Base: base.org
- Worldchain: alchemy.com (public)

---

## Monitoring & Observability

### Implemented (v0.2.4)

- **Vercel Analytics** - Page views, Web Vitals (configured)
- **Sentry** - Error tracking (configured, actively tracking errors)
- **Transaction Tracking** - Success/failure rates via swap execution hooks

### Planned Monitoring

- **Custom Events** - DEX quote performance
- **Vercel Logs** - Serverless function logs
- **Rate Limiting** - API call monitoring
- **Cost Tracking** - RPC usage monitoring

---

## Type Definitions

**Location:** `types/`

**types/swap.ts** (133 lines)
```typescript
// Swap parameters
interface SwapParams {
  tokenIn: Token
  tokenOut: Token
  amountIn: bigint
  slippage: number
  deadline: number
}

// Quote result
interface QuoteResult {
  amountOut: bigint
  priceImpact?: number
  route?: SwapRoute
  gasEstimate?: bigint
}

// DEX quote
interface DexQuote {
  dex: string
  protocol: DEXType
  amountOut: bigint
  route: SwapRoute
  priceImpact?: number
}

// Swap settings
interface SwapSettings {
  slippage: number
  deadline: number
  expertMode: boolean
  autoSelectBestDex: boolean
}

// Swap state
interface SwapState {
  tokenIn: Token | null
  tokenOut: Token | null
  amountIn: string
  amountOut: string
  quote: QuoteResult | null
  selectedDex: string | null
  dexQuotes: DexQuote[]
  bestQuoteDex: string | null
  settings: SwapSettings
}
```

**types/dex.ts** (35 lines)
```typescript
// DEX type
enum DEXType {
  V2 = 'uniswap_v2',
  V3 = 'uniswap_v3',
  Stable = 'stable_swap',
  Aggregator = 'aggregator'
}

// DEX metadata
interface DEXMetadata {
  id: string
  name: string
  protocol: DEXType
  chains: number[]
  factory: Address
  router: Address
  quoter?: Address
}

// DEX registry
const DEX_REGISTRY: Record<string, DEXMetadata> = {
  cmswap: { /* ... */ },
  jibswap: { /* ... */ },
  commudao: { /* ... */ }
}
```

**types/tokens.ts** (78 lines)
```typescript
// Token types
interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  chainId: number
  logoURI?: string
}

interface NativeToken extends Token {
  address: '0x0000000000000000000000000000000000000000'
  isNative: true
  wrapped: Address
}

interface ERC20Token extends Token {
  isNative: false
}

// Token balance
interface TokenBalance {
  token: Token
  balance: bigint
  formatted: string
}

// Token approval
interface TokenApproval {
  token: Token
  spender: Address
  amount: bigint
  approved: boolean
}

// Token list
type TokenList = Record<string, Token>
```

**types/routing.ts**
```typescript
// Swap route
interface SwapRoute {
  tokens: Token[]
  protocol: DEXType
  pools: PoolInfo[]
  gasEstimate?: bigint
}

// Route quote
interface RouteQuote {
  route: SwapRoute
  amountOut: bigint
  priceImpact?: number
}

// Pool info
interface PoolInfo {
  address: Address
  token0: Token
  token1: Token
  fee?: number
  reserve0?: bigint
  reserve1?: bigint
  liquidity?: bigint
}
```

**types/web3.ts**
```typescript
// Wallet connection types
interface ConnectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface WalletOption {
  id: string
  name: string
  type: string
}

// Connection state types
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface ConnectionState {
  status: ConnectionStatus
  address?: string
  chainId?: number
  error?: Error
}
```

---

## Utility Functions

**Location:** `lib/utils.ts`

**Implemented:**
```typescript
// Class name merger for Tailwind CSS
export function cn(...inputs: ClassValue[]): string

// Address formatter (e.g., "0x1234567890abcdef" → "0x1234...cdef")
export function formatAddress(address: string, startChars = 6, endChars = 4): string
```

**Additional Utilities:**
- `lib/toast.ts` - Toast notification helpers
- `lib/routing-config.ts` - Routing configuration
- `lib/swap-params.ts` - Swap parameter builders
- `lib/tokens.ts` - Token lists and utilities
- `lib/dex-config.ts` - DEX registry (408 lines)

---

## ABI Definitions

**Location:** `lib/abis/`

**Contract ABIs for Type-Safe Interactions:**

**erc20.ts** - ERC20 token standard
- `approve(spender, amount)` - Approve token spending
- `allowance(owner, spender)` - Check allowance
- `balanceOf(account)` - Get token balance
- `transfer(to, amount)` - Transfer tokens
- `transferFrom(from, to, amount)` - Transfer on behalf

**weth9.ts** - WETH9 wrapped native token
- `deposit()` - Wrap native tokens
- `withdraw(amount)` - Unwrap to native tokens
- `balanceOf(account)` - Get wrapped balance

**uniswap-v2-factory.ts** - V2 factory contract
- `getPair(tokenA, tokenB)` - Get pair address
- `createPair(tokenA, tokenB)` - Create new pair

**uniswap-v2-router.ts** - V2 router contract
- `swapExactTokensForTokens(...)` - Exact input swap
- `swapTokensForExactTokens(...)` - Exact output swap
- `swapExactETHForTokens(...)` - ETH to token swap
- `swapExactTokensForETH(...)` - Token to ETH swap
- `addLiquidity(...)` - Add liquidity
- `removeLiquidity(...)` - Remove liquidity

**uniswap-v2-pair.ts** - V2 pair contract
- `getReserves()` - Get pair reserves
- `token0()` - First token address
- `token1()` - Second token address
- `totalSupply()` - Total LP tokens
- `balanceOf(account)` - LP token balance

**uniswap-v3-factory.ts** - V3 factory contract
- `getPool(tokenA, tokenB, fee)` - Get pool address
- `createPool(tokenA, tokenB, fee)` - Create new pool

**uniswap-v3-quoter.ts** - V3 quoter contract
- `quoteExactInputSingle(...)` - Quote single-hop swap
- `quoteExactInput(...)` - Quote multi-hop swap

**uniswap-v3-pool.ts** - V3 pool contract
- `slot0()` - Get pool state (sqrtPriceX96, tick, etc.)
- `liquidity()` - Get current liquidity
- `token0()` - First token address
- `token1()` - Second token address
- `fee()` - Pool fee tier

**uniswap-v3-swap-router.ts** - V3 router contract
- `exactInputSingle(...)` - Single-hop swap
- `exactInput(...)` - Multi-hop swap
- `exactOutputSingle(...)` - Single-hop exact output
- `exactOutput(...)` - Multi-hop exact output

**Usage Example:**
```typescript
import { ERC20_ABI } from '@/lib/abis/erc20'
import { UNISWAP_V3_ROUTER_ABI } from '@/lib/abis/uniswap-v3-swap-router'

const { data } = useReadContract({
  address: tokenAddress,
  abi: ERC20_ABI,
  functionName: 'balanceOf',
  args: [address]
})
```

---

## Dependencies (v0.2.4)

**Core:**
- Next.js: 15.2.0
- React: 19.0.0
- TypeScript: 5.8.0

**Web3:**
- wagmi: 2.15.0
- viem: 2.25.0
- @tanstack/react-query: 5.62.0

**State Management:**
- Zustand: 5.0.0 (IMPLEMENTED - swap store)

**UI:**
- Radix UI (avatar, badge, dialog, dropdown-menu, input, label, navigation-menu, scroll-area, select, separator, sheet, slot)
- Tailwind CSS: 3.4.0
- lucide-react: 0.562.0 (icons)
- framer-motion: 11.15.0 (animations)
- sonner: 2.0.7 (notifications)

**Development:**
- ESLint: 9.0.0
- Prettier: 3.4.0
- Husky: 9.1.0 (git hooks)
- Vitest: 2.1.0 (testing)
- Playwright: 1.49.0 (E2E testing)

**Planned for Future Phases:**
- React Hook Form: 7.55.0 (planned for launchpad forms)
- Zod: 3.24.0 (planned for input validation)

---

## Component Data Flow Examples

### Wallet Connection Flow (IMPLEMENTED ✅)

```
1. User clicks "Connect Wallet"
   └─> ConnectButton opens ConnectModal

2. User selects wallet (e.g., MetaMask)
   └─> wagmi useConnect() hook initiates connection
   └─> Loading state shown

3. Connection successful
   └─> Modal closes
   └─> Toast success notification
   └─> ConnectButton shows formatted address
   └─> AccountDropdown becomes available

4. User clicks address
   └─> AccountDropdown opens
   └─> Shows balance and chain info

5. User copies address
   └─> Clipboard API called
   └─> Toast success notification

6. User clicks "View on Explorer"
   └─> Opens chain explorer in new tab
   └─> Uses rel="noopener noreferrer"

7. User clicks "Disconnect"
   └─> wagmi useDisconnect() hook
   └─> Toast success notification
   └─> ConnectButton resets to "Connect Wallet"
```

### Network Switch Flow (IMPLEMENTED ✅)

```
1. User sees current chain (e.g., "BNB Chain")
   └─> NetworkSwitcher shows chain name and icon

2. User clicks network dropdown
   └─> Lists all 6 supported chains
   └─> Shows active indicator on current chain

3. User selects different chain (e.g., "Base")
   └─> wagmi useSwitchChain() initiates switch
   └─> Loading state shown

4. Switch successful
   └─> Toast success notification
   └─> NetworkSwitcher updates to "Base"
   └─> Account balance updates for new chain
```

### Swap Flow (IMPLEMENTED ✅)

```
1. User navigates to /swap
   └─> SwapCard component loads
   └─> Checks if wallet is connected
   └─> Fetches user's token balances

2. User selects "From" token (e.g., KUB)
   └─> TokenSelect modal opens
   └─> Shows available tokens for current chain
   └─> User selects token
   └─> Token balance fetched

3. User selects "To" token (e.g., USDT)
   └─> TokenSelect modal opens
   └─> Shows available tokens (excludes "From" token)
   └─> User selects token
   └─> URL parameters updated

4. User enters amount (e.g., "100")
   └─> Input debounced (500ms)
   └─> useMultiDexQuotes hook triggered
   ├─> Fetches V3 quotes (direct + multi-hop)
   ├─> Fetches V2 quotes (direct + multi-hop)
   └─> Compares all routes

5. Quotes received
   └─> DexSelectCard shows all available DEXs
   └─> Best DEX highlighted (if auto-select enabled)
   └─> Displays price impact, route info
   └─> Shows minimum output (with slippage)

6. User clicks "Swap"
   ├─> Checks token allowance
   │  ├─> If insufficient:
   │  │  ├─> Builds approval transaction
   │  │  ├─> useTokenApproval hook handles approval
   │  │  ├─> User confirms in wallet
   │  │  └─> Waits for approval confirmation
   │  └─> If sufficient: proceed to swap
   └─> Validates balance

7. Swap transaction
   ├─> Builds swap transaction (V2 or V3 based on selected DEX)
   ├─> Encodes path (token addresses)
   ├─> Calculates minimum output (with slippage)
   ├─> Sets deadline (from settings)
   ├─> Simulates transaction
   ├─> User confirms in wallet
   └─> Waits for confirmation

8. Transaction confirmation
   ├─> Shows loading state
   ├─> Tracks transaction status
   ├─> Updates balances on success
   ├─> Shows success toast with explorer link
   └─> Resets swap form

9. Error handling
   ├─> Transaction rejected (4001)
   │  └─> Shows error toast (user-friendly)
   ├─> Insufficient balance
   │  └─> Shows error toast with amount needed
   ├─> Slippage exceeded
   │  └─> Shows error toast
   └─> Other errors
      └─> Shows error toast with details
```

### DEX Comparison Flow (IMPLEMENTED ✅)

```
1. User enters swap amount
   └─> Triggers useMultiDexQuotes hook

2. Hook aggregates quotes from all DEXs
   ├─> CMswap (V3) - KUB Testnet
   │  ├─> Direct route: KUB → USDT
   │  └─> Multi-hop: KUB → tKKUB → USDT
   ├─> CMswap (V3) - JBC Chain
   │  └─> Direct route: JBC → USDT
   └─> Jibswap (V2) - JBC Chain
      └─> Direct route: JBC → USDT

3. Quotes compared
   ├─> Best output amount selected
   ├─> Price difference calculated
   └─> DEX select card updated

4. User sees comparison
   ├─> All DEXs listed
   ├─> Output amounts shown
   ├─> Best DEX highlighted
   └─> Price difference displayed (e.g., "+0.5%")

5. User can:
   ├─> Keep auto-select best DEX (default)
   ├─> Manually select a different DEX
   └─> View route details (hops, pools)
```

---

## Future Architecture Enhancements

### Phase 3 (Bridge)

1. **Cross-chain State** - Track transactions across chains
2. **Relayer Monitoring** - Track LayerZero message delivery
3. **Bridge Status UI** - Real-time bridge progress

### Phase 4 (Earn/Staking)

1. **Pool Monitoring** - Track liquidity pool states
2. **Reward Calculation** - Real-time APY calculation
3. **Staking UI** - Deposit/withdraw liquidity

### Phase 5 (Launchpad)

1. **Contract Deployment** - Foundry integration
2. **Pool Management** - Uniswap V4 SDK
3. **Token Metadata** - IPFS for token images/info

### Phase 6 (Advanced Swap Features)

1. **Limit Orders** - Off-chain order book
2. **TWAP/DCA** - Automated execution strategies
3. **Price Charts** - Historical price data
4. **Transaction History** - User swap history

### Phase 7 (Polish)

1. **Microservices** - Separate services for each feature
2. **Redis Cache** - Price data caching
3. **WebSocket** - Real-time price updates
