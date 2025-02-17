import { ethers } from "./setup";

export { deploy }

async function deploy() {
    const users = await ethers.getSigners();
    const owner = users[0];

    console.log("Deploying contracts with the account:", owner.address);

    const TokenA = await ethers.getContractFactory("TokenA", owner);
    const tokenA = await TokenA.deploy();
    await tokenA.waitForDeployment();
    console.log("Token A deployed to:", tokenA.target);

    const TokenB = await ethers.getContractFactory("TokenB", owner);
    const tokenB = await TokenB.deploy();
    await tokenA.waitForDeployment();
    console.log("Token B deployed to:", tokenB.target);

    const TokenC = await ethers.getContractFactory("TokenC", owner);
    const tokenC = await TokenC.deploy();
    await tokenA.waitForDeployment();
    console.log("Token C deployed to:", tokenC.target);

    const DexToken = await ethers.getContractFactory("DexToken", owner);
    const dexToken = await DexToken.deploy();
    await tokenA.waitForDeployment();
    console.log("Dex Token deployed to:", dexToken.target);

    const dexTokenAddress = dexToken.target;
    const availableTokens: [string, string, string] = [
        tokenA.target as string,
        tokenB.target as string,
        tokenC.target as string,
    ];

    const Dex = await ethers.getContractFactory("Dex", owner);
    const dex = await Dex.deploy(dexTokenAddress, availableTokens);

    await dex.waitForDeployment();
    console.log("Dex deployed to:", dex.target);
    return { users, dex, tokenA, tokenB, tokenC, dexToken }
}

deploy()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });