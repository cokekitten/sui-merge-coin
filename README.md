# SUI Merge Coins
- Mainnet: https://sui-merge-coin.drmo.workers.dev

A tool to help you merge coins when there are too many objects that cannot be transferred or swapped for other coins
- Building on [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) and [Vite](https://vitejs.dev/)
- Use packages [@mysten/sui](https://www.npmjs.com/package/@mysten/sui) (v2.x) and [@mysten/dapp-kit](https://www.npmjs.com/package/@mysten/dapp-kit) (v1.x)

Features:
- Flat coin picker with balances and object counts (no dropdown hunting)
- **Auto Merge**: batches of up to 500 objects signed one after another until everything is merged
- RPC endpoint switchable on the page (presets + custom, saved to localStorage)
- On-screen error reporting so failures never show a blank page

Currently the version that can be used directly on SUI Mainnet

## Why this fork
The upstream project ([cosinguyen/sui-merge-coin](https://github.com/cosinguyen/sui-merge-coin), now archived) stopped working after a Sui network upgrade: Sui Foundation fullnodes [deprecated JSON-RPC](https://docs.sui.io/develop/accessing-data/json-rpc-migration) (disabled on mainnet in July 2026), while the app relied on the official public JSON-RPC endpoints via `@mysten/sui` v1. Every balance query failed, so nothing could be merged.

This fork fixes that:
- Chain reads/writes go through a third-party JSON-RPC provider (default `https://mainnet.sui.rpcpool.com/`, configurable via `VITE_SUI_RPC_URL`)
- Dependencies upgraded to `@mysten/sui` v2.x and `@mysten/dapp-kit` v1.x
- Deployment moved to Cloudflare Workers static assets (`wrangler.jsonc`)

## RPC configuration
- Any changes will be made at `/src/main.tsx` and `/src/rpc.ts`
- The RPC endpoint can be changed directly on the page (stored in `localStorage`), or via the `VITE_SUI_RPC_URL` env var at build time (see `.env.example`). Default: `https://mainnet.sui.rpcpool.com/`
- Change the environment or custom RPC:
```js
<SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
```
- Number of objects that want to get each time querying to the network. Currently, if you enter greater than 50, the network still only returns no more than 50 objects for a query, but it must be limited to avoid the case that the network will return more than 50 later, it will be out of control.
```js
const objectListResponse = await client.getCoins({
   owner: account.address,
   coinType: selectedCoin,
   cursor: cursor,
   limit: 100
});
```
- Change the number of concurrently mergeable objects in a transaction, must be divisible by 100 or the limit number changed above
```js
if (coinObjectIds.length >= 500) { cursor = null; }
```
- Let's discover the rest

## Deploy to Cloudflare Workers
The app is a pure static SPA (signing happens in the browser wallet), so it can be hosted with Workers Static Assets:
```shell
pnpm install
pnpm run deploy   # builds and runs wrangler deploy
```
Configuration lives in `wrangler.jsonc`. Requires `wrangler login` once.

## Dockerfile
- Create an extra Dockerfile to easily build and run
```shell
docker build -t [image_name] .
docker run -d --restart=unless-stopped -p 80:80/tcp --name [container_name] [image_name]
```
