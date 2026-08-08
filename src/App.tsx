import './App.css'
import { CoinInfo } from './CoinInfo'
import { Spinner } from './Spinner'
import { RpcSelector } from './RpcSelector'
import { useEffect, useState } from 'react'
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'

const SUI_COIN_TYPE = '0x2::sui::SUI'
const MAX_OBJECTS_PER_TX = 500

function App() {
  const account = useCurrentAccount()
  const [isLoading, setIsLoading] = useState(false);
  const [coinList, setCoinList] = useState<CoinInfo[]>([]);
  const [logs, setLogs] = useState<string>();
  const [isMerging, setIsMerging] = useState(false);
  const [isAutoMerging, setIsAutoMerging] = useState(false);
  const [batchCount, setBatchCount] = useState(0);
  const [selectedCoin, setSelectedCoin] = useState('');
  const client = useSuiClient()
  const { mutateAsync } = useSignAndExecuteTransaction();

  async function getAllBalances() {
    setIsLoading(true);
    setCoinList([]);
    setSelectedCoin('');
    setLogs('');
    if (account?.address != null) {
      const updatedCoinList: CoinInfo[] = [];
      try {
        const allBalances = await client.getAllBalances({ owner: account.address });

        for (const coin of allBalances) {
          try {
            const coinMetadata = await client.getCoinMetadata({ coinType: coin.coinType });

            if (coinMetadata != null) {
              const humanBalance = parseFloat(coin.totalBalance) / Math.pow(10, coinMetadata.decimals);

              const coinInfo: CoinInfo = {
                symbol: coinMetadata.symbol,
                coinObjectCount: coin.coinObjectCount,
                coinType: coin.coinType,
                name: coinMetadata.name,
                humanBalance: humanBalance
              };

              updatedCoinList.push(coinInfo);
            }
          } catch (metadataError) {
            console.warn(`Failed to load metadata for ${coin.coinType}:`, metadataError);
          }
        }
        setCoinList(updatedCoinList);
        if (updatedCoinList.length === 0) {
          setLogs('No tokens found or unable to load token data. Please try again.');
        }
      } catch (error) {
        console.error('Error fetching coin list:', error);
        setLogs(`Failed to load tokens: ${error instanceof Error ? error.message : 'Network error. Please check your connection and try again.'}`);
      }
    }
    setIsLoading(false);
  }

  // Collect up to MAX_OBJECTS_PER_TX coin object ids of the selected type.
  async function collectCoinObjectIds(): Promise<string[]> {
    const ids: string[] = [];
    let cursor: string | null = null;
    do {
      const response = await client.getCoins({
        owner: account!.address,
        coinType: selectedCoin,
        cursor: cursor,
        limit: 100
      });
      ids.push(...response.data.map(item => item.coinObjectId));
      cursor = response.hasNextPage ? (response.nextCursor ?? null) : null;
      if (ids.length >= MAX_OBJECTS_PER_TX) { cursor = null; }
    } while (cursor);
    return ids;
  }

  // Build one merge transaction from a fresh id list.
  // Returns null when there are not enough objects to merge.
  function buildMergeTx(coinObjectIds: string[]): Transaction | null {
    const enough = selectedCoin !== SUI_COIN_TYPE ? coinObjectIds.length >= 2 : coinObjectIds.length >= 3;
    if (!enough) { return null; }
    if (selectedCoin === SUI_COIN_TYPE) { coinObjectIds.shift(); } // keep one coin available for gas

    const tx = new Transaction();
    const firstObjectId = coinObjectIds.shift();
    const remainingObjectIds = coinObjectIds.map(id => tx.object(id));
    if (firstObjectId == null || remainingObjectIds.length === 0) { return null; }
    tx.mergeCoins(tx.object(firstObjectId), remainingObjectIds);
    return tx;
  }

  function requireWallet(): boolean {
    if (!account) { alert('Please connect wallet first'); return false; }
    if (account.address == null) { alert('Error connecting to wallet, please reconnect'); return false; }
    return true;
  }

  async function handleMergeClick() {
    if (!requireWallet()) { return; }
    setIsMerging(true);
    try {
      setLogs('Start getting data...');
      const coinObjectIds = await collectCoinObjectIds();
      setLogs('Data collection done');
      const tx = buildMergeTx(coinObjectIds);
      if (tx == null) { setLogs('Errors: Data has changed, please try again'); return; }
      setLogs(`Total of ${coinObjectIds.length + 1} objects found and ready to merge. Please confirm at wallet`);
      const result = await mutateAsync({ transaction: tx });
      setLogs(`Finish merging objects, digest: ${result.digest}`);
    } catch (e) {
      setLogs(`${e}`);
      console.log(`Error when merging objects, ${e}`);
    } finally {
      setIsMerging(false);
    }
  }

  // Merge repeatedly until fewer than one batch of objects remains.
  async function handleAutoMergeClick() {
    if (!requireWallet()) { return; }
    setIsAutoMerging(true);
    setBatchCount(0);
    let batch = 0;
    let running = true;
    while (running) {
      setLogs(`Auto merging... batch ${batch + 1}`);
      try {
        const coinObjectIds = await collectCoinObjectIds();
        const tx = buildMergeTx(coinObjectIds);
        if (tx == null) {
          setLogs(`Auto merge complete! Total batches merged: ${batch}`);
          running = false;
          break;
        }
        setLogs(`Batch ${batch + 1}: Merging objects... Please confirm at wallet`);
        const result = await mutateAsync({ transaction: tx });
        batch++;
        setBatchCount(batch);
        setLogs(`Batch ${batch} complete! Digest: ${result.digest}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        setLogs(`Merge stopped due to error: ${e}`);
        console.log(`Error when auto merging objects, ${e}`);
        running = false;
      }
    }
    setIsAutoMerging(false);
    await getAllBalances();
  }

  useEffect(() => {
    getAllBalances();
  }, [account]);

  const busy = isMerging || isAutoMerging || isLoading;
  const isErrorLog = logs != null && /failed|error/i.test(logs);
  const digest = logs?.includes('digest: ') ? logs.split('digest: ')[1] : null;

  return (
    <div className="app">
      <header className="app-header">
        <a className="brand" style={{ textDecoration: 'none' }}
          href={account?.address ? "https://suiscan.xyz/mainnet/address/" + account?.address : "https://suiscan.xyz/mainnet"}
          target="_blank">
          <div className="brand-mark">◆</div>
          <div>
            <h1 className="brand-title">$SUI Merge Coins</h1>
            <p className="brand-sub">合并碎片 Coin 对象 · 回收存储 rebate</p>
          </div>
        </a>
        <ConnectButton />
      </header>

      <p className="intro">
        A tool to help you merge coins when there are too many objects that cannot be transferred or swapped.
        Merging moves balances into one object; empty objects are cleaned up and you get the storage rebate
        {' '}<code>$SUI</code> back. <code>It's free and safe</code>
      </p>

      <div className="glass-card">
        {!account?.address ? (
          <p className="hint warn">Please connect wallet first</p>
        ) : isLoading ? (
          <div className='box-loading'><Spinner /></div>
        ) : coinList.length === 0 ? (
          <p className="hint">No tokens found</p>
        ) : (
          <>
            <div className="card-label" style={{ justifyContent: 'space-between' }}>
              <span>选择币种{selectedCoin && <span className="dot"> ●</span>}</span>
              <button disabled={busy} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={getAllBalances}>
                ⟳ Reload
              </button>
            </div>
            <div className="coin-grid">
              {coinList.map((coin) => {
                const isSelected = selectedCoin === coin.coinType;
                return (
                  <button
                    key={coin.coinType}
                    onClick={() => setSelectedCoin(coin.coinType)}
                    disabled={busy}
                    className={`chip${isSelected ? ' selected' : ''}`}
                  >
                    <span className="chip-symbol">{coin.symbol}</span>
                    <span className="chip-balance">{coin.humanBalance.toFixed(4)}</span>
                    {coin.coinObjectCount > 1 && (
                      <span className="chip-count">{coin.coinObjectCount}</span>
                    )}
                    {isSelected && <span>✓</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {selectedCoin && (
        <div className="glass-card">
          {coinList.some(coin => coin.coinType === selectedCoin && coin.coinObjectCount <= 1) ? (
            <p className="hint ok">You don't need to merge this coin</p>
          ) : coinList.some(coin => coin.coinType === selectedCoin && coin.coinObjectCount < 3 && coin.coinType === SUI_COIN_TYPE) ? (
            <p className="hint info">For $SUI you need to be more than 3 objects to be able to merge</p>
          ) : (
            <>
              <p className="hint" style={{ color: 'var(--text-dim)', marginBottom: '14px' }}>
                Up to 500 objects can be merged in one transaction
              </p>
              <div className="btn-row">
                <button disabled={busy} className="btn btn-primary" onClick={handleMergeClick}>
                  Merge
                </button>
                <button disabled={busy} className="btn btn-primary" onClick={handleAutoMergeClick}>
                  {isAutoMerging ? `Auto: ${batchCount} batches` : 'Auto Merge'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {logs && (
        <div className="glass-card">
          <p className={`log-line${isErrorLog ? ' error' : ''}`}>
            {digest ? (
              <a href={`https://suiscan.xyz/mainnet/tx/${digest}`} target="_blank" rel="noopener noreferrer">
                {logs + ' (view on suiscan ↗)'}
              </a>
            ) : (
              logs
            )}
          </p>
        </div>
      )}

      <RpcSelector />

      <footer className="app-footer">
        <a href="https://github.com/cokekitten/sui-merge-coin" target="_blank">GitHub</a>
        {' · '}
        <a href="https://suiscan.xyz/mainnet" target="_blank">Suiscan</a>
      </footer>
    </div>
  )
}

export default App
