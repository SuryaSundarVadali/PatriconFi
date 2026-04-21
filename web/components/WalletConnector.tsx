"use client";

import { useMemo, useState } from "react";
import { useAccount, useChainId, useConnect, useDisconnect, useReadContract, useSwitchChain } from "wagmi";
import { CONTRACTS, USDC_ABI } from "../lib/contracts";
import { arcChain } from "../lib/wallet";

function formatMicrousdc(value: bigint): string {
  const whole = value / 1_000_000n;
  const fraction = (value % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  const rendered = fraction ? `${whole.toString()}.${fraction}` : whole.toString();
  return Number(rendered).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

declare global {
  interface Window {
    circleW3s?: {
      open?: () => Promise<void>;
    };
  }
}

export function WalletConnector() {
  const e2eMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === "1";
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switchingChain } = useSwitchChain();
  const [circleStatus, setCircleStatus] = useState<string>("");
  const [testWalletConnected, setTestWalletConnected] = useState<boolean>(
    typeof window !== "undefined" && window.localStorage.getItem("patri_test_wallet_connected") === "1",
  );

  const onExpectedChain = chainId === arcChain.id;
  const usdcAddressReady = CONTRACTS.usdc !== "0x0000000000000000000000000000000000000000";

  const { data: usdcBalanceRaw, isLoading: loadingBalance } = useReadContract({
    address: CONTRACTS.usdc,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address) && usdcAddressReady,
      refetchInterval: 12_000,
    },
  });

  const formattedUsdcBalance = useMemo(() => {
    if (!usdcBalanceRaw) {
      return "0.000000";
    }
    return formatMicrousdc(usdcBalanceRaw);
  }, [usdcBalanceRaw]);

  const connectCircleWallet = async () => {
    setCircleStatus("");
    if (typeof window === "undefined" || !window.circleW3s?.open) {
      setCircleStatus("Circle user-controlled wallet SDK is not loaded in this build.");
      return;
    }

    try {
      await window.circleW3s.open();
      setCircleStatus("Circle wallet flow opened.");
    } catch {
      setCircleStatus("Circle wallet flow failed to open.");
    }
  };

  return (
    <section style={{ border: "1px solid #d7dce2", borderRadius: 12, padding: 16, background: "#f8fafc" }}>
      <h3 style={{ marginTop: 0 }}>Wallet</h3>
      <p style={{ marginTop: 0 }}>All transaction approvals are shown in your wallet and signed on your device.</p>

      {!isConnected && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              type="button"
              disabled={!connector.ready || isPending}
              onClick={() => connect({ connector })}
            >
              Connect {connector.name}
            </button>
          ))}
          <button type="button" onClick={connectCircleWallet}>
            Connect Circle Wallet (Optional)
          </button>
          {e2eMode && (
            <button
              data-testid="connect-test-wallet-btn"
              type="button"
              onClick={() => {
                window.localStorage.setItem("patri_test_wallet_connected", "1");
                setTestWalletConnected(true);
              }}
            >
              Connect Test Wallet
            </button>
          )}
        </div>
      )}

      {isConnected && (
        <div style={{ display: "grid", gap: 8 }}>
          <div>
            <strong>Connected account:</strong> {address}
          </div>
          <div>
            <strong>Network:</strong> {chainId}
            {!onExpectedChain && (
              <button
                type="button"
                disabled={switchingChain}
                style={{ marginLeft: 8 }}
                onClick={() => switchChain({ chainId: arcChain.id })}
              >
                Switch to {arcChain.name}
              </button>
            )}
          </div>
          <div>
            <strong>Arc USDC balance:</strong>{" "}
            {usdcAddressReady ? (loadingBalance ? "Loading..." : `${formattedUsdcBalance} USDC`) : "Set NEXT_PUBLIC_ARC_USDC_ADDRESS"}
          </div>
          <div>
            <button type="button" onClick={() => disconnect()}>
              Disconnect
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ color: "#b42318", marginBottom: 0 }}>{error.message}</p>}
      {circleStatus && <p style={{ marginBottom: 0 }}>{circleStatus}</p>}
      {!isConnected && testWalletConnected && <p>Test wallet session connected.</p>}
    </section>
  );
}
