"use client";

import { Buffer } from "buffer";
import { create } from "ipfs-http-client";

export class GameUploadService {
  private ipfs;

  constructor() {
    this.ipfs = create({
      url: "http://localhost:5001/api/v0",
    });
  }

  async uploadGame(file: File): Promise<string> {
    if (typeof window === "undefined") {
      throw new Error("This service can only be used in the browser");
    }

    try {
      const added = await this.ipfs.add(file);
      return added.path;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      throw error;
    }
  }

  getIpfsUrl(hash: string): string {
    return `http://localhost:8080/ipfs/${hash}`;
  }
}
