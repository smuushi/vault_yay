import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useWalletClient } from "wagmi";
import { GameAccessService } from "~~/services/GameAccessService";

export function DownloadButton({ gameId }: { gameId: number }) {
  const { data: walletClient } = useWalletClient();
  const [gameService] = useState(() => new GameAccessService(process.env.ENCRYPTION_KEY));

  const handleDownload = async () => {
    try {
      const data = await gameService.downloadGame(gameId.toString());
      // Create and trigger download
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `game-${gameId}.bin`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Download started!");
    } catch (error) {
      toast.error("Must own game NFT to download");
    }
  };

  return <button onClick={handleDownload}>Download Game</button>;
}
