// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameOwnership is ERC1155, Ownable {
    // Map game ID to 0G storage key
    mapping(uint256 => bytes32) private gameStorageKeys;
    
    // Game metadata
    mapping(uint256 => string) private gameTitles;
    mapping(uint256 => string) private gameDescriptions;
    
    event GamePublished(uint256 indexed gameId, bytes32 storageKey);

    constructor() ERC1155("") Ownable(msg.sender) {}

    function publishGame(
        string memory title,
        string memory description,
        bytes32 storageKey,
        uint256 copies
    ) external onlyOwner returns (uint256) {
        uint256 gameId = uint256(keccak256(abi.encodePacked(title, block.timestamp)));
        
        gameStorageKeys[gameId] = storageKey;
        gameTitles[gameId] = title;
        gameDescriptions[gameId] = description;
        
        _mint(msg.sender, gameId, copies, "");
        
        emit GamePublished(gameId, storageKey);
        return gameId;
    }

    function getGameStorageKey(uint256 gameId) external view returns (bytes32) {
        return gameStorageKeys[gameId];
    }

    // ... rest of ERC1155 implementation
} 