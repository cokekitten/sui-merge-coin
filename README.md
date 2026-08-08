# SUI Merge Coins
- Mainnet: https://sui-merge-coin.drmo.workers.dev

A tool to help you merge coins when there are too many objects that cannot be transferred or swapped for other coins
- Building on [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) and [Vite](https://vitejs.dev/)
- Use packages [@mysten/sui](https://www.npmjs.com/package/@mysten/sui) (v2.x) and [@mysten/dapp-kit](https://www.npmjs.com/package/@mysten/dapp-kit) (v1.x)
- Some components of the user interface: [react-awesome-button](https://github.com/rcaferati/react-awesome-button) and [react-loading](https://github.com/fakiolinho/react-loading)

Currently the version that can be used directly on SUI Mainnet

## RPC configuration
- Any changes will be made at `/src/main.tsx`
- Sui Foundation fullnodes [deprecated JSON-RPC](https://docs.sui.io/develop/accessing-data/json-rpc-migration) in July 2026, so this app talks to a third-party JSON-RPC provider instead (default: `https://mainnet.sui.rpcpool.com/`). Set your own endpoint via the `VITE_SUI_RPC_URL` env var (see `.env.example`) — no code change needed.
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
