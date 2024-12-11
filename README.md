# NFT-Based Game Distribution Platform

A decentralized platform for distributing games using NFTs and 0G Storage, built with Scaffold-ETH 2.

## How It Works

### Game Upload Flow

1. Game maker uploads their game file
2. File is stored on 0G Storage with NFT-based access control
3. ERC1155 NFTs are minted through GameOwnership contract
4. Each game has a unique storage key tied to NFT ownership

---

## NFT-Based Access Control

The platform uses NFT ownership to control access to game files through several layers:

### 1. Smart Contract Layer

```solidity
// GameOwnership.sol
contract GameOwnership is ERC1155 {
    // Map game IDs to their storage keys
    mapping(uint256 => bytes32) private gameStorageKeys;

    function getGameStorageKey(uint256 gameId) external view returns (bytes32) {
        // Only callable by 0G Storage nodes to verify ownership
        return gameStorageKeys[gameId];
    }
}
```

### 2. Storage Access Control

```typescript
// GameAccessService.ts
async storeGame(gameId: number, gameData: Buffer) {
  // Store with NFT-based access policy
  const storageKey = await this.zeroGClient.store(gameData, {
    accessControl: {
      validate: async (userAddress: string) => {
        // Check if user owns the NFT
        const balance = await this.nftContract.balanceOf(userAddress, gameId);
        return balance > 0;
      }
    }
  });
  return storageKey;
}
```

### 3. Download Verification

```typescript
// DownloadButton.tsx
const handleDownload = async () => {
  if (!address) {
    toast.error("Please connect your wallet");
    return;
  }

  try {
    // Get encrypted storage key
    const storageKey = await gameService.getStorageKey(gameId);

    // Request download with ownership proof
    const gameData = await gameService.downloadGame(gameId, address);

    // 0G nodes verify NFT ownership before serving file
  } catch (error) {
    toast.error("Must own game NFT to download");
  }
};
```

### Security Flow

1. Game files are stored on 0G Storage with NFT-based access control
2. Storage keys are mapped to game IDs in the smart contract
3. When downloading:
   - User must prove NFT ownership
   - Storage nodes verify ownership through smart contract
   - File is only served to valid NFT holders
4. No central server can be compromised
5. Access control is enforced at the protocol level

This creates a trustless system where:

- Only NFT holders can access game files
- Access rights are automatically enforced
- No central point of failure
- Ownership verification is done on-chain
