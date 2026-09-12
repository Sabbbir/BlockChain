import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "../contexts/Web3Context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "MedChain — Blockchain Healthcare Records",
  description:
    "A decentralized application for secure, patient-controlled medical record sharing using blockchain, IPFS, and AES-256 encryption.",
  keywords: "blockchain, healthcare, medical records, DApp, IPFS, encryption",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
