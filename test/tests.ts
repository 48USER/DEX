import { ethers, expect } from "./../scripts/setup";
import { deploy } from "./../scripts/deploy";
import { ContractTransactionResponse } from "ethers";
import { Dex } from "../typechain-types";
import { TokenA } from "../typechain-types";
import { TokenB } from "../typechain-types";
import { TokenC } from "../typechain-types";
import { DexToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("DEX", function () {
    let users: HardhatEthersSigner[],
        owner: HardhatEthersSigner,
        dex: Dex,
        tokenA: TokenA & { deploymentTransaction(): ContractTransactionResponse; },
        tokenB: TokenB & { deploymentTransaction(): ContractTransactionResponse; },
        tokenC: TokenC & { deploymentTransaction(): ContractTransactionResponse; },
        dexToken: DexToken & { deploymentTransaction(): ContractTransactionResponse; };

    function sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    beforeEach(async function () {
        const deployment = await deploy();
        users = deployment.users;
        owner = users[0];
        dex = deployment.dex.connect(owner);;
        tokenA = deployment.tokenA;
        tokenB = deployment.tokenB;
        tokenC = deployment.tokenC;
        dexToken = deployment.dexToken;
        await dex.changeRate(tokenA.target, ethers.parseUnits("2", 18));
        await dex.changeRate(tokenB.target, ethers.parseUnits("4", 18));
        await dex.changeRate(tokenC.target, ethers.parseUnits("10", 18));
        await dexToken.connect(owner).approve(dex.target, ethers.parseUnits("100000", 18));
        await dex.connect(owner).addDexToken(ethers.parseUnits("100000", 18))
    });

    it("Deploy", async function () {
        expect(owner.address).to.be.properAddress;
        expect(dex.target).to.be.properAddress;
        expect(tokenA.target).to.be.properAddress;
        expect(tokenB.target).to.be.properAddress;
        expect(tokenC.target).to.be.properAddress;
        expect(dexToken.target).to.be.properAddress;
    });

    it("Adding Liquidity", async function () {
        const provider1 = users[1];
        let tx;
        tx = tokenA.connect(owner).transfer(provider1, 100);
        await tx;
        tx = tokenA.connect(provider1).approve(dex.target, 100);
        await tx;
        tx = tokenA.connect(owner).approve(dex.target, 100);
        await tx;
        tx = dex.connect(provider1).addLiquidity(tokenA.target, 100);
        await tx;
        tx = dex.connect(owner).addLiquidity(tokenA, 100);
        await tx;
        let liquidity = await dex.liquidityStakes(tokenA.target, owner.address);
        expect(liquidity).to.equal(100);
        liquidity = await dex.liquidityStakes(tokenA.target, provider1.address);
        expect(liquidity).to.equal(100);
    });

    it("Adding Liquidity(multiple tokens)", async function () {
        const provider1 = users[1];
        const provider2 = users[2];
        let tx;
        tx = tokenA.connect(owner).transfer(provider1, 100);
        await tx;
        tx = tokenA.connect(provider1).approve(dex.target, 100);
        await tx;
        tx = tokenB.connect(owner).transfer(provider2, 50);
        await tx;
        tx = tokenB.connect(provider2).approve(dex.target, 50);
        await tx;
        tx = dex.connect(provider1).addLiquidity(tokenA.target, 100);
        await tx;
        tx = dex.connect(provider2).addLiquidity(tokenB.target, 50);
        await tx;
        let liquidity = await dex.liquidityStakes(tokenA.target, provider1.address);
        expect(liquidity).to.equal(100);
        liquidity = await dex.liquidityStakes(tokenB.target, provider2.address);
        expect(liquidity).to.equal(50);
    });

    it("Swapp", async function () {
        const user1 = users[3];
        let tx;
        tx = tokenA.connect(owner).transfer(user1, 100);
        await tx;
        tx = tokenA.connect(user1).approve(dex.target, 50);
        await tx;
        tx = tokenB.connect(owner).approve(dex.target, 200);
        await tx;
        tx = dex.connect(owner).addLiquidity(tokenB.target, 200);
        await tx;
        tx = dex.connect(user1).swap(tokenA.target, tokenB.target, 50);
        await tx;
        const user1BalanceB = await tokenB.balanceOf(user1.address);
        expect(user1BalanceB).to.equal(24);
        const dexBalanceA = await tokenA.balanceOf(dex.target);
        expect(dexBalanceA).to.equal(50);
    });

    it("Should revert adding liquidity without approval", async function () {
        const provider1 = users[1];
        let tx;
        tx = tokenA.connect(owner).transfer(provider1, 100);
        await tx;
        await expect(dex.connect(provider1).addLiquidity(tokenA.target, 100))
            .to.be.reverted
    });

    it("Withdraw Provider Fees", async function () {
        const provider1 = users[1];
        const user1 = users[2];
        const user2 = users[3];
        const user3 = users[4];
        let tx;
        tx = tokenA.connect(owner).transfer(provider1, 1000);
        await tx;
        tx = tokenB.connect(owner).transfer(provider1, 1000);
        await tx;
        tx = tokenC.connect(owner).transfer(provider1, 1000);
        await tx;

        tx = tokenA.connect(provider1).approve(dex.target, 1000);
        await tx;
        tx = tokenB.connect(provider1).approve(dex.target, 1000);
        await tx;
        tx = tokenC.connect(provider1).approve(dex.target, 1000);
        await tx;

        tx = dex.connect(provider1).addLiquidity(tokenA.target, 1000);
        await tx;
        tx = dex.connect(provider1).addLiquidity(tokenB.target, 1000);
        await tx;
        tx = dex.connect(provider1).addLiquidity(tokenC.target, 1000);
        await tx;

        tx = tokenA.connect(owner).transfer(user1, 100);
        await tx;
        tx = tokenA.connect(user1).approve(dex.target, 100);
        await tx;
        tx = dex.connect(user1).swap(tokenA.target, tokenB.target, 100);
        await tx;

        tx = tokenB.connect(owner).transfer(user2, 100);
        await tx;
        tx = tokenB.connect(user2).approve(dex.target, 100);
        await tx;
        tx = dex.connect(user2).swap(tokenB.target, tokenC.target, 100);
        await tx;

        tx = tokenC.connect(owner).transfer(user3, 100);
        await tx;
        tx = tokenC.connect(user3).approve(dex.target, 100);
        await tx;
        tx = dex.connect(user3).swap(tokenC.target, tokenA.target, 100);
        await tx;

        tx = dex.connect(provider1).withdrawProviderFees();
        await tx;

        const provider1Fees = await dex.providerFees(provider1.address);
        expect(provider1Fees).to.equal(0);

        const fee = await dexToken.balanceOf(provider1);
        console.log(fee);
        expect(fee).to.not.equal(0);
    });

    it("Not Provider", async function () {
        const user = users[3];
        await expect(dex.connect(user).withdrawProviderFees())
            .to.be.reverted;
    });

    it("Not Owner", async function () {
        const user = users[3];
        await expect(dex.connect(user).withdrawOwnerFees())
            .to.be.reverted;
    });

    it("Change Rates", async function () {
        await dex.connect(owner).changeRate(tokenA.target, ethers.parseUnits("3", 18));
        const rate = await dex.rates(tokenA.target);
        expect(rate).to.equal(ethers.parseUnits("3", 18));
    });

    it("Should revert changeRate if not owner", async function () {
        const user = users[3];
        await expect(dex.connect(user).changeRate(tokenA.target, ethers.parseUnits("3", 18)))
            .to.be.reverted;
    });

    it("Comprehensive Swap Test", async function () {
        const provider1 = users[1];
        const user = users[3];
        let tx;

        tx = tokenA.connect(owner).transfer(provider1, ethers.parseUnits("1000", 18));
        await tx;
        tx = tokenA.connect(provider1).approve(dex.target, ethers.parseUnits("1000", 18));
        await tx;
        tx = dex.connect(provider1).addLiquidity(tokenA.target, ethers.parseUnits("1000", 18));
        await tx;

        tx = tokenB.connect(owner).approve(dex.target, ethers.parseUnits("2000", 18));
        await tx;
        tx = dex.connect(owner).addLiquidity(tokenB.target, ethers.parseUnits("2000", 18));
        await tx;

        tx = tokenA.connect(owner).transfer(user, ethers.parseUnits("100", 18));
        await tx;
        tx = tokenA.connect(user).approve(dex.target, ethers.parseUnits("50", 18));
        await tx;
        tx = dex.connect(user).swap(tokenA.target, tokenB.target, ethers.parseUnits("50", 18));
        await tx;

        const userBalanceB = await tokenB.balanceOf(user.address);
        const dexBalanceA = await tokenA.balanceOf(dex.target);
        const dexBalanceB = await tokenB.balanceOf(dex.target);

        console.log(`User TokenB Balance: ${ethers.formatUnits(userBalanceB, 18)}`);
        console.log(`DEX TokenA Balance: ${ethers.formatUnits(dexBalanceA, 18)}`);
        console.log(`DEX TokenB Balance: ${ethers.formatUnits(dexBalanceB, 18)}`);

        expect(userBalanceB).to.be.gt(0);
        expect(dexBalanceA).to.equal(ethers.parseUnits("1050", 18));
        expect(dexBalanceB).to.be.lt(ethers.parseUnits("2000", 18));
    });
});