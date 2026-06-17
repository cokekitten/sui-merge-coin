import './App.css'
import 'react-awesome-button/dist/styles.css'
import { CoinInfo } from './CoinInfo'
import { AwesomeButton } from 'react-awesome-button'
import ReactLoading from 'react-loading'
import { useEffect, useState } from 'react'
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'

function App() {
  const account = useCurrentAccount()
  const [isLoading, setIsLoading] = useState(false);
  const [coinList, setCoinList] = useState<CoinInfo[]>([]);
  const [logs, setLogs] = useState<string>();
  const [isMerging, setIsMerging] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState('');
  const client = useSuiClient()
  const { mutate } = useSignAndExecuteTransaction();
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
        }
        setCoinList(updatedCoinList);
      } catch (error) {
        console.error('Error fetching coin list:', error);
      }
    }
    setIsLoading(false);
  }

  async function handleMergeClick() {
    if (account?.address == null) { alert('Error connecting to wallet, please reconnect'); return; }
    const tx = new Transaction();
    const coinObjectIds = [];
    let cursor = null;

    setIsMerging(true);
    setLogs('Start getting data...');
    do {
      const objectListResponse = await client.getCoins({
        owner: account.address,
        coinType: selectedCoin,
        cursor: cursor,
        limit: 100
      });

      const objectList = objectListResponse.data;
      coinObjectIds.push(...objectList.map(item => item.coinObjectId));

      if (objectListResponse.hasNextPage) { cursor = objectListResponse.nextCursor; } else { cursor = null; }
      if (coinObjectIds.length >= 500) { cursor = null; }
    } while (cursor);
    setLogs('Data collection done');

    if ((selectedCoin != '0x2::sui::SUI' && coinObjectIds.length >= 2) || (selectedCoin == '0x2::sui::SUI' && coinObjectIds.length >= 3)) {
      if (selectedCoin == '0x2::sui::SUI') { coinObjectIds.shift(); }

      const firstObjectId = coinObjectIds.shift();
      const remainingObjectIds = coinObjectIds.map(id => tx.object(id));

      if (firstObjectId != null && remainingObjectIds.length > 0) {
        tx.mergeCoins(tx.object(firstObjectId), remainingObjectIds);
        try {
          setLogs(`Total of ${coinObjectIds.length} objects found and ready to merge. Please confirm at wallet`);

          await mutate(
            {
              transaction: tx,
            },
            {
              onSuccess: (result) => {
                setLogs(`Finish merging objects, digest: ${result.digest}`);
              },
              onError: (error) => {
                setLogs(`${error}`);
                console.log(`Error when merging objects, ${error}`);
              }
            }
          );
        } catch (e) {
          setLogs(`${e}`);
          console.log(`Error when merging objects, ${e}`);
        }
      } else { setLogs('Errors: Data has changed, please try again'); }
    }
    else { setLogs('Errors: Data has changed, please try again'); }
    setIsMerging(false);
  }

  useEffect(() => {
    getAllBalances();
  }, [account]);

  return (
    <>
      <div>
        <a href={account?.address ? "https://suiexplorer.com/address/" + account?.address : "https://suiexplorer.com"}
          target="_blank">
          <img src="/assets/image/ProjectX-logo.png" className="logo sui" alt="Sui Explorer" />
        </a>
      </div>
      <h1>$SUI Merge Coins</h1>
      <div>
        <p>
          A tool to help you merge coins when there are too many objects that cannot be transferred or swapped for other coins
        </p>
        <p>
          When doing object merge will move the balance of objects into one, empty objects will be cleaned up and you will get the storage rebate <code className="code">($SUI)</code> from them
        </p>
        <code className="code">It's free and safe</code>
      </div>
      <div className="card">
        <ConnectButton />
        {!account?.address ? (
          <p style={{ color: 'red' }}>Please connect wallet first</p>
        ) : isLoading ? (
          <div className='box-loading'><ReactLoading color='#4CA2FF' type='bars' /></div>
        ) : (
          <p>
            Please select a <code>Coin</code> that you want to merge
          </p>
        )}
        <select
          value={selectedCoin}
          onChange={(e) => setSelectedCoin(e.target.value)}
          className='select-coin'
        >
          <option value="">Select a coin</option>
          {coinList.map((coin) => (
            <option key={coin.coinType} value={coin.coinType}>
              {`${coin.symbol} (${coin.name}): ${coin.humanBalance} (${coin.coinObjectCount} objects)`}
            </option>
          ))}
        </select>
        <AwesomeButton disabled={isMerging || isLoading} type="secondary" onPress={getAllBalances} className='reload-button'>Reload</AwesomeButton>
      </div>
      <div>
        {selectedCoin && (
          coinList.some(coin => coin.coinType === selectedCoin && coin.coinObjectCount <= 1) ? (
            <p style={{ color: 'green' }}>You don't need to merge this coin</p>
          ) : coinList.some(coin => coin.coinType === selectedCoin && coin.coinObjectCount < 3 && coin.coinType === '0x2::sui::SUI') ? (
            <p style={{ color: 'blue' }}>For $SUI you need to be more than 3 objects to be able to merge</p>
          ) : (
            <>
              <code className="code">Because of the limit of one transaction, up to 500 objects can be merged in one transaction</code><br />
              <AwesomeButton disabled={isMerging || isLoading} type="primary" onPress={handleMergeClick}>Merge</AwesomeButton>
            </>
          )
        )}
      </div>
      <div>
        <p>
          {logs && logs.includes('digest: ') ? (
            <>
              {logs.split('digest: ')[1] && (
                <a
                  href={`https://suiexplorer.com/txblock/${logs.split('digest: ')[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {logs + '(Click to view)'}
                </a>
              )}
            </>
          ) : (
            logs
          )}
        </p>
      </div>
      <div>
        You can find the code on <a href="https://github.com/cosinguyen/sui-merge-coin" target="_blank">
          Github
        </a>
      </div>
    </>
  )
}

export default App
