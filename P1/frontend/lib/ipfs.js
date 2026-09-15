/**
 * IPFS Integration via Pinata
 *
 * Handles uploading encrypted files to IPFS and downloading them back.
 * Uses Pinata's REST API for pinning (no SDK dependency needed).
 *
 * IMPORTANT: Only ENCRYPTED data is uploaded. Raw medical files never touch IPFS.
 */

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";

/**
 * Upload an encrypted file blob to IPFS via Pinata.
 *
 * @param {Blob} encryptedBlob - The encrypted file data.
 * @param {string} fileName - Original file name (for Pinata metadata only).
 * @returns {Promise<{cid: string, size: number, timeTaken: number}>}
 */
export async function uploadToIPFS(encryptedBlob, fileName) {
  const startTime = performance.now();

  // If no Pinata JWT, use a mock/simulation mode for local development
  if (!PINATA_JWT) {
    console.warn("⚠️ No Pinata JWT configured. Using mock IPFS upload.");
    return mockIPFSUpload(encryptedBlob, fileName, startTime);
  }

  const formData = new FormData();
  formData.append("file", encryptedBlob, `encrypted_${fileName}`);

  // Add Pinata metadata
  const metadata = JSON.stringify({
    name: `encrypted_${fileName}`,
    keyvalues: {
      application: "healthcare-dapp",
      encrypted: "true",
      originalName: fileName,
      uploadedAt: new Date().toISOString(),
    },
  });
  formData.append("pinataMetadata", metadata);

  // Pin options
  const options = JSON.stringify({ cidVersion: 1 });
  formData.append("pinataOptions", options);

  try {
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const timeTaken = performance.now() - startTime;

    return {
      cid: data.IpfsHash,
      size: data.PinSize,
      timeTaken: timeTaken,
    };
  } catch (error) {
    console.error("IPFS upload error:", error);
    throw error;
  }
}

/**
 * Download an encrypted file from IPFS via Pinata Gateway.
 *
 * @param {string} cid - The IPFS CID (Content Identifier).
 * @returns {Promise<{data: ArrayBuffer, timeTaken: number}>}
 */
export async function downloadFromIPFS(cid) {
  const startTime = performance.now();

  // Check for mock CIDs
  if (cid.startsWith("Qm_mock_") || cid.startsWith("baf_mock_")) {
    return mockIPFSDownload(cid, startTime);
  }

  try {
    const url = `https://${PINATA_GATEWAY}/ipfs/${cid}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`IPFS download failed: ${response.status}`);
    }

    const data = await response.arrayBuffer();
    const timeTaken = performance.now() - startTime;

    return {
      data: data,
      size: data.byteLength,
      timeTaken: timeTaken,
    };
  } catch (error) {
    console.error("IPFS download error:", error);
    throw error;
  }
}

// ─── Mock Functions for Local Development ───────────────────────────

// In-memory store for mock IPFS files (development only)
const mockStorage = new Map();

function mockIPFSUpload(encryptedBlob, fileName, startTime) {
  return new Promise((resolve) => {
    // Simulate network latency (100-500ms)
    const delay = 100 + Math.random() * 400;
    setTimeout(async () => {
      const data = await encryptedBlob.arrayBuffer();
      const hashArray = new Uint8Array(data.slice(0, 32));
      const hashHex = Array.from(hashArray)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const cid = `Qm_mock_${hashHex.slice(0, 32)}`;

      // Store in memory for later retrieval
      mockStorage.set(cid, new Uint8Array(data));

      // Store in localStorage to persist across page refreshes
      try {
        const dataUrl = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.onerror = rej;
          reader.readAsDataURL(encryptedBlob);
        });
        localStorage.setItem(cid, dataUrl);
      } catch (e) {
        console.warn("localStorage quota exceeded or unavailable");
      }

      resolve({
        cid: cid,
        size: data.byteLength,
        timeTaken: performance.now() - startTime,
      });
    }, delay);
  });
}

function mockIPFSDownload(cid, startTime) {
  return new Promise((resolve, reject) => {
    const delay = 50 + Math.random() * 200;
    setTimeout(async () => {
      let data = mockStorage.get(cid);
      
      // Try falling back to localStorage if not in memory
      if (!data) {
        try {
          const dataUrl = localStorage.getItem(cid);
          if (dataUrl) {
             const response = await fetch(dataUrl);
             const arrayBuffer = await response.arrayBuffer();
             data = new Uint8Array(arrayBuffer);
             mockStorage.set(cid, data);
          }
        } catch (e) {
          console.warn("Failed to retrieve from localStorage", e);
        }
      }

      if (!data) {
        reject(new Error(`Mock IPFS: CID not found: ${cid}`));
        return;
      }

      resolve({
        data: data.buffer,
        size: data.byteLength,
        timeTaken: performance.now() - startTime,
      });
    }, delay);
  });
}

/**
 * Check if running in mock IPFS mode.
 * @returns {boolean}
 */
export function isUsingMockIPFS() {
  return !PINATA_JWT;
}
