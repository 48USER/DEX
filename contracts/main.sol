// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract Dex {
    address public owner;
    address public dexToken;

    address[3] public availableTokens;
    mapping(address => uint256) public rates;
    mapping(address => uint256) public reserves;
    address[] liquidityProviders;
    mapping(address => mapping(address => uint256)) public liquidityStakes;
    mapping(address => uint256) ownerFees;
    mapping(address => uint256) public providerFees;

    uint256 public constant FEE_PERCENT = 5; // 0.5%

    constructor(address _dexToken, address[3] memory _availableTokens) {
        owner = msg.sender;
        dexToken = _dexToken;
        availableTokens = _availableTokens;
    }

    function changeRate(address token, uint256 rate) public onlyOwner {
        require(rate > 0, "Rate must be greater than zero");
        rates[token] = rate;
    }

    function addDexToken(uint256 amount) public onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        IERC20(dexToken).transferFrom(msg.sender, address(this), amount);
    }

    function getRate(address token) public view returns (uint256) {
        return rates[token];
    }

    function addLiquidity(address token, uint256 amount) public {
        require(amount > 0, "Amount must be greater than zero");
        require(_isAvailableToken(token), "Token is not supported");

        if (!_providerExists(msg.sender)) {
            liquidityProviders.push(msg.sender);
        }

        IERC20(token).transferFrom(msg.sender, address(this), amount);
        liquidityStakes[token][msg.sender] += amount;
        reserves[token] += amount;
    }

    function withdrawOwnerFees() public onlyOwner {
        for (uint256 i = 0; i < availableTokens.length; i++) {
            address token = availableTokens[i];
            uint256 feeAmount = ownerFees[token];
            require(feeAmount > 0, "No fees available to withdraw");

            ownerFees[token] = 0;
            IERC20(token).transfer(owner, feeAmount);
        }
    }

    function withdrawProviderFees() public {
        require(_providerExists(msg.sender), "You are not a liquidity provider");

        uint256 feeAmount = providerFees[msg.sender];
        require(feeAmount > 0, "No fees available to withdraw");
        providerFees[msg.sender] = 0;
        IERC20(dexToken).transfer(msg.sender, feeAmount);
    }

    function swap(address tokenIn, address tokenOut, uint256 amountIn) public returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be greater than zero");
        require(_isAvailableToken(tokenIn) && _isAvailableToken(tokenOut), "One or both tokens are not supported");
        require(reserves[tokenOut] > 0, "Insufficient liquidity for tokenOut");

        uint256 fee = (amountIn * FEE_PERCENT) / 100;
        uint256 amountInWithFee = amountIn - fee;
        uint256 rateIn = rates[tokenIn];
        require(rateIn > 0, "Rate not set for tokenIn");
        uint256 rateOut = rates[tokenOut];
        require(rateOut > 0, "Rate not set for tokenIn");

        uint256 feeDexToken = fee * rateIn / 1e18;
        amountOut = (amountInWithFee * rateIn * 1e18) / rateOut / 1e18;
        console.log(amountOut);
        require(reserves[tokenOut] >= amountOut, "Insufficient liquidity for swap");
        for (uint256 i = 0; i < liquidityProviders.length; i++) {
            address provider = liquidityProviders[i];
            uint256 stakeCoefficient = liquidityStakes[tokenOut][provider] * 1e18 / reserves[tokenOut];

            uint256 providerShare = (feeDexToken * stakeCoefficient) / 2 / 1e18;
            providerFees[provider] += providerShare;

            uint256 soldStake = (amountInWithFee * stakeCoefficient) / 1e18;
            liquidityStakes[tokenOut][provider] -= soldStake;
        }

        ownerFees[tokenOut] += fee / 2;

        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);

        reserves[tokenIn] += amountInWithFee;
        reserves[tokenOut] -= amountOut;

        return amountOut;
    }

    function _providerExists(address provider) private view returns (bool) {
        for (uint256 i = 0; i < liquidityProviders.length; i++) {
            if (liquidityProviders[i] == provider) {
                return true;
            }
        }
        return false;
    }

    function _isAvailableToken(address token) private view returns (bool) {
        for (uint256 i = 0; i < availableTokens.length; i++) {
            if (availableTokens[i] == token) {
                return true;
            }
        }
        return false;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Permission denied");
        _;
    }
}
