import {useAccount, useConnect, useDisconnect, useContractRead, useSignMessage} from "wagmi";
import {PIXEL_ABI} from "./abi.ts";

function App() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: signMessageData, signMessage } = useSignMessage()

  const balance = useContractRead({
    abi: PIXEL_ABI,
    address: '0x7B3D7cfEe6BD2B3042B8F04D90b137D9Ed06Ea74',
    functionName: 'balanceOf',
    account: account.address,
    args: [account.address],
    query: { enabled: !!account.address },
  });

  return (
    <>
      <div>
        <h2>Account</h2>

        <div>
          status: {account.status}
          <br />
          address: {account.address}
          <br />
          chainId: {account.chainId}
          <br/>
          balance: {balance.data ? (Number(balance.data) / 10 ** 18).toFixed(2) : 0}
          <br/>
          signed: {signMessageData ? signMessageData : '-'}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          {account.status === "connected" && (
              <button type="button" onClick={() => signMessage({ message: 'hello pixel' })}>
                sign
              </button>
          )}

          {account.status === "connected" && (
              <button type="button" onClick={() => disconnect()}>
                Disconnect
              </button>
          )}
        </div>
      </div>

      {account.status !== 'connected' && <div>
        <h2>Connect</h2>
        {connectors.map((connector) => (
            <button key={connector.uid} onClick={() => connect({connector})} type="button">
              {connector.name}
            </button>
        ))}
        <div>{status}</div>
        <div>{error?.message}</div>
      </div>}
    </>
  );
}

export default App;
