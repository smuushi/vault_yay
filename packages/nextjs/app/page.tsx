"use client";

import { useEffect, useState } from "react";
import { GameUploadService } from "../services/GameUploadService";
import { Box, Button, Container, Heading, Input, Link, Stack, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useAccount, useWalletClient } from "wagmi";
import { useToast } from "~~/components/ui/toaster";
import { useScaffoldContract } from "~~/hooks/scaffold-eth";

interface Game {
  title: string;
  ipfsHash: string;
  price: bigint;
  publisher: string;
  isActive: boolean;
}

const Home = () => {
  const { address: connectedAddress } = useAccount();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [gameOwnerships, setGameOwnerships] = useState<Record<number, boolean>>({});

  const { data: walletClient } = useWalletClient();
  const { data: gameContract } = useScaffoldContract({
    contractName: "GameOwnership",
    walletClient,
  });

  const gameUploadService = new GameUploadService();
  const toast = useToast();

  const { data: gamesContract } = useScaffoldContract({
    contractName: "GameOwnership",
  });

  const { data: gamesList } = useScaffoldContract({
    contractName: "GameOwnership",
  });

  // Add effect to load games
  useEffect(() => {
    const loadGames = async () => {
      if (gamesContract) {
        const fetchedGames = await gamesContract.read.getGames();
        setGames([...fetchedGames]);
      }
    };
    loadGames();
  }, [gamesContract]);

  // Add effect to check ownership for each game
  useEffect(() => {
    const checkOwnerships = async () => {
      if (!games) return;
      const ownerships: Record<number, boolean> = {};
      for (let i = 0; i < games.length; i++) {
        ownerships[i] = await checkGameOwnership(i);
      }
      setGameOwnerships(ownerships);
    };
    checkOwnerships();
  }, [games, gameContract, connectedAddress]);

  const handlePublishGame = async () => {
    if (!selectedFile || !title || !price || !gameContract) return;

    try {
      const ipfsHash = await gameUploadService.uploadGame(selectedFile);

      const tx = await gameContract.write.listGame([title, ipfsHash, ethers.parseEther(price)]);
      // await tx.wait();

      toast.create({
        title: "Game Published",
        description: "Your game has been successfully published!",
        type: "success",
      });
    } catch (error) {
      console.error("Error publishing game:", error);
      toast.create({
        title: "Error",
        description: "Failed to publish game",
        type: "error",
      });
    }
  };

  const checkGameOwnership = async (gameId: number) => {
    if (!gameContract || !connectedAddress) return false;
    try {
      return await gameContract.read.userOwnsGame([connectedAddress, BigInt(gameId)]);
    } catch (error) {
      console.error("Error checking game ownership:", error);
      return false;
    }
  };

  const handlePurchaseGame = async (gameId: number, price: bigint) => {
    if (!gameContract) return;
    try {
      const tx = await gameContract.write.purchaseGame([BigInt(gameId)], { value: price });
      toast.create({
        title: "Game Purchased",
        description: "You can now download the game!",
        type: "success",
      });
    } catch (error) {
      console.error("Error purchasing game:", error);
      toast.create({
        title: "Error",
        description: "Failed to purchase game",
        type: "error",
      });
    }
  };

  return (
    <>
      <Container maxW="container.xl" py={10}>
        <Stack spacing={8}>
          {connectedAddress && (
            <Box p={6} borderWidth={1} borderRadius="lg">
              <Heading size="md" mb={4}>
                Publish New Game
              </Heading>
              <Stack>
                <Input
                  placeholder="Game Title"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                />
                <Input
                  placeholder="Price in ETH"
                  value={price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
                />
                <Input
                  type="file"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <Button colorScheme="blue" onClick={handlePublishGame}>
                  Publish Game
                </Button>
              </Stack>
            </Box>
          )}

          {!connectedAddress && <Text>Please connect your wallet to publish or purchase games.</Text>}

          {connectedAddress && (
            <Box p={6} borderWidth={1} borderRadius="lg">
              <Heading size="md" mb={4}>
                Published Games
              </Heading>
              <Stack spacing={4}>
                {games?.map((game: Game, index: number) => (
                  <Box key={index} p={4} borderWidth={1} borderRadius="md">
                    <Text fontWeight="bold">{game.title}</Text>
                    <Text>Price: {ethers.formatEther(game.price)} ETH</Text>
                    {gameOwnerships[index] ? (
                      <Link href={gameUploadService.getIpfsUrl(game.ipfsHash)} isExternal>
                        Download Game
                      </Link>
                    ) : (
                      <Button onClick={() => handlePurchaseGame(index, game.price)}>Purchase Game</Button>
                    )}
                  </Box>
                ))}
                {games?.length === 0 && <Text>No games published yet</Text>}
              </Stack>
            </Box>
          )}
        </Stack>
      </Container>
    </>
  );
};

export default Home;
