// import type { NextPage } from "next";
// import Head from "next/head";
// import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSignMessage } from "wagmi";
import { useState, useEffect } from "react";
import * as secp from "@noble/secp256k1";

interface EventInterface {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: [];
  content: string;
  sig: string;
}

export default function Home() {
  const [nostrPrivkey, setNostrPrivkey] = useState("");

  useEffect(() => {
    const storagePrivkey = localStorage.getItem("nostrPrivkey");
    if (!storagePrivkey) {
      const privkey = secp.utils.randomPrivateKey();
      const privkeyHex = secp.utils.bytesToHex(privkey);
      console.log(privkeyHex);
      localStorage.setItem("nostrPrivkey", privkeyHex);
      setNostrPrivkey(nostrPrivkey);
    } else {
      setNostrPrivkey(storagePrivkey);
    }
  }, []);

  const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
    message: "gm wagmi frens",
  });

  return (
    <div>
      <ConnectButton></ConnectButton>
      <button disabled={isLoading} onClick={() => signMessage()}>
        Sign message
      </button>
      {isSuccess && <div>Signature: {data}</div>}
      {isError && <div>Error signing message</div>}
      <button onClick={() => setNostrPrivkey("ofjwoefjfff")}>setschnorr</button>
      <p>{nostrPrivkey}</p>
    </div>
  );
}
