import { ExternalProvider } from "@ethersproject/providers";

export const getProvider = () => {
  if (!window.ethereum) {
    throw new Error("No ethereum provider found");
  }

  const ethProvider = Object.assign({}, window.ethereum) as ExternalProvider;
  return ethProvider;
};
