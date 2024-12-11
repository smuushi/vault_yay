import { Contract, JsonRpcProvider, ethers } from "ethers";
import { decodeBase64, encodeBase64, toUtf8Bytes, toUtf8String } from "ethers";
import deployedContracts from "~~/contracts/deployedContracts";
import { getTargetNetworks } from "~~/utils/scaffold-eth";
import { ZeroGClient, ZeroGClientImpl } from "~~/utils/zero-g-client";

export class GameAccessService {
  private accessContract: Contract;
  private nftContract: Contract;
  private zeroGClient: ZeroGClient;

  constructor() {
    const [network] = getTargetNetworks();
    const provider = new JsonRpcProvider(network.rpcUrls.public.http[0]);

    const accessContract = (deployedContracts as any)[network.id.toString()]?.["GameAccessControl"];
    const nftContract = (deployedContracts as any)[network.id.toString()]?.["GameOwnership"];

    if (!accessContract || !nftContract) throw new Error("Contracts not found");

    this.accessContract = new Contract(accessContract.address, accessContract.abi, provider);
    this.nftContract = new Contract(nftContract.address, nftContract.abi, provider);
    this.zeroGClient = new ZeroGClientImpl();
  }

  private async getNftBasedKey(gameId: number, userAddress: string): Promise<string> {
    // Get NFT token data as encryption key
    const tokenId = gameId;
    const tokenURI = await this.nftContract.tokenURI(tokenId);
    const ownershipProof = await this.nftContract.balanceOf(userAddress, tokenId);

    // Combine NFT data to create encryption     key
    const keyData = ethers.concat([
      ethers.toUtf8Bytes(tokenURI),
      ethers.toUtf8Bytes(ownershipProof.toString()),
      ethers.toUtf8Bytes(userAddress),
    ]);

    return ethers.keccak256(keyData);
  }

  // Encrypt IPFS hash before storing
  async encryptIpfsHash(ipfsHash: string, gameId: number): Promise<string> {
    // Use NFT data as encryption key
    const encryptionKey = await this.getNftBasedKey(gameId, await this.accessContract.owner());
    const encrypted = await this.encryptWithKey(ipfsHash, encryptionKey);
    return encrypted;
  }

  private async encryptWithKey(data: string, key: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(key), { name: "PBKDF2" }, false, [
      "deriveBits",
      "deriveKey",
    ]);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const aesKey = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"],
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoder.encode(data));

    return encodeBase64(new Uint8Array([...salt, ...iv, ...new Uint8Array(encrypted)]));
  }

  // Get signed URL for game access
  async getSignedGameUrl(gameId: number, userAddress: string): Promise<string> {
    const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour validity

    const signature = await this.accessContract.generateAccessSignature(userAddress, gameId, expiry);

    return `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/access?gameId=${gameId}&expiry=${expiry}&signature=${signature}`;
  }

  // Verify signature and decrypt hash
  async verifyAndDecrypt(gameId: number, expiry: number, signature: string): Promise<string> {
    const encryptedHash = await this.accessContract.getGameHash(gameId, expiry, signature);
    const decrypted = toUtf8String(decodeBase64(encryptedHash));
    return decrypted;
  }

  async getDownloadUrl(gameId: number, userAddress: string): Promise<string> {
    // Create one-time download session
    const sessionId = await this.accessContract.createDownloadSession(userAddress, gameId);

    return `/api/download?sessionId=${sessionId}&gameId=${gameId}`;
  }

  // Server-side only
  async getDecryptedIpfsHash(gameId: number, sessionId: string, userAddress: string): Promise<string> {
    const encryptedHash = await this.accessContract.getEncryptedHash(gameId, sessionId);

    // Decrypt using NFT-based key
    const decryptionKey = await this.getNftBasedKey(gameId, userAddress);
    const decrypted = await this.decryptWithKey(encryptedHash, decryptionKey);

    await this.accessContract.invalidateSession(sessionId);
    return decrypted;
  }

  private async decryptWithKey(encryptedData: string, key: string): Promise<string> {
    const decoder = new TextDecoder();
    const encrypted = new Uint8Array(decodeBase64(encryptedData));

    const salt = encrypted.slice(0, 16);
    const iv = encrypted.slice(16, 28);
    const data = encrypted.slice(28);

    const keyMaterial = await crypto.subtle.importKey("raw", toUtf8Bytes(key), { name: "PBKDF2" }, false, [
      "deriveBits",
      "deriveKey",
    ]);
    const aesKey = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, data);
    return decoder.decode(decrypted);
  }

  async getEncryptedHash(gameId: number): Promise<string> {
    return this.accessContract.getEncryptedHash(gameId);
  }

  async storeGame(gameId: number, gameData: Buffer) {
    // Store with access control policy
    const storageKey = await this.zeroGClient.store(gameData, {
      accessControl: {
        validate: async (userAddress: string) => {
          // Check if user owns the NFT
          const isOwner = await this.nftContract.balanceOf(userAddress, gameId);
          return isOwner > 0;
        },
      },
      // Optional: Specify storage nodes that support access control
      nodeFilter: node => node.supportsAccessControl,
    });

    return storageKey;
  }

  async downloadGame(gameId: number, userAddress: string) {
    const storageKey = await this.getStorageKey(gameId);

    // 0G nodes will verify NFT ownership before serving data
    return this.zeroGClient.retrieve(storageKey, {
      proof: {
        address: userAddress,
        // Include proof of NFT ownership
        ownershipProof: await this.getNFTOwnershipProof(gameId, userAddress),
      },
    });
  }

  private async getStorageKey(gameId: number): Promise<string> {
    const storageKey = await this.accessContract.getGameStorageKey(gameId);
    if (!storageKey) throw new Error("Storage key not found for game");
    return storageKey;
  }

  private async getNFTOwnershipProof(gameId: number, userAddress: string): Promise<string> {
    const signature = await this.accessContract.signOwnershipProof(gameId, userAddress);
    return signature;
  }
}
