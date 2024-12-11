// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameOwnership is ERC721Enumerable, Ownable {
    mapping(uint256 => bytes32) private gameStorageKeys;
    
    constructor() ERC721("GameVault", "GAME") Ownable(msg.sender) {}

    function mintGame(address to, bytes32 storageKey) external returns (uint256) {
        uint256 tokenId = totalSupply() + 1;
        gameStorageKeys[tokenId] = storageKey;
        _mint(to, tokenId);
        return tokenId;
    }

    function getGameStorageKey(uint256 tokenId) external view returns (bytes32) {
        return gameStorageKeys[tokenId];
    }
} 