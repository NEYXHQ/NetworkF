/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IProvider } from "@web3auth/base";
import { ethers } from "ethers";
import config from "../config/env";

// Dont forget the Web3AuthContext change

// ERC20 ABI for balance
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

const getChainId = async (provider: IProvider): Promise<any> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider);
    // Get the connected Chain's ID
    const networkDetails = await ethersProvider.getNetwork();
    console.log(`Net Details : \n ${networkDetails}`);
    return networkDetails.chainId.toString();
  } catch (error) {
    return error;
  }
}

const getAccounts = async (provider: IProvider): Promise<any> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();

    // Get user's Ethereum public address
    const address = signer.getAddress();

    return await address;
  } catch (error) {
    return error;
  }
}

const getBalance = async (provider: IProvider): Promise<string> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();

    // Get user's Ethereum public address
    const address = signer.getAddress();

    // Get user's balance in ether
    const balance = ethers.formatEther(
      await ethersProvider.getBalance(address) // Balance is in wei
    );

    return balance;
  } catch (error) {
    return error as string;
  }
}

const sendTransaction = async (provider: IProvider, recipient: string, amount: string): Promise<any> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();

    const parsedAmount = ethers.parseEther(amount);
    const fees = await ethersProvider.getFeeData()

    // Submit transaction to the blockchain
    const tx = await signer.sendTransaction({
      to: recipient,
      value: parsedAmount,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas, // Max priority fee per gas
      maxFeePerGas: fees.maxFeePerGas, // Max fee per gas
    });

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    return receipt;
  } catch (error) {
    return error as string;
  }
}

const sendToken = async (provider: IProvider, recipient: string, amount: string): Promise<any> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    const contract = new ethers.Contract(config.wfounderContractAddress, ERC20_ABI, signer);

    const decimals = 18; // Adjust based on WFOUNDER token decimals
    const parsedAmount = ethers.parseUnits(amount, decimals);

    const tx = await contract.transfer(recipient, parsedAmount);
    return await tx.wait();
  } catch (error) {
    throw new Error(error as string);
  }
};

const signMessage = async (provider: IProvider): Promise<any> => {
  try {
    // For ethers v5
    // const ethersProvider = new ethers.providers.Web3Provider(provider);
    const ethersProvider = new ethers.BrowserProvider(provider);

    // For ethers v5
    // const signer = ethersProvider.getSigner();
    const signer = await ethersProvider.getSigner();
    const originalMessage = "YOUR_MESSAGE";

    // Sign the message
    const signedMessage = await signer.signMessage(originalMessage);

    return signedMessage;
  } catch (error) {
    return error as string;
  }
}

// ✅ Get Native Token Balance (ETH, POL, etc.)
const getNetworkBalance = async (provider: IProvider): Promise<string> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const address = await getAccounts(provider);
    const balance = await ethersProvider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    return `Error: ${error}`;
  }
};

// ✅ Get WFOUNDER Token Balance (ERC-20)
const getWFOUNDERBalance = async (provider: IProvider): Promise<string> => {
  try {

    const ethersProvider = new ethers.BrowserProvider(provider);
    const address = await getAccounts(provider);

    const contract = new ethers.Contract(config.wfounderContractAddress, ERC20_ABI, ethersProvider);
    const balance = await contract.balanceOf(address);

    console.log(`balance = ${ethers.formatUnits(balance, 18)} for WFOUNDER contract ${config.wfounderContractAddress}`)

    return ethers.formatUnits(balance, 18); // Adjust decimals based on token config
  } catch (error) {
    return `Error: ${error}`;
  }
};

// ✅ Generic ERC20 Token Balance
const getERC20Balance = async (provider: IProvider, contractAddress: string, decimals: number): Promise<string> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const address = await getAccounts(provider);

    const contract = new ethers.Contract(contractAddress, ERC20_ABI, ethersProvider);
    const balance = await contract.balanceOf(address);

    console.log(`balance = ${ethers.formatUnits(balance, decimals)} for contract ${contractAddress}`)

    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    return `Error: ${error}`;
  }
};

// ✅ Get USDC Token Balance (ERC-20)
const getUSDCBalance = async (provider: IProvider): Promise<string> => {
  try {
    return await getERC20Balance(provider, config.buyFlow.contracts.usdc, 6); // USDC has 6 decimals
  } catch (error) {
    return `Error: ${error}`;
  }
};

// ✅ Get wETH Token Balance (ERC-20)
const getWETHBalance = async (provider: IProvider): Promise<string> => {
  try {
    return await getERC20Balance(provider, config.buyFlow.contracts.weth, 18); // wETH has 18 decimals
  } catch (error) {
    return `Error: ${error}`;
  }
};

const ensureApproval = async (
  signer: ethers.JsonRpcSigner,
  userAddress: string,
  spenderAddress: string,
  amount: bigint
): Promise<boolean> => {
  try {
    const wFOUNDERContract = new ethers.Contract(config.wfounderContractAddress, ERC20_ABI, signer);

    const currentAllowance = await wFOUNDERContract.allowance(userAddress, spenderAddress);
    console.log("💰 Current allowance:", currentAllowance.toString());

    if (currentAllowance >= amount) {
      return true; // already approved
    }

    console.log("🛂 Not enough allowance. Requesting approval...");

    const tx = await wFOUNDERContract.approve(spenderAddress, amount * 10n);
    console.log("⏳ Waiting for approval tx...");

    await tx.wait();

    console.log("✅ Approval successful.");
    return true;
  } catch (err: any) {
    console.error("❌ User rejected the approval or tx failed:", err.message || err);
    return false;
  }
};


export default {
  getChainId,
  getAccounts,
  getBalance,
  getNetworkBalance,
  getWFOUNDERBalance,
  getERC20Balance,
  getUSDCBalance,
  getWETHBalance,
  sendTransaction,
  sendToken,
  signMessage,
  ensureApproval,
};

// export default {getChainId, getAccounts, getBalance, sendTransaction, signMessage};