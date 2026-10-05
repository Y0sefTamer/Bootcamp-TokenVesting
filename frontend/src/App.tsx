import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { sepolia } from 'wagmi/chains'
import addresses from './addresses.json'
import vestingAbi from './abis/TokenVesting.json'
import tokenAbi from './abis/MockERC20.json'

const VESTING_ADDRESS = addresses.vesting as `0x${string}`
const TOKEN_ADDRESS = addresses.token as `0x${string}`
const MONTH_SECONDS = 30 * 24 * 60 * 60
const INTERVAL_SECONDS = 90 * 24 * 60 * 60

function formatAmount(amount: bigint, decimals: number) {
  try {
    return Number(formatUnits(amount, decimals)).toLocaleString()
  } catch {
    return amount.toString()
  }
}

function App() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const [now, setNow] = useState(Math.floor(Date.now() / 1000))

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(interval)
  }, [])

  const { data: decimals = 18 } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi.abi,
    functionName: 'decimals',
  }) as { data: number }

  const { data: beneficiary } = useReadContract({
    address: VESTING_ADDRESS,
    abi: vestingAbi.abi,
    functionName: 'beneficiary',
  }) as { data: `0x${string}` }

  const { data: start } = useReadContract({
    address: VESTING_ADDRESS,
    abi: vestingAbi.abi,
    functionName: 'start',
  }) as { data: bigint }

  const { data: cliff } = useReadContract({
    address: VESTING_ADDRESS,
    abi: vestingAbi.abi,
    functionName: 'cliff',
  }) as { data: bigint }

  const { data: duration } = useReadContract({
    address: VESTING_ADDRESS,
    abi: vestingAbi.abi,
    functionName: 'duration',
  }) as { data: bigint }

  const { data: interval } = useReadContract({
    address: VESTING_ADDRESS,
    abi: vestingAbi.abi,
    functionName: 'interval',
  }) as { data: bigint }

  const { data: released } = useReadContract({
    address: VESTING_ADDRESS,
    abi: vestingAbi.abi,
    functionName: 'released',
  }) as { data: bigint }

  const { data: totalAmount } = useReadContract({
    address: VESTING_ADDRESS,
    abi: vestingAbi.abi,
    functionName: 'totalAmount',
  }) as { data: bigint }

  const { data: vestedAmount } = useReadContract({
    address: VESTING_ADDRESS,
    abi: vestingAbi.abi,
    functionName: 'vestedAmount',
  }) as { data: bigint }

  const { data: releasableAmount } = useReadContract({
    address: VESTING_ADDRESS,
    abi: vestingAbi.abi,
    functionName: 'releasableAmount',
  }) as { data: bigint }

  const { data: tokenBalance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi.abi,
    functionName: 'balanceOf',
    args: [VESTING_ADDRESS],
  }) as { data: bigint }

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  const startNum = Number(start || 0n)
  const cliffNum = Number(cliff || 0n)
  const durationNum = Number(duration || 0n)
  const totalNum = totalAmount || 0n
  const vestedNum = vestedAmount || 0n
  const releasedNum = released || 0n
  const releasableNum = releasableAmount || 0n
  const balanceNum = tokenBalance || 0n

  const isCliffPassed = now >= cliffNum
  const isFullyVested = now >= startNum + durationNum
  const progress = totalNum > 0n ? Number((vestedNum * 10000n) / totalNum) / 100 : 0
  const secondsToCliff = cliffNum > now ? cliffNum - now : 0
  const secondsToEnd = (startNum + durationNum) > now ? (startNum + durationNum) - now : 0

  const isBeneficiary = address && beneficiary && address.toLowerCase() === beneficiary.toLowerCase()
  const canRelease = isConnected && isBeneficiary && isCliffPassed && releasableNum > 0n

  const handleRelease = () => {
    writeContract({
      address: VESTING_ADDRESS,
      abi: vestingAbi.abi,
      functionName: 'release',
    })
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>Token Vesting Dashboard</h1>

      <div style={{ marginBottom: 20, padding: 10, background: '#f5f5f5', borderRadius: 8 }}>
        <div><strong>Connected:</strong> {isConnected ? address : 'Not connected'}</div>
        <div><strong>Chain:</strong> {isConnected ? `Sepolia (${chainId})` : '-'}</div>
        <div style={{ marginTop: 8 }}>
          {isConnected ? (
            <button onClick={() => disconnect()}>Disconnect</button>
          ) : (
            connectors.map((connector) => (
              <button key={connector.uid} onClick={() => connect({ connector })} style={{ marginRight: 8 }}>
                Connect {connector.name}
              </button>
            ))
          )}
        </div>
        {isConnected && chainId !== sepolia.id && (
          <div style={{ color: 'red', marginTop: 8 }}>Please switch to Sepolia</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}>
          <div><strong>Beneficiary</strong></div>
          <div style={{ fontSize: 14 }}>{beneficiary}</div>
          <div style={{ marginTop: 4, fontSize: 14 }}>Is you? {isBeneficiary ? 'Yes' : 'No'}</div>
        </div>
        <div style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}>
          <div><strong>Contracts</strong></div>
          <div style={{ fontSize: 14 }}>Token: {TOKEN_ADDRESS}</div>
          <div style={{ fontSize: 14 }}>Vesting: {VESTING_ADDRESS}</div>
          <div style={{ fontSize: 14 }}>Interval: {Number(interval || INTERVAL_SECONDS)}s ({Number(interval || INTERVAL_SECONDS)/(24*3600)} days)</div>
        </div>
      </div>

      <div style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8, marginBottom: 20 }}>
        <div><strong>Timing</strong></div>
        <div>Start: {startNum} ({new Date(startNum*1000).toLocaleString()})</div>
        <div>Cliff: {cliffNum} ({new Date(cliffNum*1000).toLocaleString()})</div>
        <div>End: {startNum + durationNum} ({new Date((startNum+durationNum)*1000).toLocaleString()})</div>
        <div>Cliff passed: {isCliffPassed ? 'Yes' : 'No'} {secondsToCliff > 0 && !isCliffPassed ? `(${Math.floor(secondsToCliff/86400)}d left)` : ''}</div>
        <div>Fully vested: {isFullyVested ? 'Yes' : 'No'} {secondsToEnd > 0 && !isFullyVested ? `(${Math.floor(secondsToEnd/86400)}d left)` : ''}</div>
      </div>

      <div style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8, marginBottom: 20 }}>
        <div><strong>Vesting Amounts</strong></div>
        <div>Total: {formatAmount(totalNum, decimals)} MTK</div>
        <div>Vested: {formatAmount(vestedNum, decimals)} MTK ({progress}%)</div>
        <div>Released: {formatAmount(releasedNum, decimals)} MTK</div>
        <div>Releasable: {formatAmount(releasableNum, decimals)} MTK</div>
        <div>Vesting contract balance: {formatAmount(balanceNum, decimals)} MTK</div>
        <div style={{ marginTop: 10 }}>
          <progress value={progress} max={100} style={{ width: '100%' }} />
        </div>
      </div>

      <div style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}>
        <div><strong>Actions</strong></div>
        <button onClick={handleRelease} disabled={!canRelease || isPending || isConfirming}>
          {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Release Tokens'}
        </button>
        {isConfirmed && <div style={{ color: 'green', marginTop: 8 }}>Release successful!</div>}
        {!isCliffPassed && <div style={{ color: 'orange', marginTop: 8 }}>Cliff not reached yet</div>}
        {isCliffPassed && releasableNum === 0n && <div style={{ color: 'gray', marginTop: 8 }}>No tokens to release yet</div>}
      </div>
    </div>
  )
}

export default App
