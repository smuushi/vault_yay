// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IGameOwnership {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

interface IZeroGStorage {
    function validateAccess(bytes32 storageKey, address user) external view returns (bool);
}

contract GameAccessControl is Ownable {
    using ECDSA for bytes32;

    IZeroGStorage public zeroGStorage;
    IGameOwnership public nftContract;
    
    // Map game IDs to their storage keys
    mapping(uint256 => bytes32) private gameStorageKeys;
    
    event GameStorageUpdated(uint256 gameId, bytes32 storageKey);

    constructor(address _nftAddress) Ownable(msg.sender) {
        nftContract = IGameOwnership(_nftAddress);
    }

    function createDownloadSession(address user, uint256 gameId) external returns (bytes32) {
        require(nftContract.balanceOf(user, gameId) > 0, "Must own game NFT");
        return keccak256(abi.encodePacked(user, gameId, block.timestamp));
    }

    function validateStorageAccess(uint256 gameId, address user) external view returns (bool) {
        // Check NFT ownership
        require(nftContract.balanceOf(user, gameId) > 0, "Must own game NFT");
        
        // Get storage key for the game
        bytes32 storageKey = gameStorageKeys[gameId];
        
        // Validate access through 0G Storage
        return zeroGStorage.validateAccess(storageKey, user);
    }
} 