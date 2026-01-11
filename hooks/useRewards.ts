'use client'

import { useMemo, useCallback } from 'react'
import {
    useReadContract,
    useReadContracts,
    useWriteContract,
    useWaitForTransactionReceipt,
    useSimulateContract,
    useChainId,
} from 'wagmi'
import type { Address } from 'viem'
import type { IncentiveKey, StakedPosition } from '@/types/earn'
import { getV3StakerAddress } from '@/lib/dex-config'
import { UNISWAP_V3_STAKER_ABI } from '@/lib/abis/uniswap-v3-staker'

export function usePendingRewards(
    incentiveKey: IncentiveKey | null,
    tokenId: bigint | undefined
): {
    reward: bigint
    secondsInsideX128: bigint
    isLoading: boolean
    refetch: () => void
} {
    const chainId = useChainId()
    const stakerAddress = getV3StakerAddress(chainId)
    const isEnabled = !!incentiveKey && tokenId !== undefined && !!stakerAddress
    const { data, isLoading, refetch } = useReadContract({
        address: stakerAddress,
        abi: UNISWAP_V3_STAKER_ABI,
        functionName: 'getRewardInfo',
        args: incentiveKey
            ? [
                  {
                      rewardToken: incentiveKey.rewardToken,
                      pool: incentiveKey.pool,
                      startTime: BigInt(incentiveKey.startTime),
                      endTime: BigInt(incentiveKey.endTime),
                      refundee: incentiveKey.refundee,
                  },
                  tokenId!,
              ]
            : undefined,
        query: {
            enabled: isEnabled,
            refetchInterval: 15_000, // Refresh every 15 seconds
            staleTime: 10_000,
        },
    })
    const result = data as [bigint, bigint] | undefined
    return {
        reward: result?.[0] ?? 0n,
        secondsInsideX128: result?.[1] ?? 0n,
        isLoading,
        refetch,
    }
}

export function usePendingRewardsMultiple(stakedPositions: StakedPosition[]): {
    rewards: Map<string, bigint> // Map of tokenId-incentiveId to reward
    isLoading: boolean
    refetch: () => void
} {
    const chainId = useChainId()
    const stakerAddress = getV3StakerAddress(chainId)
    const contracts = useMemo(() => {
        if (!stakerAddress || stakedPositions.length === 0) return []
        return stakedPositions.map((sp) => ({
            address: stakerAddress,
            abi: UNISWAP_V3_STAKER_ABI,
            functionName: 'getRewardInfo' as const,
            args: [
                {
                    rewardToken: sp.incentive.rewardToken,
                    pool: sp.incentive.pool,
                    startTime: BigInt(sp.incentive.startTime),
                    endTime: BigInt(sp.incentive.endTime),
                    refundee: sp.incentive.refundee,
                },
                sp.tokenId,
            ] as const,
            chainId,
        }))
    }, [stakerAddress, stakedPositions, chainId])
    const { data, isLoading, refetch } = useReadContracts({
        contracts,
        query: {
            enabled: contracts.length > 0,
            refetchInterval: 15_000,
            staleTime: 10_000,
        },
    })
    const rewards = useMemo(() => {
        const rewardMap = new Map<string, bigint>()
        if (!data) return rewardMap
        stakedPositions.forEach((sp, index) => {
            const result = data[index]?.result as [bigint, bigint] | undefined
            const key = `${sp.tokenId.toString()}-${sp.incentiveId}`
            rewardMap.set(key, result?.[0] ?? 0n)
        })
        return rewardMap
    }, [data, stakedPositions])
    return {
        rewards,
        isLoading,
        refetch,
    }
}

export function useClaimableRewards(
    rewardToken: Address | undefined,
    owner: Address | undefined
): {
    claimableRewards: bigint
    isLoading: boolean
    refetch: () => void
} {
    const chainId = useChainId()
    const stakerAddress = getV3StakerAddress(chainId)
    const isEnabled = !!rewardToken && !!owner && !!stakerAddress
    const { data, isLoading, refetch } = useReadContract({
        address: stakerAddress,
        abi: UNISWAP_V3_STAKER_ABI,
        functionName: 'rewards',
        args: rewardToken && owner ? [rewardToken, owner] : undefined,
        query: {
            enabled: isEnabled,
            refetchInterval: 15_000,
            staleTime: 10_000,
        },
    })
    return {
        claimableRewards: (data as bigint) ?? 0n,
        isLoading,
        refetch,
    }
}

export function useClaimRewards(
    rewardToken: Address | undefined,
    recipient: Address | undefined
): {
    claim: () => void
    claimableRewards: bigint
    isPreparing: boolean
    isExecuting: boolean
    isConfirming: boolean
    isSuccess: boolean
    error: Error | null
    hash: `0x${string}` | undefined
    refetchRewards: () => void
} {
    const chainId = useChainId()
    const stakerAddress = getV3StakerAddress(chainId)
    const isEnabled = !!rewardToken && !!recipient && !!stakerAddress
    const {
        claimableRewards,
        isLoading: isLoadingRewards,
        refetch: refetchRewards,
    } = useClaimableRewards(rewardToken, recipient)
    const {
        data: claimSimulation,
        isLoading: isSimulating,
        error: simulationError,
    } = useSimulateContract({
        address: stakerAddress!,
        abi: UNISWAP_V3_STAKER_ABI,
        functionName: 'claimReward',
        args: rewardToken && recipient ? [rewardToken, recipient, 0n] : undefined, // 0n = claim all
        query: {
            enabled: isEnabled && claimableRewards > 0n,
        },
    })
    const {
        writeContract,
        data: hash,
        isPending: isExecuting,
        error: writeError,
    } = useWriteContract()
    const {
        isLoading: isConfirming,
        isSuccess,
        error: receiptError,
    } = useWaitForTransactionReceipt({ hash })
    const claim = useCallback(() => {
        if (!claimSimulation?.request) return
        writeContract(claimSimulation.request)
    }, [claimSimulation, writeContract])
    return {
        claim,
        claimableRewards,
        isPreparing: isSimulating || isLoadingRewards,
        isExecuting,
        isConfirming,
        isSuccess,
        error: writeError || receiptError || (simulationError as Error | null),
        hash,
        refetchRewards,
    }
}
