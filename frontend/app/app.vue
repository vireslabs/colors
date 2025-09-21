<template>
  <client-only>
    <div class="container">
      <h1>ColorsNFT Mint</h1>

      <appkit-button label="Connect Wallet" />

      <div v-if="isConnected" class="mint-section">
        <input v-model="color" type="color" />
        <p>Selected color: {{ color }}</p>
        <button @click="mintNFT">Mint NFT</button>
      </div>

      <p v-if="status">{{ status }}</p>
    </div>
  </client-only>
</template>

<script setup>
import { ref, computed } from "vue";
import { ethers } from "ethers";
import { BrowserProvider, Contract, parseEther } from "ethers";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { mainnet, arbitrum, sepolia } from "@reown/appkit/networks";
import { useAppKitProvider, useAppKitAccount } from "@reown/appkit/vue";
import abi from "../abi/ColorsNFT.json";

// const { walletProvider } = useAppKitProvider("eip155:11155111");
const accountData = useAppKitAccount();
const address = computed(() => accountData.value?.address);
const isConnected = computed(() => accountData.value?.status === "connected");

const config = useRuntimeConfig();
// const projectId = config.public.projectId;
const contractAddress = config.public.contractAddress;

const color = ref("#000000");
const status = ref("");

async function mintNFT() {
  try {
    if (!window.ethereum) {
      status.value = "Please connect your wallet first";
      return;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    status.value = "Sending transaction...";
    const price = await contract.mintPrice();
    const tx = await contract.mint(color.value, {
      value: price, // mintPrice = 0.001 ether
    });
    await tx.wait();
    status.value = `NFT minted! Address: ${address.value}`;
  } catch (err) {
    console.error(err);
    status.value = "Error: " + (err.reason || err.message);
  }
}
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;
}
.mint-section {
  margin-top: 20px;
}
input[type="color"] {
  width: 100px;
  height: 50px;
  border: none;
  margin: 10px 0;
}
button {
  padding: 10px 20px;
  margin-top: 10px;
  cursor: pointer;
}
</style>
