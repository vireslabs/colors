<template>
  <client-only>
    <div class="relative min-h-screen overflow-hidden">
      <div
        class="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,_#ff0607,_#ff8c00,_#ffff00,_#00ff00,_#00cfff,_#0000ff,_#8a2be2,_#ed84ed)] bg-[length:400%_400%] animate-gradient-chaos"
      ></div>
      <div
        class="flex md:flex-col justify-center items-center rounded-2xl bg-white/70 backdrop-blur-md border border-white/30 shadow-lg md:max-w-5xl md:w-fit mx-auto my-10 px-2 md:px-10"
      >
        <div class="my-6">
          <div class="flex flex-col md:flex-row justify-between mb-3">
            <h1
              class="text-3xl font-bold text-transparent bg-clip-text drop-shadow-xl text-shadow-md uppercase bg-[radial-gradient(circle_at_center,_#ff0607,_#ff8c00,_#ffff00,_#00ff00,_#00cfff,_#0000ff,_#8a2be2,_#ed84ed)]"
            >
              Monad Colors
            </h1>
            <!-- Connect button -->
            <appkit-button v-if="isConnected" label="Connect Wallet" />
          </div>
          <div class="border-double border-l-2 p-2 my-2 bg-white/30">
            The 1/1 collection for every color on the internet.
          </div>
          <!-- 🎨 Color Picker -->
          <div class="flex flex-col items-center gap-4">
            <div class="relative">
              <div class="w-full md:w-[500px]">
                <canvas
                  width="500"
                  height="300"
                  ref="paletteRef"
                  class="rounded-lg cursor-crosshair w-full h-auto"
                  @mousedown="onMouseDown"
                />
              </div>

              <!-- 🔘 Marker -->
              <div
                class="absolute w-4 h-4 rounded-full border-2 border-white shadow"
                :style="{
                  left: marker.x - 8 + 'px',
                  top: marker.y - 8 + 'px',
                  backgroundColor: color,
                }"
              ></div>
            </div>
          </div>

          <!-- 🪙 Mint Controls -->
          <div
            class="flex flex-col md:flex-row justify-between my-3 place-content-around"
          >
            <div
              class="flex justify-center place-items-center my-auto w-full md:w-40 h-10 font-semibold border rounded-sm shadow-xl bg-white"
            >
              {{ color }}
            </div>

            <button
              @click="pickRandomColor"
              class="flex justify-center place-items-center my-2 md:y-auto text-xl w-full md:w-10 h-10 rounded-sm border hover:bg-gray-100 cursor-pointer shadow-xl bg-white/80"
            >
              🖼️
            </button>

            <button
              @click="pickRandomColor"
              class="flex justify-center place-items-center my-2 md:y-auto text-xl w-full md:w-10 h-10 rounded-sm border hover:bg-gray-100 cursor-pointer shadow-xl bg-white/80"
            >
              🤪
            </button>

            <!-- Connect button -->
            <button
              v-if="!isConnected"
              class="px-10 py-2 font-bold rounded-sm border my-2 md:my-auto hover:bg-gray-100 cursor-pointer shadow-xl bg-white/80"
              @click="openConnectModal"
            >
              Connect Wallet
            </button>

            <!-- Mint button -->
            <button
              v-if="isConnected"
              class="flex justify-center place-items-center my-2 md:y-auto w-full md:w-60 h-10 font-semibold border rounded-sm hover:bg-gray-100 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-xl bg-white/80"
              :disabled="
                !isConnected || isMinting || availability !== '✅ Available'
              "
              @click="mintNFT"
            >
              {{ isMinting ? "Minting..." : "Buy for 100 MON" }}
            </button>
          </div>

          <div v-if="status" class="flex flex-col text-center justify-center font-semibold my-3">
            <p>{{ status }}</p>
            <a v-if="txUrl" :href="txUrl" target="_blank" class="text-accent underline">
              View on Explorer
            </a>
          </div>

          <div
            v-if="availability !== '✅ Available'"
            class="flex justify-center font-semibold"
            :class="
              availability === '✅ Available'
                ? 'text-green-600'
                : 'text-red-600'
            "
          >
            <div v-if="ownerNFT" class="mx-1 mb-3">
              {{ availability }}
              {{
                ownerNFT.slice(0, 6) +
                "..." +
                ownerNFT.slice(ownerNFT.length - 6, ownerNFT.length)
              }}
            </div>
          </div>
          <!-- 🖼 Preview square -->
          <div
            class="w-full h-40 md:w-[500px] md:h-[500px] rounded-xl shadow-lg border border-gray-200"
            :style="{ backgroundColor: color }"
          />
        </div>
      </div>
    </div>
  </client-only>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { BrowserProvider, Contract } from "ethers";
import { useAppKitAccount, useAppKit } from "@reown/appkit/vue";
const abi = ref(null);

// 🔌 Account info
const account = useAppKitAccount("eip155:11155111");
const isConnected = computed(() => account.value?.status === "connected");
const address = computed(() => account.value?.address);

// 🔧 Config
const config = useRuntimeConfig();
const contractAddress = config.public.contractAddress;

// 🎨 Color Picker state
const color = ref("#836EF9");
const marker = ref({ x: 150, y: 150 });
const isDragging = ref(false);
const paletteRef = ref(null);

// Availability state
const availability = ref(""); // "✅ Available" | "❌ Taken"

// Owner state
const ownerNFT = ref("");

// Mint state
const status = ref("");
const txUrl = ref("");
const isMinting = ref(false);

function updateColor(canvas, x, y) {
  const ctx = canvas.getContext("2d");
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  color.value = `#${[...pixel]
    .slice(0, 3)
    .map(c => c.toString(16).padStart(2, "0"))
    .join("")}`;
  marker.value = { x, y };
  status.value = "";
}

function pickRandomColor() {
  const canvas = paletteRef.value;
  if (!canvas) return;
  const randomX = Math.floor(Math.random() * canvas.width);
  const randomY = Math.floor(Math.random() * canvas.height);
  updateColor(canvas, randomX, randomY);
}

function onMouseDown(e) {
  isDragging.value = true;
  moveMarker(e);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(e) {
  if (!isDragging.value) return;
  moveMarker(e);
}

function onMouseUp() {
  isDragging.value = false;
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
}

function moveMarker(e) {
  const canvas = paletteRef.value;
  const rect = canvas.getBoundingClientRect();
  const x = Math.min(
    Math.max(Math.floor(e.clientX - rect.left), 0),
    canvas.width - 1
  );
  const y = Math.min(
    Math.max(Math.floor(e.clientY - rect.top), 0),
    canvas.height - 1
  );
  updateColor(canvas, x, y);
}

const openConnectModal = () => {
  const { open } = useAppKit();
  open({ view: "Connect" });
};

onMounted(async () => {
  await nextTick();

  const res = await fetch("/abi/colorsNFT.json");
  const artifact = await res.json();
  abi.value = artifact.abi || artifact;

  const canvas = paletteRef.value;
  if (!canvas) {
    console.error("❌ Canvas still not found");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("❌ 2D context not available");
    return;
  }

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "red");
  gradient.addColorStop(0.17, "orange");
  gradient.addColorStop(0.34, "yellow");
  gradient.addColorStop(0.51, "green");
  gradient.addColorStop(0.68, "blue");
  gradient.addColorStop(0.85, "indigo");
  gradient.addColorStop(1, "violet");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const whiteGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  whiteGradient.addColorStop(0, "rgba(255,255,255,1)");
  whiteGradient.addColorStop(0.5, "rgba(255,255,255,0)");
  whiteGradient.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = whiteGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});

watch(color, async newColor => {
  if (!window.ethereum) return;
  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new Contract(contractAddress, abi.value, signer);

    const taken = await contract.isColorTaken(newColor);
    if (taken) {
      const owner = await contract.ownerOfColor(newColor);
      availability.value = `❌ Taken by`;
      ownerNFT.value = owner;
    } else {
      availability.value = "✅ Available";
    }
  } catch (err) {
    console.error("Error checking color:", err);
    availability.value = "⚠️ Error";
  }
});

// 🪙 Mint logic
async function mintNFT() {
  try {
    if (!window.ethereum) {
      status.value = "Please connect your wallet first";
      return;
    }

    if (availability.value !== "✅ Available") {
      status.value = "This color is not available ❌";
      return;
    }

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new Contract(contractAddress, abi.value, signer);

    status.value = "Sending transaction...";
    isMinting.value = true;

    const price = await contract.mintPrice();
    const tx = await contract.mint(color.value, { value: price });
    await tx.wait();

    // status.value = `✅ NFT minted! Your address: ${address.value}`;
    status.value = `✅ NFT minted!`;
    txUrl.value = 'https://opensea.io/collection/colorsnft-323190310'
  } catch (err) {
    console.error(err);
    status.value = "Error: " + (err.reason || err.message);
  } finally {
    isMinting.value = false;
  }
}
</script>
