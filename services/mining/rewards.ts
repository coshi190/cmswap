import { encodeFunctionData, type Address, type Hex } from 'viem'
import { UNISWAP_V3_STAKER_ABI } from '@/lib/abis/uniswap-v3-staker'

/**
 * Encode claimReward call
 * @param rewardToken The reward token address
 * @param to The recipient address
 * @param amountRequested Amount to claim (0n = claim all available)
 */
export function encodeClaimReward(rewardToken: Address, to: Address, amountRequested: bigint): Hex {
    return encodeFunctionData({
        abi: UNISWAP_V3_STAKER_ABI,
        functionName: 'claimReward',
        args: [rewardToken, to, amountRequested],
    })
}

/**
 * Calculate estimated APR for an incentive
 * @param totalReward Total reward amount
 * @param durationSeconds Incentive duration in seconds
 * @param totalStakedValueUsd Total staked liquidity value in USD
 * @param rewardTokenPriceUsd Reward token price in USD
 * @returns APR as a percentage (e.g., 50 = 50%)
 */
export function calculateIncentiveAPR(
    totalReward: bigint,
    durationSeconds: number,
    totalStakedValueUsd: number,
    rewardTokenPriceUsd: number,
    rewardTokenDecimals: number = 18
): number {
    if (totalStakedValueUsd <= 0 || durationSeconds <= 0) return 0

    // Calculate total reward value in USD
    const rewardAmount = Number(totalReward) / Math.pow(10, rewardTokenDecimals)
    const totalRewardValueUsd = rewardAmount * rewardTokenPriceUsd

    // Annualize the reward rate
    const secondsPerYear = 365 * 24 * 60 * 60
    const annualizedRewardUsd = (totalRewardValueUsd / durationSeconds) * secondsPerYear

    // Calculate APR
    return (annualizedRewardUsd / totalStakedValueUsd) * 100
}

/**
 * Format reward amount for display
 * @param amount Raw reward amount (bigint)
 * @param decimals Token decimals
 * @param maxDecimals Maximum decimal places to show
 */
export function formatRewardAmount(
    amount: bigint,
    decimals: number = 18,
    maxDecimals: number = 6
): string {
    const value = Number(amount) / Math.pow(10, decimals)

    if (value === 0) return '0'
    if (value < 0.000001) return '<0.000001'

    return value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals,
    })
}

/**
 * Calculate accumulated rewards for a staked position
 * This is a simplified calculation - actual rewards are computed on-chain
 * @param liquidity Position liquidity
 * @param secondsStaked Seconds position has been staked
 * @param totalReward Total incentive reward
 * @param totalLiquidity Total liquidity staked in the incentive
 * @param durationSeconds Total incentive duration
 */
export function estimatePendingRewards(
    liquidity: bigint,
    secondsStaked: number,
    totalReward: bigint,
    totalLiquidity: bigint,
    durationSeconds: number
): bigint {
    if (totalLiquidity === 0n || durationSeconds === 0) return 0n

    // Reward rate per second
    const rewardPerSecond = totalReward / BigInt(durationSeconds)

    // User's share of rewards per second based on liquidity
    const userRewardPerSecond = (rewardPerSecond * liquidity) / totalLiquidity

    // Total estimated rewards
    return userRewardPerSecond * BigInt(secondsStaked)
}
