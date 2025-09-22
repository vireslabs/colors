<template>
  <client-only>
    <div class="max-w-5xl mx-auto mt-10 px-4 flex flex-col gap-6 items-center">
      <h1 class="text-3xl font-bold">ColorsNFT Mint</h1>

      <!-- Connect button -->
      <appkit-button label="Connect Wallet" />

      <div>
        <!-- 🎨 Color Picker -->
        <div class="flex flex-col items-center gap-4">
          <div class="relative">
            <canvas
              ref="paletteRef"
              width="300"
              height="300"
              class="rounded-lg cursor-crosshair"
              @mousedown="onMouseDown"
            />

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

          <p class="text-lg">
            Selected color: <span class="font-mono">{{ color }}</span>
          </p>
          <p
            v-if="availability"
            class="text-sm"
            :class="
              availability === '✅ Available'
                ? 'text-green-600'
                : 'text-red-600'
            "
          >
            {{ availability }}
          </p>
        </div>

        <!-- 🪙 Mint Controls + Preview -->
        <div class="flex flex-col gap-4 items-center">
          <button
            class="px-5 py-3 rounded-lg font-semibold text-white bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            :disabled="
              !isConnected || isMinting || availability !== '✅ Available'
            "
            @click="mintNFT"
          >
            {{ isMinting ? "Minting..." : "Mint NFT" }}
          </button>

          <p v-if="status" class="text-sm text-gray-600">{{ status }}</p>

          <!-- 🖼 Preview square -->
          <div
            class="w-[400px] h-[400px] rounded-xl shadow-lg border border-gray-200"
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
import { useAppKitAccount } from "@reown/appkit/vue";
import abi from "../abi/ColorsNFT.json";

// 🔌 Account info
const account = useAppKitAccount("eip155:11155111");
const isConnected = computed(() => account.value?.status === "connected");
const address = computed(() => account.value?.address);

// 🔧 Config
const config = useRuntimeConfig();
const contractAddress = config.public.contractAddress;

// 🎨 Color Picker state
const color = ref("#000000");
const marker = ref({ x: 150, y: 150 });
const isDragging = ref(false);
const paletteRef = ref(null);

// Availability state
const availability = ref(""); // "✅ Available" | "❌ Taken"

// Mint state
const status = ref("");
const isMinting = ref(false);

function updateColor(canvas, x, y) {
  const ctx = canvas.getContext("2d");
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  color.value = `#${[...pixel]
    .slice(0, 3)
    .map(c => c.toString(16).padStart(2, "0"))
    .join("")}`;
  marker.value = { x, y };
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

onMounted(async () => {
  await nextTick();
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

  console.log("✅ gradient drawn");
});

watch(color, async newColor => {
  if (!window.ethereum) return;
  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new Contract(contractAddress, abi, signer);

    await contract.callStatic.mint(newColor, {
      value: await contract.mintPrice(),
    });
    availability.value = "✅ Available";
  } catch {
    availability.value = "❌ Taken";
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
    const contract = new Contract(contractAddress, abi, signer);

    status.value = "Sending transaction...";
    isMinting.value = true;

    const price = await contract.mintPrice();
    const tx = await contract.mint(color.value, { value: price });
    await tx.wait();

    status.value = `✅ NFT minted! Your address: ${address.value}`;
  } catch (err) {
    console.error(err);
    status.value = "Error: " + (err.reason || err.message);
  } finally {
    isMinting.value = false;
  }
}
</script>
