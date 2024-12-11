"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useAccount } from "wagmi";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";

interface GameNFT {
  tokenId: number;
  storageKey: string;
}

export default function DownloadPage() {
  const { address } = useAccount();
  const [ownedGames, setOwnedGames] = useState<GameNFT[]>([]);
  const { data: gameContract } = useScaffoldContract({ contractName: "GameOwnership" });

  const loadOwnedGames = async () => {
    if (!gameContract || !address) return;
    try {
      const balance = await gameContract.read.balanceOf([address]);
      const games = [];
      for (let i = 0; i < balance; i++) {
        const tokenId = await gameContract.read.tokenOfOwnerByIndex([address, BigInt(i)]);
        const storageKey = await gameContract.read.getGameStorageKey([tokenId]);
        games.push({ tokenId: Number(tokenId), storageKey });
      }
      setOwnedGames(games);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load owned games");
    }
  };

  const handleDownload = async (storageKey: string) => {
    try {
      // Mock download - would integrate with 0g here
      toast.success(`Downloading game from storage key: ${storageKey}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to download game");
    }
  };

  useEffect(() => {
    loadOwnedGames();
  }, [address, gameContract]);

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-4xl font-bold">Your Games</h1>
      <div className="grid gap-4">
        {ownedGames.map(game => (
          <div key={game.tokenId} className="card bg-base-200 p-4">
            <h2>Game NFT #{game.tokenId}</h2>
            <p className="text-sm">Storage Key: {game.storageKey}</p>
            <button onClick={() => handleDownload(game.storageKey)} className="btn btn-primary mt-2">
              Download Game
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
