# SUI Merge Coins
- Mainnet: https://sui-merge-coin.cosilabs.com/

A tool to help you merge coins when there are too many objects that cannot be transferred or swapped for other coins
- Building on [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) and [Vite](https://vitejs.dev/)
- Use packages [@mysten/sui](https://www.npmjs.com/package/@mysten/sui) and [@mysten/dapp-kit](https://www.npmjs.com/package/@mysten/dapp-kit)
- Some components of the user interface: [react-awesome-button](https://github.com/rcaferati/react-awesome-button) and [react-loading](https://github.com/fakiolinho/react-loading)

Currently the version that can be used directly on SUI Mainnet

## Some configurations
- Any changes will be made at `/src/main.tsx`
- Change the environment ('mainnet' | 'testnet' | 'devnet' | 'localnet') or custom RPC
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

## Dockerfile
- Create an extra Dockerfile to easily build and run
```shell
docker build -t [image_name] .
docker run -d --restart=unless-stopped -p 80:80/tcp --name [container_name] [image_name]
```
