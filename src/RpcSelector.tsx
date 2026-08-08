import { useState } from 'react'
import { RPC_PRESETS, RPC_STORAGE_KEY, getActiveRpcUrl } from './rpc'

// Lets the user pick a preset JSON-RPC endpoint or enter a custom one.
// The client is created once at module load, so switching reloads the page.
export function RpcSelector() {
  const [active] = useState(getActiveRpcUrl())
  const isPreset = RPC_PRESETS.some((p) => p.url === active)
  const [showCustom, setShowCustom] = useState(!isPreset)
  const [custom, setCustom] = useState(isPreset ? '' : active)

  const apply = (url: string) => {
    const trimmed = url.trim()
    if (trimmed && trimmed !== active) {
      localStorage.setItem(RPC_STORAGE_KEY, trimmed)
      window.location.reload()
    }
  }

  return (
    <div className="glass-card">
      <div className="card-label">
        RPC Node<span className="dot">●</span>
      </div>
      <div className="coin-grid">
        {RPC_PRESETS.map((preset) => (
          <button
            key={preset.url}
            onClick={() => apply(preset.url)}
            className={`chip${active === preset.url ? ' selected' : ''}`}
          >
            <span className="chip-symbol">{preset.name}</span>
            {active === preset.url && <span>✓</span>}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`chip${showCustom && !isPreset ? ' selected' : ''}`}
        >
          <span className="chip-symbol">Custom</span>
          {showCustom && !isPreset && <span>✓</span>}
        </button>
      </div>
      {showCustom && (
        <div className="rpc-input-row">
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="https://your-rpc-endpoint.example.com"
            className="rpc-input"
          />
          <button onClick={() => apply(custom)} className="btn btn-primary" style={{ padding: '9px 16px' }}>
            Apply
          </button>
        </div>
      )}
      <div className="rpc-current">Current: {active}</div>
    </div>
  )
}
