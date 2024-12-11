"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function UploadPage() {
  const { address } = useAccount();
  const [file, setFile] = useState<File | null>(null);
  const { writeContractAsync: mintGame } = useScaffoldWriteContract("GameOwnership");

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFile(file);
  };

  const handleMint = async () => {
    if (!file || !address) return;
    try {
      const mockStorageKey = ethers.hexlify(ethers.randomBytes(32)) as `0x${string}`;
      const tx = await mintGame({
        functionName: "mintGame",
        args: [address, mockStorageKey],
      });
      toast.success("Game NFT minted!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to mint game NFT");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-4xl font-bold">Upload Game</h1>
      <div className="flex flex-col gap-4">
        <input type="file" onChange={handleUpload} className="file-input" />
        {file && (
          <div>
            <p>Selected file: {file.name}</p>
            <button onClick={handleMint} className="btn btn-primary mt-2">
              Mint Game NFT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
