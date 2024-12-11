"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { DownloadButton } from "~~/components/game/DownloadButton";
import { UploadButton } from "~~/components/game/UploadButton";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";

interface Game {
  title: string;
  storageKey: string;
  price: bigint;
  publisher: string;
  isActive: boolean;
}

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { data: gameContract } = useScaffoldContract({
    contractName: "GameOwnership",
  });
  const { data: accessContract } = useScaffoldContract({
    contractName: "GameAccessControl",
  });

  // Example game for testing - in production you'd fetch this from the contract
  const testGame: Game = {
    title: "Test Game",
    storageKey: "",
    price: BigInt(0),
    publisher: connectedAddress || "",
    isActive: true,
  };

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5">
        <h1 className="text-center">
          <span className="block text-4xl font-bold">Game Vault</span>
        </h1>
        <div className="flex justify-center items-center space-x-2">
          <Address address={connectedAddress} />
        </div>

        <div className="mt-8 flex gap-4 justify-center">
          <UploadButton gameId={1} />
          <DownloadButton gameId={1} />
        </div>
      </div>
    </div>
  );
};

export default Home;
