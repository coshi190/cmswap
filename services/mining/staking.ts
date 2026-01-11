import { encodeFunctionData, encodeAbiParameters, keccak256, type Address, type Hex } from 'viem'
import type { IncentiveKey, StakeParams, UnstakeParams } from '@/types/earn'
import { UNISWAP_V3_STAKER_ABI } from '@/lib/abis/uniswap-v3-staker'

// Minimal ABI for safeTransferFrom with data parameter (avoids overload issues)
const SAFE_TRANSFER_FROM_ABI = [
    {
        type: 'function',
        name: 'safeTransferFrom',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'tokenId', type: 'uint256' },
            { name: 'data', type: 'bytes' },
        ],
        outputs: [],
    },
] as const

/**
 * Compute the incentive ID from an IncentiveKey
 * This is the keccak256 hash of the encoded IncentiveKey struct
 */
export function computeIncentiveId(key: IncentiveKey): `0x${string}` {
    return keccak256(
        encodeAbiParameters(
            [
                { type: 'address', name: 'rewardToken' },
                { type: 'address', name: 'pool' },
                { type: 'uint256', name: 'startTime' },
                { type: 'uint256', name: 'endTime' },
                { type: 'address', name: 'refundee' },
            ],
            [key.rewardToken, key.pool, BigInt(key.startTime), BigInt(key.endTime), key.refundee]
        )
    )
}

/**
 * Encode the IncentiveKey for use as safeTransferFrom data parameter
 * When transferring NFT to staker with this data, it will deposit and stake in one tx
 */
export function encodeIncentiveKeyData(key: IncentiveKey): Hex {
    return encodeAbiParameters(
        [
            {
                type: 'tuple',
                components: [
                    { type: 'address', name: 'rewardToken' },
                    { type: 'address', name: 'pool' },
                    { type: 'uint256', name: 'startTime' },
                    { type: 'uint256', name: 'endTime' },
                    { type: 'address', name: 'refundee' },
                ],
            },
        ],
        [
            {
                rewardToken: key.rewardToken,
                pool: key.pool,
                startTime: BigInt(key.startTime),
                endTime: BigInt(key.endTime),
                refundee: key.refundee,
            },
        ]
    )
}

/**
 * Encode safeTransferFrom call to deposit and stake NFT in one transaction
 * The V3 Staker's onERC721Received will handle the staking
 */
export function encodeDepositAndStake(
    owner: Address,
    staker: Address,
    tokenId: bigint,
    incentiveKey: IncentiveKey
): Hex {
    const data = encodeIncentiveKeyData(incentiveKey)
    return encodeFunctionData({
        abi: SAFE_TRANSFER_FROM_ABI,
        functionName: 'safeTransferFrom',
        args: [owner, staker, tokenId, data],
    })
}

/**
 * Encode stakeToken call for already deposited NFT
 */
export function encodeStakeToken(params: StakeParams): Hex {
    return encodeFunctionData({
        abi: UNISWAP_V3_STAKER_ABI,
        functionName: 'stakeToken',
        args: [
            {
                rewardToken: params.incentiveKey.rewardToken,
                pool: params.incentiveKey.pool,
                startTime: BigInt(params.incentiveKey.startTime),
                endTime: BigInt(params.incentiveKey.endTime),
                refundee: params.incentiveKey.refundee,
            },
            params.tokenId,
        ],
    })
}

/**
 * Encode unstakeToken call
 */
export function encodeUnstakeToken(params: UnstakeParams): Hex {
    return encodeFunctionData({
        abi: UNISWAP_V3_STAKER_ABI,
        functionName: 'unstakeToken',
        args: [
            {
                rewardToken: params.incentiveKey.rewardToken,
                pool: params.incentiveKey.pool,
                startTime: BigInt(params.incentiveKey.startTime),
                endTime: BigInt(params.incentiveKey.endTime),
                refundee: params.incentiveKey.refundee,
            },
            params.tokenId,
        ],
    })
}

/**
 * Encode withdrawToken call to return NFT to owner
 */
export function encodeWithdrawToken(tokenId: bigint, to: Address): Hex {
    return encodeFunctionData({
        abi: UNISWAP_V3_STAKER_ABI,
        functionName: 'withdrawToken',
        args: [tokenId, to, '0x'],
    })
}

/**
 * Encode claimReward call
 */
export function encodeClaimReward(rewardToken: Address, to: Address, amountRequested: bigint): Hex {
    return encodeFunctionData({
        abi: UNISWAP_V3_STAKER_ABI,
        functionName: 'claimReward',
        args: [rewardToken, to, amountRequested],
    })
}

/**
 * Build multicall data for unstake + claim + withdraw in one transaction
 * This is the full exit flow for a staked position
 */
export function buildUnstakeAndWithdrawMulticall(
    tokenId: bigint,
    incentiveKey: IncentiveKey,
    recipient: Address
): Hex[] {
    return [
        encodeUnstakeToken({ tokenId, incentiveKey }),
        encodeClaimReward(incentiveKey.rewardToken, recipient, 0n), // 0n = claim all
        encodeWithdrawToken(tokenId, recipient),
    ]
}

/**
 * Build multicall data for just unstake + claim (keep position deposited)
 */
export function buildUnstakeAndClaimMulticall(
    tokenId: bigint,
    incentiveKey: IncentiveKey,
    recipient: Address
): Hex[] {
    return [
        encodeUnstakeToken({ tokenId, incentiveKey }),
        encodeClaimReward(incentiveKey.rewardToken, recipient, 0n),
    ]
}
