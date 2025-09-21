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

  console.log("Deploying with account:", wallet.address);

  // ABI + bytecode
  const artifact = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        "..",
        "artifacts",
        "contracts",
        "ColorsNFT.sol",
        "ColorsNFT.json"
      ),
      "utf8"
    )
  );

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  // deploy with owner
  const contract = await factory.deploy(wallet.address);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✅ ColorsNFT deployed to:", contractAddress);

  // Save ABI + address for frontend
  const frontendDir = path.join(__dirname, "..", "frontend", "abi");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(frontendDir, "contract-address.json"),
    JSON.stringify({ address: contractAddress }, null, 2)
  );

  fs.writeFileSync(
    path.join(frontendDir, "ColorsNFT.json"),
    JSON.stringify(artifact.abi, null, 2)
  );

  console.log("✅ ABI and address saved to frontend/abi/");
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
