'use client'

import { useEffect } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import type { Address } from 'viem'
import type { Token } from '@/types/tokens'
import { buildInfiniteApprovalParams, needsApproval } from '@/services/tokens'
import { getDexConfig, getProtocolSpender } from '@/lib/dex-config'
import { useSwapStore } from '@/store/swap-store'
import { ERC20_ABI } from '@/lib/abis/erc20'
import { isNativeToken } from '@/lib/wagmi'
import { getAllowanceFunctionName } from '@/lib/tokens'

export interface UseTokenApprovalParams {
    token: Token | null
    owner?: Address
    amountToApprove?: bigint
}

export interface UseTokenApprovalResult {
    allowance: bigint
    needsApproval: boolean
    isApproving: boolean
    isConfirming: boolean
    isSuccess: boolean
    isError: boolean
    error: Error | null
    hash: Address | undefined
    approve: () => void
}

export function useTokenApproval({
    token,
    owner,
    amountToApprove,
}: UseTokenApprovalParams): UseTokenApprovalResult {
    const { selectedDex } = useSwapStore()
    const dexConfig = token ? getDexConfig(token.chainId, selectedDex) : undefined
    const spender = dexConfig ? getProtocolSpender(dexConfig) : undefined
    const isTokenNative = token ? isNativeToken(token.address) : false
    const { data: allowance = 0n, refetch: refetchAllowance } = useReadContract({
        address: token?.address as Address,
        abi: ERC20_ABI,
        functionName: token ? getAllowanceFunctionName(token.address) : 'allowance',
        args: [owner || '0x0', spender || '0x0'],
        chainId: token?.chainId,
        query: {
            enabled: !!token && !!owner && !!spender && !isTokenNative,
        },
    })
    const {
        data: hash,
        writeContract: approve,
        isPending: isApproving,
        isError,
        error,
    } = useWriteContract()
    const { isSuccess, isPending: isConfirming } = useWaitForTransactionReceipt({
        hash,
    })
    useEffect(() => {
        if (isSuccess) {
            refetchAllowance()
        }
    }, [isSuccess, refetchAllowance])
    const needsToApprove =
        token && !isTokenNative && amountToApprove
            ? needsApproval(allowance, amountToApprove)
            : false
    return {
        allowance,
        needsApproval: needsToApprove,
        isApproving,
        isConfirming,
        isSuccess,
        isError,
        error,
        hash,
        approve: () => {
            if (!token || !spender || !owner || isTokenNative) return
            approve({
                ...buildInfiniteApprovalParams(token.address as Address, spender),
                chainId: token.chainId,
            })
        },
    }
}
