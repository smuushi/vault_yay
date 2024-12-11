import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useWalletClient } from "wagmi";
import { GameAccessService } from "~~/services/GameAccessService";

export function UploadButton({ gameId }: { gameId: number }) {
  const { data: walletClient } = useWalletClient();
  const [gameService] = useState(() => new GameAccessService(process.env.ENCRYPTION_KEY));

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const storageKey = await gameService.uploadGame(file);
      toast.success(`Uploaded! Storage key: ${storageKey}`);
    } catch (error) {
      toast.error("Upload failed");
    }
  };

  return (
    <div>
      <input type="file" onChange={handleUpload} />
    </div>
  );
}
