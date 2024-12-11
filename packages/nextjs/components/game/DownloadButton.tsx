import React from "react";
import { Button } from "@chakra-ui/react";
import { toast } from "react-hot-toast";
import { useAccount } from "wagmi";
import { GameAccessService } from "~~/services/GameAccessService";

const DownloadButton = ({ gameId }: { gameId: number }) => {
  const { address } = useAccount();
  const gameService = new GameAccessService();

  const handleDownload = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      const encryptedHash = await gameService.getEncryptedHash(gameId);
      const ipfsHash = await gameService.getDecryptedIpfsHash(gameId, encryptedHash, address);
      window.location.href = `ipfs://${ipfsHash}`;
    } catch (error) {
      toast.error("Must own game NFT to download");
    }
  };

  return <Button onClick={handleDownload}>Download Game</Button>;
};

export default DownloadButton;
