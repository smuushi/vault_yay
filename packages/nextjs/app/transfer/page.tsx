"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function TransferPage() {
  const { address } = useAccount();
  const [toAddress, setToAddress] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [ownedTokens, setOwnedTokens] = useState<number[]>([]);
  const { data: gameContract } = useScaffoldContract({ contractName: "GameOwnership" });
  const { writeContractAsync: transferNFT } = useScaffoldWriteContract("GameOwnership");
  const [isLoading, setIsLoading] = useState(false);

  const loadOwnedTokens = async () => {
    if (isLoading || !gameContract || !address) return;

    try {
      setIsLoading(true);
      const balance = await gameContract.read.balanceOf([address]);
      const tokens = [];
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await gameContract.read.tokenOfOwnerByIndex([address, BigInt(i)]);
        tokens.push(Number(tokenId));
      }
      setOwnedTokens(tokens);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load owned tokens");
    } finally {
      setIsLoading(false);
    }
  };

  // Load once when component mounts
  useEffect(() => {
    loadOwnedTokens();
  }, [address]); // Only reload when these change

  const handleTransfer = async () => {
    if (!address || !selectedTokenId || !toAddress) return;

    try {
      const tx = await transferNFT({
        functionName: "transferFrom",
        args: [address, toAddress, BigInt(selectedTokenId)],
      });
      toast.success("NFT transferred successfully!");
      loadOwnedTokens();
    } catch (error) {
      console.error(error);
      toast.error("Failed to transfer NFT");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-4xl font-bold">Transfer Game NFT</h1>
      <div className="flex flex-col gap-4">
        <select onChange={e => setSelectedTokenId(Number(e.target.value))} className="select">
          <option value="">Select a token</option>
          {ownedTokens.map(tokenId => (
            <option key={tokenId} value={tokenId}>
              Token #{tokenId}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Recipient address"
          onChange={e => setToAddress(e.target.value)}
          className="input"
        />
        <button onClick={handleTransfer} className="btn btn-primary" disabled={!selectedTokenId || !toAddress}>
          Transfer NFT
        </button>
      </div>
    </div>
  );
}
