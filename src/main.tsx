import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';
import { ErrorBoundary } from './ErrorBoundary.tsx';

// Surface fatal errors on screen (in-app wallet browsers have no devtools).
function showFatalOverlay(text: string) {
	let el = document.getElementById('fatal-error-overlay');
	if (!el) {
		el = document.createElement('pre');
		el.id = 'fatal-error-overlay';
		el.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#1e1e1e;color:#ff6b6b;padding:16px;margin:0;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:12px;';
		document.body.appendChild(el);
	}
	el.textContent += text + '\n\n';
}
window.addEventListener('error', (e) => {
	showFatalOverlay(`window.onerror: ${e.message}\n${e.error?.stack ?? ''}`);
});
window.addEventListener('unhandledrejection', (e) => {
	const reason: unknown = e.reason;
	showFatalOverlay(`unhandledrejection: ${reason instanceof Error ? `${reason.name}: ${reason.message}\n${reason.stack ?? ''}` : String(reason)}`);
});

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
				<ErrorBoundary>
					<App />
				</ErrorBoundary>
			</WalletProvider>
		</SuiClientProvider>
	</QueryClientProvider>
  </React.StrictMode>,
)
