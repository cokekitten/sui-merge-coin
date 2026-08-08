// RPC endpoint selection. Priority: localStorage (user-picked on the page)
// > VITE_SUI_RPC_URL (build-time default) > first preset.
export const RPC_PRESETS = [
  { name: 'rpcpool', url: 'https://mainnet.sui.rpcpool.com/' },
  { name: 'PublicNode', url: 'https://sui-rpc.publicnode.com' },
  { name: 'BlockVision', url: 'https://sui-mainnet-endpoint.blockvision.org' },
] as const

export const RPC_STORAGE_KEY = 'sui-rpc-url'

export function getActiveRpcUrl(): string {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(RPC_STORAGE_KEY) : null
  return stored || import.meta.env.VITE_SUI_RPC_URL || RPC_PRESETS[0].url
}
