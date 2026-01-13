# TBridge-V2 Security Audit Report

**Version:** 1.0
**Date:** January 13, 2026
**Auditor:** Internal Security Review
**Scope:** `/contracts/src/` - All Solidity smart contracts

---

## Executive Summary

This security audit covers the TBridge-V2 cross-chain bridge protocol, consisting of four core contracts for ERC20 token bridging between KUB, JBC, and BSC networks. The codebase demonstrates solid security fundamentals with proper use of OpenZeppelin libraries, reentrancy protection, and upgradeable patterns.

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 3 |
| Low | 4 |
| Informational | 3 |

**Overall Assessment:** The contracts are well-structured and follow security best practices. No critical vulnerabilities were identified. Medium-severity findings relate to centralization risks and design decisions that should be addressed before mainnet deployment.

---

## Contracts in Scope

| Contract | LOC | Type | Purpose |
|----------|-----|------|---------|
| `TBridgeV2.sol` | ~280 | UUPS Upgradeable | Core bridge logic |
| `TBridgeVault.sol` | ~220 | UUPS Upgradeable | LP deposits & fee distribution |
| `TBridgeFeeCollector.sol` | ~80 | Non-upgradeable | Protocol fee management |
| `TBridgeTokenRegistry.sol` | ~160 | UUPS Upgradeable | Token whitelist & mappings |

**Compiler:** Solidity 0.8.19
**Dependencies:** OpenZeppelin Contracts v4.x, OpenZeppelin Contracts-Upgradeable v4.x

---

## Architecture Overview

```
┌─────────────┐     initiateBridge()      ┌──────────────────┐
│    User     │ ──────────────────────────▶│   TBridgeV2      │
└─────────────┘                            │   (Bridge)       │
                                           └────────┬─────────┘
                                                    │
                    ┌───────────────────────────────┼───────────────────────────────┐
                    │                               │                               │
                    ▼                               ▼                               ▼
         ┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐
         │  TBridgeVault    │           │ TBridgeFeeCollector│         │TBridgeTokenRegistry│
         │  (LP Liquidity)  │           │   (Treasury)     │           │  (Whitelist)     │
         └──────────────────┘           └──────────────────┘           └──────────────────┘
                    │
                    │ releaseFunds()
                    ▼
         ┌──────────────────┐
         │    Relayer       │
         │  (Off-chain)     │
         └──────────────────┘
```

---

## Findings

### MEDIUM SEVERITY

#### M-01: Single Relayer Centralization Risk

**Location:** `TBridgeV2.sol`
**Status:** Acknowledged

**Description:**
The bridge relies on a single relayer address to process cross-chain fund releases. If the relayer private key is compromised, stolen, or becomes unavailable, the entire bridge becomes non-functional or vulnerable.

```solidity
address public relayer;

function releaseFunds(...) external nonReentrant {
    if (msg.sender != relayer) revert UnauthorizedRelayer();
    // ...
}
```

**Impact:**
- Single point of failure for bridge operations
- Compromised relayer can front-run or delay user transactions
- No redundancy if relayer infrastructure fails

**Recommendation:**
Implement a multi-relayer system with threshold signatures:
```solidity
mapping(address => bool) public relayers;
uint256 public requiredConfirmations;

function releaseFunds(..., bytes[] calldata signatures) external {
    require(validateSignatures(signatures) >= requiredConfirmations);
    // ...
}
```

---

#### M-02: Vault lock() Function Has No Effect

**Location:** `TBridgeVault.sol:lock()`
**Status:** Design Review Required

**Description:**
The `lock()` function only emits an event but performs no state changes. Tokens are not actually locked in the vault's accounting system.

```solidity
function lock(address token, address from, uint256 amount) external onlyBridge {
    emit TokensLocked(token, from, amount);
    // No state change - tokens not tracked as "locked"
}
```

**Impact:**
- Misleading function name suggests token locking occurs
- No on-chain record of pending bridge transfers
- LP withdrawals could deplete liquidity needed for pending releases

**Recommendation:**
Either implement actual locking:
```solidity
mapping(address => uint256) private _lockedBalance;

function lock(address token, address, uint256 amount) external onlyBridge {
    _lockedBalance[token] += amount;
    emit TokensLocked(token, from, amount);
}

function _getAvailableLiquidity(address token) internal view returns (uint256) {
    uint256 balance = IERC20(token).balanceOf(address(this));
    uint256 locked = _lockedBalance[token];
    uint256 fees = _accumulatedFees[token];
    return balance > (locked + fees) ? balance - locked - fees : 0;
}
```

Or rename the function to `emitBridgeInitiated()` to clarify its purpose.

---

#### M-03: FeeCollector Lacks Access Control on collectFee()

**Location:** `TBridgeFeeCollector.sol:collectFee()`
**Status:** Low Risk

**Description:**
The `collectFee()` function can be called by any address, not just the bridge contract.

```solidity
function collectFee(address token, uint256 amount) external {
    _totalFeesCollected[token] += amount;
    emit FeeCollected(token, amount);
}
```

**Impact:**
- Any caller can artificially inflate `_totalFeesCollected` counters
- Does not affect actual token balances (no funds at risk)
- Could cause misleading analytics/metrics

**Recommendation:**
Add access control:
```solidity
address public bridge;

modifier onlyBridge() {
    require(msg.sender == bridge, "Not bridge");
    _;
}

function collectFee(address token, uint256 amount) external onlyBridge {
    // ...
}
```

---

### LOW SEVERITY

#### L-01: No Token Contract Validation

**Location:** `TBridgeTokenRegistry.sol:registerToken()`
**Status:** Acknowledged

**Description:**
Tokens are registered without verifying they are valid ERC20 contracts. A non-contract address or malformed token could be registered.

**Recommendation:**
Add contract size check:
```solidity
function _isContract(address addr) internal view returns (bool) {
    uint256 size;
    assembly { size := extcodesize(addr) }
    return size > 0;
}

function registerToken(address localToken, ...) external onlyOwner {
    require(_isContract(localToken), "Not a contract");
    // ...
}
```

---

#### L-02: Fee Rounding Favors Protocol

**Location:** `TBridgeV2.sol:getBridgeQuote()`
**Status:** Informational

**Description:**
Integer division truncates fees down, meaning users pay slightly less than the exact percentage. For dust amounts, this could result in zero fees.

```solidity
bridgeFee = (amount * bridgeFeeBps) / BPS_DENOMINATOR; // Truncates
```

**Impact:** Minimal - fractions of wei difference

**Recommendation:** Document this behavior or round up for protocol fees:
```solidity
bridgeFee = (amount * bridgeFeeBps + BPS_DENOMINATOR - 1) / BPS_DENOMINATOR;
```

---

#### L-03: Block Timestamp Manipulation for Daily Limits

**Location:** `TBridgeV2.sol:_checkAndUpdateDailyLimit()`
**Status:** Acceptable Risk

**Description:**
Daily limits use `block.timestamp` which miners can manipulate by ~15 seconds per block.

**Impact:** Negligible for 1-day (86400 second) periods

**Recommendation:** No change required. Document the acceptable deviation.

---

#### L-04: Missing Zero Amount Check in FeeCollector

**Location:** `TBridgeFeeCollector.sol:collectFee()`
**Status:** Gas Optimization

**Description:**
Zero-amount fee collections are processed, wasting gas and emitting meaningless events.

**Recommendation:**
```solidity
function collectFee(address token, uint256 amount) external {
    if (amount == 0) return;
    // ...
}
```

---

### INFORMATIONAL

#### I-01: Storage Gap Sizes Vary Between Contracts

**Description:**
Storage gaps are defined but sizes differ: 40 (V2), 43 (Vault), 47 (Registry). This is not a vulnerability but could cause confusion during upgrades.

**Recommendation:** Standardize gap calculation methodology and document in code comments.

---

#### I-02: No Event for Daily Limit Reset

**Description:**
When a user's daily limit resets, no event is emitted. This makes off-chain tracking of limit states more difficult.

**Recommendation:** Consider emitting `DailyLimitReset(user, token, timestamp)`.

---

#### I-03: getSupportedTokens() Gas Cost

**Location:** `TBridgeTokenRegistry.sol`
**Description:**
The function iterates twice through registered tokens - once to count enabled tokens, once to build the array. For large token registries, this could exceed block gas limits.

**Recommendation:** For off-chain queries only; consider pagination for on-chain consumers.

---

## Security Checklist

### Reentrancy Protection

| Function | Protected | Notes |
|----------|-----------|-------|
| `TBridgeV2.initiateBridge()` | ✅ | `nonReentrant` modifier |
| `TBridgeV2.releaseFunds()` | ✅ | `nonReentrant` modifier |
| `TBridgeVault.deposit()` | ✅ | `nonReentrant` modifier |
| `TBridgeVault.withdraw()` | ✅ | `nonReentrant` modifier |
| `TBridgeVault.claimFees()` | ✅ | `nonReentrant` modifier |
| `TBridgeVault.release()` | ✅ | `nonReentrant` modifier |

### Access Control Matrix

| Action | Owner | Relayer | Bridge | LP | User |
|--------|-------|---------|--------|-----|------|
| Upgrade contracts | ✅ | - | - | - | - |
| Set fees | ✅ | - | - | - | - |
| Set relayer | ✅ | - | - | - | - |
| Pause bridge | ✅ | - | - | - | - |
| Release funds | - | ✅ | - | - | - |
| Lock tokens | - | - | ✅ | - | - |
| Deposit liquidity | - | - | - | ✅ | - |
| Initiate bridge | - | - | - | - | ✅ |

### Token Handling

| Check | Status |
|-------|--------|
| SafeERC20 used for all transfers | ✅ |
| Return values handled | ✅ (via SafeERC20) |
| Approval race condition | N/A (no approve calls) |
| Fee-on-transfer tokens | ⚠️ Not supported |
| Rebasing tokens | ⚠️ Not supported |

### Replay Protection

| Check | Status |
|-------|--------|
| Nonce tracking implemented | ✅ |
| Cross-chain replay prevented | ✅ (keyed by sourceChain) |
| Nonce marked before external calls | ✅ |

---

## Recommendations Summary

### High Priority (Before Mainnet)

1. **Implement multi-relayer system** - Reduce single point of failure risk
2. **Clarify vault lock() purpose** - Either implement locking or rename function
3. **Add onlyBridge to FeeCollector** - Prevent counter manipulation

### Medium Priority

4. Add token contract validation in registry
5. Document fee rounding behavior
6. Add zero-amount checks for gas optimization

### Low Priority

7. Standardize storage gap sizes
8. Add DailyLimitReset events
9. Consider pagination for getSupportedTokens()

---

## Test Coverage

The test suite provides comprehensive coverage:

| Test File | Test Cases | Coverage Areas |
|-----------|------------|----------------|
| `TBridgeV2.t.sol` | 12+ | Bridge flow, fees, limits, pause |
| `TBridgeVault.t.sol` | 10+ | LP operations, fee distribution |
| `TBridgeTokenRegistry.t.sol` | 8+ | Registration, mappings, limits |
| `TBridgeFeeCollector.t.sol` | 6+ | Collection, withdrawal, treasury |

**Notable Test Coverage:**
- ✅ Happy path scenarios
- ✅ Revert conditions
- ✅ Access control violations
- ✅ Edge cases (zero amounts, max values)
- ✅ Multi-user scenarios
- ⚠️ Fuzz testing (limited)
- ⚠️ Invariant testing (not present)

---

## Conclusion

The TBridge-V2 codebase demonstrates mature security practices with proper use of battle-tested OpenZeppelin libraries. The identified issues are primarily related to centralization risks and design clarifications rather than exploitable vulnerabilities.

**Key Strengths:**
- Comprehensive reentrancy protection
- Well-implemented fee distribution mechanism
- Proper UUPS upgrade pattern with storage gaps
- Strong test coverage

**Areas for Improvement:**
- Decentralize relayer infrastructure
- Clarify token locking mechanism
- Add additional access controls

The contracts are suitable for testnet deployment. Address medium-severity findings before mainnet launch.

---

## Appendix A: Contract Addresses

*To be populated after deployment*

| Contract | Network | Address |
|----------|---------|---------|
| TBridgeV2 | KUB | - |
| TBridgeV2 | JBC | - |
| TBridgeV2 | BSC | - |
| TBridgeVault | KUB | - |
| ... | ... | ... |

---

## Appendix B: External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| @openzeppelin/contracts | 4.x | ERC20, SafeERC20, Ownable |
| @openzeppelin/contracts-upgradeable | 4.x | Upgradeable base contracts |
| forge-std | latest | Testing framework |

---

*End of Audit Report*
