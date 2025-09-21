import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.SEPOLIA_PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    throw new Error("❌ Missing SEPOLIA_RPC_URL or SEPOLIA_PRIVATE_KEY");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("🚀 Running withdraw from account:", wallet.address);

  const abiPath = path.join(
    __dirname,
    "..",
    "frontend",
    "abi",
    "ColorsNFT.json"
  );
  const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

  const addressPath = path.join(
    __dirname,
    "..",
    "frontend",
    "abi",
    "contract-address.json"
  );
  const { address: contractAddress } = JSON.parse(
    fs.readFileSync(addressPath, "utf8")
  );

  const contract = new ethers.Contract(contractAddress, abi, wallet);

  const tx = await contract.withdraw(wallet.address);
  await tx.wait();

  console.log(`✅ Withdraw successful. TX: ${tx.hash}`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
