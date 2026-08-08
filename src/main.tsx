import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';

// NOTE (2026-08): Sui Foundation fullnodes no longer serve JSON-RPC
// (deprecated week of 2026-07-27, code removal planned mid-October 2026).
// The app must point at a third-party JSON-RPC provider instead.
// Override with the VITE_SUI_RPC_URL env var (see .env.example).
const mainnetRpcUrl: string =
	import.meta.env.VITE_SUI_RPC_URL || 'https://mainnet.sui.rpcpool.com/';

const { networkConfig } = createNetworkConfig({
	mainnet: { url: mainnetRpcUrl, network: 'mainnet' },
});
const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
		<SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
			<WalletProvider autoConnect={true}>
				<App />
			</WalletProvider>
		</SuiClientProvider>
	</QueryClientProvider>
  </React.StrictMode>,
)
