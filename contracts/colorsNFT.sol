// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

contract ColorsNFT is ERC721, Ownable {
    using Strings for uint256;

    uint256 public nextTokenId = 1;
    uint256 public mintPrice = 100 ether; // 100 MON


    mapping(uint256 => string) private _colorOf;

    bool public uniqueColors = true;
    mapping(bytes32 => bool) private _colorTaken;
    mapping(bytes32 => uint256) private _colorToTokenId;

    event ColorMinted(address indexed owner, uint256 indexed tokenId, string color);

    constructor(address initialOwner)
        ERC721("colorsNFT", "COLORS")
        Ownable(initialOwner)
    {}

    function mint(string calldata hexColor) external payable {
        require(msg.value == mintPrice, "Incorrect MON amount");
        require(_isValidHexColor(hexColor), "Invalid color, expected #RRGGBB");

        string memory normalized = _toLower(hexColor);

        if (uniqueColors) {
            bytes32 key = keccak256(bytes(normalized));
            require(!_colorTaken[key], "Color already minted");
            _colorTaken[key] = true;
        }

        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _colorOf[tokenId] = normalized;

        bytes32 key2 = keccak256(bytes(normalized));
        _colorToTokenId[key2] = tokenId;

        emit ColorMinted(msg.sender, tokenId, normalized);
    }

    function setUniqueColors(bool value) external onlyOwner {
        uniqueColors = value;
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function withdraw(address payable to) external onlyOwner {
        require(address(this).balance > 0, "No funds");
        to.transfer(address(this).balance);
    }

    function colorOf(uint256 tokenId) public view returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        return _colorOf[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        string memory color = _colorOf[tokenId];

        string memory svg = string(
            abi.encodePacked(
                "<svg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024'>",
                    "<rect width='100%' height='100%' fill='", color, "'/>",
                "</svg>"
            )
        );

        string memory imageData = string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(bytes(svg))
            )
        );

        bytes memory json = abi.encodePacked(
            "{",
                '"name":"', color, '",',
                '"description":"On-chain single-color square NFT. Name equals the color code.",',
                '"attributes":[{"trait_type":"Color","value":"', color, '"}],',
                '"image":"', imageData, '"',
            "}"
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(json)
            )
        );
    }

    function _isValidHexColor(string calldata s) internal pure returns (bool) {
        bytes calldata b = bytes(s);
        if (b.length != 7) return false;
        if (b[0] != 0x23) return false;

        for (uint256 i = 1; i < 7; i++) {
            bytes1 c = b[i];
            bool isNum = (c >= 0x30 && c <= 0x39);
            bool isLow = (c >= 0x61 && c <= 0x66);
            bool isUp  = (c >= 0x41 && c <= 0x46);
            if (!(isNum || isLow || isUp)) return false;
        }
        return true;
    }

    function _toLower(string calldata s) internal pure returns (string memory) {
        bytes calldata b = bytes(s);
        bytes memory out = new bytes(b.length);
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            if (c >= 0x41 && c <= 0x5A) {
                out[i] = bytes1(uint8(c) + 32);
            } else {
                out[i] = c;
            }
        }
        return string(out);
    }

    function isColorTaken(string calldata hexColor) external view returns (bool) {
        string memory normalized = _toLower(hexColor);
        return _colorTaken[keccak256(bytes(normalized))];
    }

    function ownerOfColor(string calldata hexColor) external view returns (address) {
        string memory normalized = _toLower(hexColor);
        uint256 tokenId = _colorToTokenId[keccak256(bytes(normalized))];
        if (tokenId == 0) return address(0);
        return ownerOf(tokenId);
    }
}
