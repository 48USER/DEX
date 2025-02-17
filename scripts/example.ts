import { deploy } from "./deploy";
import { ethers } from "hardhat";

async function example() {
    const { users, dex, tokenA, tokenB, tokenC, dexToken } = await deploy();

    const owner = users[0];
    const provider1 = users[1];
    const provider2 = users[2];
    const user1 = users[3];
    const user2 = users[4];
    const user3 = users[5];

    const printBalances = async (user: { address: string }, label: string): Promise<void> => {
        const balances = {
            TokenA: await tokenA.balanceOf(user.address),
            TokenB: await tokenB.balanceOf(user.address),
            TokenC: await tokenC.balanceOf(user.address),
            DexToken: await dexToken.balanceOf(user.address),
        };
        console.log(`${label} Balances:`);
        console.log(`  TokenA: ${ethers.formatUnits(balances.TokenA, 18)}`);
        console.log(`  TokenB: ${ethers.formatUnits(balances.TokenB, 18)}`);
        console.log(`  TokenC: ${ethers.formatUnits(balances.TokenC, 18)}`);
        console.log(`  DexToken: ${ethers.formatUnits(balances.DexToken, 18)}`);
    };

    const executeTransaction = async (action: () => Promise<any>, message: string): Promise<void> => {
        const tx = await action();
        await tx.wait();
        console.log(message);
    };

    await dex.connect(owner).changeRate(tokenA.target, ethers.parseUnits("2", 18));
    await dex.connect(owner).changeRate(tokenB.target, ethers.parseUnits("5", 18));
    await dex.connect(owner).changeRate(tokenC.target, ethers.parseUnits("11", 18));

    dexToken.connect(owner).approve(dex.target, ethers.parseUnits("100000", 18));
    await dex.connect(owner).addDexToken(ethers.parseUnits("100000", 18));

    await executeTransaction(
        () => tokenA.connect(owner).transfer(provider1, ethers.parseUnits("100000", 18)),
        `Transferred 100000 TokenA from Owner to Provider1.`
    );
    await executeTransaction(
        () => tokenB.connect(owner).transfer(provider1, ethers.parseUnits("100000", 18)),
        `Transferred 100000 TokenB from Owner to Provider1.`
    );
    await executeTransaction(
        () => tokenC.connect(owner).transfer(provider1, ethers.parseUnits("100000", 18)),
        `Transferred 100000 TokenC from Owner to Provider1.`
    );

    await executeTransaction(
        () => tokenA.connect(provider1).approve(dex.target, ethers.parseUnits("100000", 18)),
        `Provider1 approved 100000 TokenA for DEX.`
    );
    await executeTransaction(
        () => tokenB.connect(provider1).approve(dex.target, ethers.parseUnits("100000", 18)),
        `Provider1 approved 100000 TokenB for DEX.`
    );
    await executeTransaction(
        () => tokenC.connect(provider1).approve(dex.target, ethers.parseUnits("100000", 18)),
        `Provider1 approved 100000 TokenC for DEX.`
    );

    await executeTransaction(
        () => dex.connect(provider1).addLiquidity(tokenA.target, ethers.parseUnits("100000", 18)),
        `Added 100000 TokenA to liquidity from Provider1.`
    );
    await executeTransaction(
        () => dex.connect(provider1).addLiquidity(tokenB.target, ethers.parseUnits("100000", 18)),
        `Added 100000 TokenB to liquidity from Provider1.`
    );
    await executeTransaction(
        () => dex.connect(provider1).addLiquidity(tokenC.target, ethers.parseUnits("100000", 18)),
        `Added 100000 TokenC to liquidity from Provider1.`
    );

    await executeTransaction(
        () => tokenA.connect(owner).transfer(provider2, ethers.parseUnits("10000", 18)),
        `Transferred 10000 TokenA from Owner to Provider2.`
    );
    await executeTransaction(
        () => tokenB.connect(owner).transfer(provider2, ethers.parseUnits("10000", 18)),
        `Transferred 10000 TokenB from Owner to Provider2.`
    );
    await executeTransaction(
        () => tokenC.connect(owner).transfer(provider2, ethers.parseUnits("10000", 18)),
        `Transferred 10000 TokenC from Owner to Provider2.`
    );

    await executeTransaction(
        () => tokenA.connect(provider2).approve(dex.target, ethers.parseUnits("10000", 18)),
        `Provider2 approved 10000 TokenA for DEX.`
    );
    await executeTransaction(
        () => tokenB.connect(provider2).approve(dex.target, ethers.parseUnits("10000", 18)),
        `Provider2 approved 10000 TokenB for DEX.`
    );
    await executeTransaction(
        () => tokenC.connect(provider2).approve(dex.target, ethers.parseUnits("10000", 18)),
        `Provider2 approved 10000 TokenC for DEX.`
    );

    await executeTransaction(
        () => dex.connect(provider2).addLiquidity(tokenA.target, ethers.parseUnits("10000", 18)),
        `Added 10000 TokenA to liquidity from Provider2.`
    );
    await executeTransaction(
        () => dex.connect(provider2).addLiquidity(tokenB.target, ethers.parseUnits("10000", 18)),
        `Added 10000 TokenB to liquidity from Provider2.`
    );
    await executeTransaction(
        () => dex.connect(provider2).addLiquidity(tokenC.target, ethers.parseUnits("10000", 18)),
        `Added 10000 TokenC to liquidity from Provider2.`
    );

    await executeTransaction(
        () => tokenA.connect(owner).transfer(user1, ethers.parseUnits("1000", 18)),
        `Transferred 1000 TokenA from Owner to User1.`
    );
    await executeTransaction(
        () => tokenB.connect(owner).transfer(user2, ethers.parseUnits("1000", 18)),
        `Transferred 1000 TokenB from Owner to User2.`
    );
    await executeTransaction(
        () => tokenC.connect(owner).transfer(user3, ethers.parseUnits("1000", 18)),
        `Transferred 1000 TokenC from Owner to User3.`
    );

    await printBalances(user1, "User1 Before Swap");
    await executeTransaction(
        () => tokenA.connect(user1).approve(dex.target, ethers.parseUnits("1000", 18)),
        "User1 approved 1000 TokenA for DEX."
    );
    await executeTransaction(
        () => dex.connect(user1).swap(tokenA.target, tokenB.target, ethers.parseUnits("5", 18)),
        "User1 swapped 5 TokenA for TokenB."
    );
    await printBalances(user1, "User1 After Swap");

    console.log("=/=/=/=");

    await printBalances(user2, "User2 Before Swap");
    await executeTransaction(
        () => tokenB.connect(user2).approve(dex.target, ethers.parseUnits("5", 18)),
        "User2 approved 5 TokenB for DEX."
    );
    await executeTransaction(
        () => dex.connect(user2).swap(tokenB.target, tokenC.target, ethers.parseUnits("5", 18)),
        "User2 swapped 5 TokenB for TokenC."
    );
    await printBalances(user2, "User2 After Swap");

    console.log("=/=/=/=");

    await printBalances(user3, "User3 Before Swap");
    await executeTransaction(
        () => tokenC.connect(user3).approve(dex.target, ethers.parseUnits("5", 18)),
        "User3 approved 5 TokenC for DEX."
    );
    await executeTransaction(
        () => dex.connect(user3).swap(tokenC.target, tokenA.target, ethers.parseUnits("5", 18)),
        "User3 swapped 5 TokenC for TokenA."
    );
    await printBalances(user3, "User3 After Swap");

    console.log("PROFIT:");
    await dex.connect(provider1).withdrawProviderFees();
    await printBalances(provider1, "Provider1 After withdraw fees");
    await dex.connect(provider2).withdrawProviderFees();
    await printBalances(provider2, "Provider2 After withdraw fees");
}

example().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
