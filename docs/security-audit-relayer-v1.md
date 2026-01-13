# TBridge-V2 Relayer Security Audit Report

**Version:** 1.0
**Date:** January 13, 2026
**Auditor:** Internal Security Review
**Scope:** `/relayer/src/` - TypeScript bridge relayer service

---

## Executive Summary

This security audit covers the TBridge-V2 Relayer, a TypeScript-based service that monitors blockchain events and executes cross-chain fund releases. The relayer is a critical infrastructure component—compromise could result in loss of bridged funds or denial of service.

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 3 |
| Medium | 6 |
| Low | 3 |
| Informational | 2 |

**Overall Assessment:** The relayer demonstrates solid foundational patterns with TypeScript, Zod validation, and prepared SQL statements. However, critical issues around private key management and transaction atomicity require immediate attention before production deployment.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Relayer Service                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐ │
│  │ Scanner  │───▶│ Processor │───▶│ Executor  │───▶│   DB     │ │
│  └──────────┘    └───────────┘    └───────────┘    └──────────┘ │
│       │                                 │                        │
│       ▼                                 ▼                        │
│  ┌──────────┐                    ┌───────────┐                   │
│  │   RPC    │                    │Gas Manager│                   │
│  │Endpoints │                    └───────────┘                   │
│  └──────────┘                                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Components:**
- **Scanner** (`scanner.ts`) - Monitors `BridgeInitiated` events from all chains
- **Processor** (`processor.ts`) - Orchestrates request handling
- **Executor** (`executor.ts`) - Signs and broadcasts `releaseFunds` transactions
- **Gas Manager** (`gas-manager.ts`) - Manages gas pricing with caching
- **Database** (`db/`) - SQLite persistence for request tracking

---

## Findings

### CRITICAL SEVERITY

#### C-01: Private Key Stored in Plaintext Memory

**Location:** `src/config.ts:66`, `src/core/executor.ts:65`
**Status:** Must Fix Before Production

**Description:**
The relayer private key is loaded from an environment variable and held in memory as plaintext for the entire process lifetime.

```typescript
// config.ts
relayerPrivateKey: requiredEnv('RELAYER_PRIVATE_KEY'),

// executor.ts
this.account = privateKeyToAccount(config.relayerPrivateKey as `0x${string}`)
```

**Attack Vectors:**
1. Server compromise exposes key immediately
2. Memory dump attacks can extract key
3. `.env` file exposure (accidental commit, backup leak)
4. Process inspection by malicious actors with server access

**Impact:** Complete compromise of relayer wallet; attacker can drain all bridged funds.

**Recommendations:**
1. **Immediate:** Use cloud secrets manager (AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager)
2. **Short-term:** Implement key rotation mechanism
3. **Long-term:** Consider HSM or MPC-based signing service
4. Add file permission validation (ensure `.env` is `600`)

```typescript
// Example: AWS Secrets Manager integration
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

async function getPrivateKey(): Promise<string> {
    const client = new SecretsManager({ region: 'ap-southeast-1' });
    const secret = await client.getSecretValue({ SecretId: 'relayer-private-key' });
    return secret.SecretString!;
}
```

---

### HIGH SEVERITY

#### H-01: Race Condition in Transaction Execution

**Location:** `src/core/executor.ts:111-166`
**Status:** Must Fix

**Description:**
There is a time gap between checking if a nonce is processed and executing the transaction. Another instance or process could execute during this gap.

```typescript
// Lines 111-117: Check if processed
const isProcessed = await publicClient.readContract({
    address: destConfig.bridgeAddress,
    abi: TBridgeV2ABI,
    functionName: 'isNonceProcessed',
    args: [BigInt(request.sourceChain), BigInt(request.nonce)],
})

// GAP: Another process could execute here!

// Lines 152-166: Execute transaction
const hash = await walletClient.writeContract({...})
```

**Impact:**
- Double execution attempts (wasted gas)
- Potential race conditions with multiple relayer instances

**Recommendations:**
1. Implement database-level locking before execution:
```typescript
// Use transaction with SELECT FOR UPDATE pattern
db.exec('BEGIN IMMEDIATE');
const request = db.prepare('SELECT * FROM bridge_requests WHERE id = ? AND status = ?').get(id, 'pending');
if (!request) { db.exec('ROLLBACK'); return; }
db.prepare('UPDATE bridge_requests SET status = ? WHERE id = ?').run('executing', id);
db.exec('COMMIT');
// Now safe to execute
```

2. Track pending transaction hashes in database
3. Implement transaction monitoring for stuck transactions

---

#### H-02: RPC Endpoint Trust Without Validation

**Location:** `src/core/scanner.ts`, `src/core/executor.ts`
**Status:** High Risk

**Description:**
The relayer trusts RPC responses without validation. A compromised or malicious RPC endpoint could:

1. Return false `isNonceProcessed` status (skip legitimate transactions)
2. Provide manipulated gas prices (cause overpayment or transaction failure)
3. Return fake transaction receipts
4. Serve stale block data

```typescript
// No validation of RPC response
const isProcessed = await publicClient.readContract({...})
if (isProcessed) {
    return { success: true, skipped: true } // Trusts RPC blindly
}
```

**Impact:** Service disruption, financial loss through gas manipulation, missed transactions.

**Recommendations:**
1. Validate chain ID on startup for each RPC endpoint
2. Cross-reference critical data with multiple RPC providers
3. Implement response sanity checks (gas price bounds, block number progression)
4. Add RPC health monitoring with automatic failover

```typescript
// Startup validation
async function validateRpcEndpoint(client: PublicClient, expectedChainId: number) {
    const chainId = await client.getChainId();
    if (chainId !== expectedChainId) {
        throw new Error(`RPC chain mismatch: expected ${expectedChainId}, got ${chainId}`);
    }
}
```

---

#### H-03: No HTTPS Certificate Validation

**Location:** `src/config.ts:9, 41`
**Status:** High Risk

**Description:**
RPC URLs are validated only for format, not security:

```typescript
rpcUrl: z.string().url()  // Accepts HTTP or HTTPS, no cert validation
```

**Impact:** Man-in-the-middle attacks could intercept or modify RPC traffic.

**Recommendations:**
1. Enforce HTTPS-only URLs:
```typescript
rpcUrl: z.string().url().refine(
    (url) => url.startsWith('https://'),
    { message: 'RPC URL must use HTTPS' }
)
```
2. Consider certificate pinning for production RPCs
3. Use private/dedicated RPC endpoints instead of public ones

---

### MEDIUM SEVERITY

#### M-01: Process Lock Race Condition

**Location:** `src/utils/lock.ts:6-18`
**Status:** Should Fix

**Description:**
The file-based locking mechanism has a check-then-write race condition:

```typescript
export function acquireLock(): boolean {
    if (existsSync(LOCK_FILE)) {           // Check
        const lockTime = parseInt(readFileSync(LOCK_FILE, 'utf-8'), 10)
        if (Date.now() - lockTime < LOCK_TIMEOUT_MS) {
            return false
        }
    }
    writeFileSync(LOCK_FILE, Date.now().toString())  // Write (race gap!)
    return true
}
```

**Impact:** Two processes could both acquire the lock simultaneously.

**Recommendations:**
Use atomic file creation with exclusive flag:
```typescript
import { openSync, closeSync, constants } from 'fs';

export function acquireLock(): boolean {
    try {
        const fd = openSync(LOCK_FILE, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY);
        writeSync(fd, JSON.stringify({ pid: process.pid, time: Date.now() }));
        closeSync(fd);
        return true;
    } catch (e) {
        if (e.code === 'EEXIST') {
            // Check if existing lock is stale
            return handleStaleLock();
        }
        throw e;
    }
}
```

---

#### M-02: Sensitive Data in Logs

**Location:** `src/core/executor.ts:145-150`, `src/utils/logger.ts`
**Status:** Should Fix

**Description:**
Logs contain sensitive information that could be exploited:

```typescript
logger.info(`Executing releaseFunds`, {
    destChain: request.destChain,
    nonce: request.nonce,
    recipient: request.recipient,  // Full address logged
    amount: request.amount,        // Full amount logged
})

logger.info(`Executor initialized`, {
    address: this.account.address,  // Relayer address exposed
})
```

**Impact:**
- PII exposure (recipient addresses)
- Transaction pattern analysis by attackers
- Relayer address exposure enables targeted attacks

**Recommendations:**
1. Implement address redaction:
```typescript
function redactAddress(addr: string): string {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
```
2. Never log relayer's own address
3. Separate audit logs from operational logs
4. Encrypt log files at rest

---

#### M-03: Fixed Gas Limit Without Estimation

**Location:** `src/core/gas-manager.ts:47`
**Status:** Should Fix

**Description:**
A hardcoded gas limit is used for all transactions:

```typescript
return {
    gasPrice,
    gas: 200000n,  // Fixed for all transactions
}
```

**Impact:**
- Transactions may fail if they require more gas
- Overpayment when less gas is needed

**Recommendations:**
Use gas estimation:
```typescript
const estimatedGas = await publicClient.estimateContractGas({
    address: bridgeAddress,
    abi: TBridgeV2ABI,
    functionName: 'releaseFunds',
    args: [...],
    account: this.account,
});
const gasWithBuffer = (estimatedGas * 130n) / 100n; // 30% buffer
```

---

#### M-04: Weak Address Validation

**Location:** `src/config.ts:4`
**Status:** Should Fix

**Description:**
Address validation only checks format, not validity:

```typescript
const AddressSchema = z.string().startsWith('0x').length(42)
```

**Impact:** Invalid addresses (wrong checksum) could be configured.

**Recommendations:**
Add checksum validation:
```typescript
import { isAddress, getAddress } from 'viem';

const AddressSchema = z.string().refine(
    (addr) => isAddress(addr),
    { message: 'Invalid Ethereum address' }
).transform((addr) => getAddress(addr)); // Normalize to checksum
```

---

#### M-05: No Database Encryption

**Location:** `src/db/`
**Status:** Should Fix

**Description:**
The SQLite database stores transaction details in plaintext:
- Recipient addresses
- Transaction amounts
- Token addresses
- Error messages (may contain sensitive data)

**Impact:** Database file exposure reveals all historical transaction data.

**Recommendations:**
1. Use SQLCipher or `better-sqlite3` with encryption extension
2. Set restrictive file permissions (`600`)
3. Implement data retention policy with secure deletion
4. Consider encrypting sensitive columns

---

#### M-06: String-Based Error Classification

**Location:** `src/utils/retry.ts:19-31`
**Status:** Should Fix

**Description:**
Error handling relies on string matching:

```typescript
function isNonceAlreadyProcessedError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error)
    return message.includes('NonceAlreadyProcessed')
}
```

**Impact:**
- Fragile - contract error message changes break detection
- Could misclassify errors
- Missing handlers for rate limits, insufficient balance, etc.

**Recommendations:**
1. Use viem's structured error decoding:
```typescript
import { decodeErrorResult } from 'viem';

function classifyError(error: unknown): ErrorType {
    if (error instanceof ContractFunctionExecutionError) {
        const decoded = decodeErrorResult({
            abi: TBridgeV2ABI,
            data: error.data,
        });
        return decoded.errorName as ErrorType;
    }
    return 'UNKNOWN';
}
```

---

### LOW SEVERITY

#### L-01: No Log Rotation

**Location:** `src/utils/logger.ts:56-61`
**Status:** Recommended Fix

**Description:**
Logs append indefinitely to a single file:

```typescript
appendFileSync(LOG_FILE, formatted + '\n')
```

**Impact:** Disk space exhaustion over time.

**Recommendations:**
Use a logging library with rotation (winston, pino) or implement rotation logic.

---

#### L-02: No Health Check Endpoint

**Location:** N/A (missing)
**Status:** Recommended Addition

**Description:**
No mechanism exists to verify relayer health externally.

**Impact:** Difficult to monitor service health in production.

**Recommendations:**
Add HTTP health endpoint or implement external health signaling.

---

#### L-03: No Transaction Monitoring

**Location:** `src/core/executor.ts`
**Status:** Recommended Addition

**Description:**
Pending transactions are not tracked after submission. Stuck transactions could block the relayer.

**Recommendations:**
1. Store pending tx hash in database
2. Monitor for transactions stuck > X blocks
3. Implement transaction replacement (speed up or cancel)

---

### INFORMATIONAL

#### I-01: Missing Test Coverage

**Description:**
No test files were found in the repository. The `bun test` script is configured but no tests exist.

**Recommendations:**
Add comprehensive tests:
- Unit tests for config validation
- Integration tests with testnet
- Security tests (malformed inputs, concurrent execution)

---

#### I-02: Logs Directory Not in .gitignore

**Description:**
The `/logs/` directory may not be properly excluded from git, risking accidental commit of sensitive log data.

**Recommendations:**
Verify `.gitignore` includes:
```
/logs/
*.log
```

---

## Security Checklist

### Private Key Security

| Check | Status |
|-------|--------|
| Key stored in secrets manager | ❌ Missing |
| Key rotation mechanism | ❌ Missing |
| Key never logged | ⚠️ Address logged |
| Memory cleared after use | ❌ Held in memory |

### Input Validation

| Check | Status |
|-------|--------|
| Environment variables validated | ✅ Zod schemas |
| Address format validation | ⚠️ No checksum |
| Amount range validation | ❌ Missing |
| RPC URL security | ❌ HTTP allowed |

### Database Security

| Check | Status |
|-------|--------|
| SQL injection prevention | ✅ Prepared statements |
| Database encryption | ❌ Missing |
| File permissions | ⚠️ Not enforced |
| Backup mechanism | ❌ Missing |

### Transaction Safety

| Check | Status |
|-------|--------|
| Nonce tracking | ⚠️ Contract-side only |
| Atomic execution | ❌ Race condition |
| Gas estimation | ❌ Fixed limit |
| Transaction monitoring | ❌ Missing |

### Logging & Monitoring

| Check | Status |
|-------|--------|
| Sensitive data redaction | ❌ Full addresses logged |
| Log rotation | ❌ Missing |
| Health monitoring | ❌ Missing |
| Alerting system | ❌ Missing |

---

## Positive Security Practices

The codebase demonstrates several good security practices:

| Practice | Implementation |
|----------|----------------|
| TypeScript strict mode | ✅ Enabled |
| Runtime validation | ✅ Zod schemas |
| SQL injection prevention | ✅ Prepared statements |
| Retry with backoff | ✅ Exponential + jitter |
| Process locking | ✅ File-based (needs fix) |
| Dry-run mode | ✅ For testing |
| Idempotent operations | ✅ INSERT OR IGNORE |
| Block checkpointing | ✅ Resume from last block |

---

## Dependency Analysis

| Dependency | Version | Risk Level | Notes |
|------------|---------|------------|-------|
| viem | 2.25.0 | Medium | Transaction signing - keep updated |
| better-sqlite3 | 11.7.0 | Low | Native module - verify integrity |
| zod | 3.24.0 | Low | Validation only |

**Recommendations:**
1. Enable `npm audit` in CI/CD
2. Configure Dependabot for automatic updates
3. Pin exact versions in package.json
4. Regular security audits of transitive dependencies

---

## Recommendations Summary

### Critical Priority (Before Production)

1. **Implement secrets management** - Use AWS Secrets Manager, Vault, or similar
2. **Fix transaction execution race condition** - Add database-level locking
3. **Enforce HTTPS for RPC endpoints** - Add URL validation

### High Priority

4. **Validate RPC endpoints on startup** - Chain ID verification
5. **Fix process lock race condition** - Use atomic file operations
6. **Redact sensitive data from logs** - Address masking

### Medium Priority

7. **Implement gas estimation** - Replace fixed gas limit
8. **Add address checksum validation** - Use viem's `isAddress`
9. **Encrypt database** - Protect transaction history
10. **Improve error classification** - Use structured error decoding

### Low Priority

11. **Add log rotation** - Prevent disk exhaustion
12. **Implement health checks** - Production monitoring
13. **Add transaction monitoring** - Track pending transactions
14. **Write comprehensive tests** - Unit and integration tests

---

## Deployment Checklist

Before production deployment, verify:

- [ ] Private key stored in secrets manager (not `.env`)
- [ ] HTTPS-only RPC endpoints configured
- [ ] Database file permissions set to `600`
- [ ] Log directory excluded from version control
- [ ] Relayer wallet funded with sufficient gas
- [ ] Health monitoring configured
- [ ] Alerting for low balance, high failure rates
- [ ] Backup strategy for database
- [ ] Incident response playbook documented
- [ ] Rate limiting configured on RPC endpoints

---

## Conclusion

The TBridge-V2 Relayer has a solid architectural foundation with proper use of TypeScript, Zod validation, and SQL injection prevention. However, the critical issue of plaintext private key storage must be resolved before production deployment. The race condition in transaction execution and lack of RPC validation are also high-priority fixes.

**Key Strengths:**
- Clean TypeScript architecture
- Runtime validation with Zod
- Prepared statements prevent SQL injection
- Exponential backoff with jitter

**Critical Gaps:**
- Private key security
- Transaction atomicity
- RPC endpoint trust
- Logging hygiene

The relayer is suitable for testnet operation. Address critical and high-severity findings before mainnet deployment.

---

*End of Audit Report*
