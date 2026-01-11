import type { V3Position, PositionWithTokens } from '@/types/earn'
import {
    getAmountsForLiquidity,
    tickToSqrtPriceX96,
    sqrtPriceX96ToPrice,
    tickToPrice,
    isInRange,
    formatFeeTier,
} from '@/lib/liquidity-helpers'
import { formatTokenAmount } from '@/services/tokens'

/**
 * Pool state needed for position calculations
 */
export interface PoolState {
    sqrtPriceX96: bigint
    tick: number
    liquidity: bigint
}

/**
 * Calculate current token amounts from position liquidity
 */
export function calculatePositionAmounts(
    position: V3Position,
    poolState: PoolState
): { amount0: bigint; amount1: bigint } {
    if (position.liquidity === 0n) {
        return { amount0: 0n, amount1: 0n }
    }

    const sqrtPriceAX96 = tickToSqrtPriceX96(position.tickLower)
    const sqrtPriceBX96 = tickToSqrtPriceX96(position.tickUpper)

    return getAmountsForLiquidity(
        poolState.sqrtPriceX96,
        sqrtPriceAX96,
        sqrtPriceBX96,
        position.liquidity
    )
}

/**
 * Estimate uncollected fees for a position
 * Note: This is a simplified calculation. Actual fees require on-chain feeGrowthGlobal values.
 * For accurate fees, use the position's tokensOwed0/tokensOwed1 values.
 */
export function getUncollectedFees(position: V3Position): { fees0: bigint; fees1: bigint } {
    // The tokensOwed values represent the fees that can be collected
    return {
        fees0: position.tokensOwed0,
        fees1: position.tokensOwed1,
    }
}

/**
 * Format position for UI display
 */
export function formatPositionDisplay(
    position: PositionWithTokens,
    poolState?: PoolState
): {
    token0Amount: string
    token1Amount: string
    fees0Amount: string
    fees1Amount: string
    inRange: boolean
    priceLower: string
    priceUpper: string
    currentPrice: string
    feeFormatted: string
    rangeWidthPercent: string
} {
    // Calculate amounts if pool state provided
    let amount0 = position.amount0
    let amount1 = position.amount1
    let currentTick = 0

    if (poolState) {
        const amounts = calculatePositionAmounts(position, poolState)
        amount0 = amounts.amount0
        amount1 = amounts.amount1
        currentTick = poolState.tick
    }

    const { fees0, fees1 } = getUncollectedFees(position)

    // Calculate prices
    const decimals0 = position.token0Info.decimals
    const decimals1 = position.token1Info.decimals

    const priceLower = tickToPrice(position.tickLower, decimals0, decimals1)
    const priceUpper = tickToPrice(position.tickUpper, decimals0, decimals1)
    const currentPrice = poolState
        ? sqrtPriceX96ToPrice(poolState.sqrtPriceX96, decimals0, decimals1)
        : '0'

    // Calculate range width percentage
    const priceRatio = parseFloat(priceUpper) / parseFloat(priceLower)
    const rangeWidthPercent = ((priceRatio - 1) * 100).toFixed(1)

    return {
        token0Amount: formatTokenAmount(amount0, decimals0),
        token1Amount: formatTokenAmount(amount1, decimals1),
        fees0Amount: formatTokenAmount(fees0, decimals0),
        fees1Amount: formatTokenAmount(fees1, decimals1),
        inRange: isInRange(currentTick, position.tickLower, position.tickUpper),
        priceLower,
        priceUpper,
        currentPrice,
        feeFormatted: formatFeeTier(position.fee),
        rangeWidthPercent: `${rangeWidthPercent}%`,
    }
}

/**
 * Get position status label and color
 */
export function getPositionStatus(
    position: PositionWithTokens,
    currentTick?: number
): {
    label: string
    variant: 'default' | 'success' | 'warning' | 'destructive'
} {
    if (position.liquidity === 0n) {
        return { label: 'Closed', variant: 'destructive' }
    }

    if (currentTick === undefined) {
        return { label: 'Unknown', variant: 'default' }
    }

    const inRange = isInRange(currentTick, position.tickLower, position.tickUpper)

    if (inRange) {
        return { label: 'In Range', variant: 'success' }
    }

    // Determine if price is above or below range
    if (currentTick < position.tickLower) {
        return { label: 'Below Range', variant: 'warning' }
    }

    return { label: 'Above Range', variant: 'warning' }
}

/**
 * Calculate position share of pool liquidity
 */
export function calculatePoolShare(positionLiquidity: bigint, poolLiquidity: bigint): string {
    if (poolLiquidity === 0n) return '0%'

    const sharePercent = (Number(positionLiquidity) / Number(poolLiquidity)) * 100

    if (sharePercent < 0.01) {
        return '<0.01%'
    }

    return `${sharePercent.toFixed(2)}%`
}

/**
 * Format position value in USD (if prices available)
 */
export function formatPositionValueUsd(
    amount0: bigint,
    amount1: bigint,
    decimals0: number,
    decimals1: number,
    price0Usd?: number,
    price1Usd?: number
): string | null {
    if (price0Usd === undefined || price1Usd === undefined) {
        return null
    }

    const value0 = (Number(amount0) / 10 ** decimals0) * price0Usd
    const value1 = (Number(amount1) / 10 ** decimals1) * price1Usd
    const totalValue = value0 + value1

    if (totalValue < 0.01) {
        return '<$0.01'
    }

    return `$${totalValue.toFixed(2)}`
}

/**
 * Get price range as percentage from current price
 */
export function getPriceRangePercent(
    currentPrice: string,
    priceLower: string,
    priceUpper: string
): { lowerPercent: string; upperPercent: string } {
    const current = parseFloat(currentPrice)
    const lower = parseFloat(priceLower)
    const upper = parseFloat(priceUpper)

    if (current === 0) {
        return { lowerPercent: '0%', upperPercent: '0%' }
    }

    const lowerPercent = ((lower / current - 1) * 100).toFixed(1)
    const upperPercent = ((upper / current - 1) * 100).toFixed(1)

    return {
        lowerPercent: `${lowerPercent}%`,
        upperPercent: `+${upperPercent}%`,
    }
}

/**
 * Sort positions by various criteria
 */
export type PositionSortKey = 'tokenId' | 'liquidity' | 'inRange' | 'fees'

export function sortPositions(
    positions: PositionWithTokens[],
    sortBy: PositionSortKey,
    ascending: boolean = false
): PositionWithTokens[] {
    const sorted = [...positions].sort((a, b) => {
        switch (sortBy) {
            case 'tokenId':
                return Number(a.tokenId - b.tokenId)
            case 'liquidity':
                return Number(a.liquidity - b.liquidity)
            case 'inRange':
                return (a.inRange ? 1 : 0) - (b.inRange ? 1 : 0)
            case 'fees': {
                const aFees = a.tokensOwed0 + a.tokensOwed1
                const bFees = b.tokensOwed0 + b.tokensOwed1
                return Number(aFees - bFees)
            }
            default:
                return 0
        }
    })

    return ascending ? sorted : sorted.reverse()
}

/**
 * Filter positions by various criteria
 */
export interface PositionFilters {
    hideZeroLiquidity?: boolean
    inRangeOnly?: boolean
    tokenAddress?: string
}

export function filterPositions(
    positions: PositionWithTokens[],
    filters: PositionFilters
): PositionWithTokens[] {
    return positions.filter((position) => {
        if (filters.hideZeroLiquidity && position.liquidity === 0n) {
            return false
        }

        if (filters.inRangeOnly && !position.inRange) {
            return false
        }

        if (filters.tokenAddress) {
            const tokenLower = filters.tokenAddress.toLowerCase()
            const hasToken =
                position.token0.toLowerCase() === tokenLower ||
                position.token1.toLowerCase() === tokenLower
            if (!hasToken) {
                return false
            }
        }

        return true
    })
}
