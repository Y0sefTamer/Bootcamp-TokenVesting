# Bootcamp TokenVesting

A simple ERC20 token vesting smart contract written in Solidity for a bootcamp assignment. This is an educational exercise and **not production-level** code.

## Overview

`TokenVesting` allows a fixed amount of ERC20 tokens to vest to a beneficiary over a specified duration with a cliff period. Vesting is calculated in discrete 90-day (3-month) intervals rather than continuously per second.

## Contract Details

- **Language**: Solidity `^0.8.20`
- **Framework**: [Foundry](https://book.getfoundry.sh/)
- **Token Standard**: ERC20 (uses minimal `transfer` interface)
- **Vesting Model**: Interval-based (90-day chunks). Tokens vest at the end of each completed 3-month interval relative to the start time.

### State Variables

| Variable | Type | Description |
|---|---|---|
| `token` | `IERC20` | ERC20 token being vested |
| `beneficiary` | `address` | Address that receives vested tokens |
| `start` | `uint256` | Vesting start timestamp (Unix time) |
| `cliff` | `uint256` | Timestamp when vesting begins (cliff ends) |
| `duration` | `uint256` | Total vesting duration in seconds |
| `interval` | `uint256` | Vesting interval in seconds (`90 days`) |
| `released` | `uint256` | Total tokens already released to the beneficiary |
| `totalAmount` | `uint256` | Total tokens to be vested over the full duration |

### Constructor

```solidity
constructor(
    address _token,
    address _beneficiary,
    uint256 _start,
    uint256 _cliffDurationInMonths,
    uint256 _totalVestingDurationInMonths,
    uint256 _amount
)
```

| Parameter | Description |
|---|---|
| `_token` | Address of the ERC20 token to vest |
| `_beneficiary` | Address that will receive vested tokens |
| `_start` | Vesting start timestamp (e.g., `block.timestamp` or a future time) |
| `_cliffDurationInMonths` | Cliff duration in months |
| `_totalVestingDurationInMonths` | Total vesting duration in months |
| `_amount` | Total amount of tokens to vest |

**Notes on time conversion:**
- Months are converted using `30 days` per month (a bootcamp simplification, not calendar-accurate).
- `cliff = _start + (_cliffDurationInMonths * 30 days)`
- `duration = _totalVestingDurationInMonths * 30 days`
- `interval = 90 days` (fixed)

### Functions

| Function | Type | Description |
|---|---|---|
| `release()` | External | Transfers all currently releasable (vested but unreleased) tokens to the beneficiary. Reverts if the cliff has not been reached or if there are no tokens to release. |
| `releasableAmount()` | Public View | Returns `vestedAmount() - released`. |
| `vestedAmount()` | Public View | Calculates the total amount vested so far: returns `0` if `block.timestamp < cliff`; returns `totalAmount` if fully vested (`block.timestamp >= start + duration`); otherwise computes vested based on completed 90-day intervals: `totalAmount * (elapsedTime / interval) / (duration / interval)` (integer division). |

## Vesting Logic Example

With 12 months total duration and 3-month intervals:
- `totalIntervals = 4` (90 days each)
- After 6 months elapsed (`elapsedTime >= 180 days`): `vestedIntervals = 2` → `vested = totalAmount * 2 / 4 = 50%`
- After 9 months: `vestedIntervals = 3` → 75%
- After 12+ months: 100%

Because vesting is computed in completed intervals (integer division), tokens unlock in chunks at each interval boundary rather than linearly between intervals.

## Project Structure

```
├── src/
│   └── TokenVesting.sol
├── script/        # (empty)
├── test/          # (empty)
├── lib/
│   └── forge-std/  # Foundry standard library
├── foundry.toml
├── foundry.lock
└── README.md
```

## Getting Started

### Prerequisites

Install [Foundry](https://book.getfoundry.sh/getting-started/installation).

### Build

```bash
forge build
```

### Test

```bash
forge test
```

### Format

```bash
forge fmt
```

### Clean

```bash
forge clean
```

## Usage Notes (Bootcamp / Non-Production)

- **Time approximation**: Uses `30 days/month` instead of calendar months.
- **Interval-based vesting**: Due to truncation in `elapsedTime / interval`, vesting is stepwise (90-day chunks), not continuous.
- **Minimal ERC20 interface**: Only `transfer` is used; no `transferFrom`, allowances, or `balanceOf` checks beyond what `transfer` enforces.
- **No events**: No `TokensReleased` or other events are emitted.
- **No access control**: Anyone can call `release()` once tokens are releasable; tokens go to the fixed `beneficiary`.
- **Token custody**: The contract must hold sufficient unvested ERC20 tokens for releases to succeed (this contract does not handle deposits/withdrawals of excess).
- **Simplified for learning**: No revocation, no pause, no reentrancy guard, and no safe transfer handling. Use only for educational/bootcamp purposes.

## Disclaimer

This project is built for bootcamp learning and exercises. It is **not audited, not secure, and not intended for production use**.
