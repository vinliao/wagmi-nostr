// import type { NextPage } from "next";
// import Head from "next/head";
// import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSignMessage, useAccount } from "wagmi";
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
  // idea: also store delegation event to localStorage
  //   let pubkeyHex: string;
  // let nostrPrivkey: string;
  const [nostrPrivkey, setNostrPrivkey] = useState("");
  const [pubkeyHex, setPubkeyHex] = useState("");

  let ethAddress: string | undefined;
  const { address } = useAccount();
  ethAddress = address;

  const delegateMessage = JSON.stringify({
    authority: `${ethAddress}`,
    schnorrDelegate: `${pubkeyHex}`,
  });

  const { data, isError, isLoading, isSuccess, signMessage } = useSignMessage({
    message: delegateMessage,
  });

  // on render
  useEffect(() => {
    const storagePrivkey = localStorage.getItem("nostrPrivkey");
    if (!storagePrivkey) {
      const privkey = secp.utils.randomPrivateKey();
      const privkeyHex = secp.utils.bytesToHex(privkey);
      setNostrPrivkey(privkeyHex);
      const pubkey = secp.schnorr.getPublicKey(privkeyHex);
      setPubkeyHex(secp.utils.bytesToHex(pubkey));
    } else {
      setNostrPrivkey(storagePrivkey);
      const pubkey = secp.schnorr.getPublicKey(storagePrivkey);
      setPubkeyHex(secp.utils.bytesToHex(pubkey));
    }
  }, []);

  // on sig success
  useEffect(() => {
    if (isSuccess) {
      const delegateJSON = JSON.parse(delegateMessage);
      const delegateWithSig = { delegate: delegateJSON, sig: data };

      console.log(JSON.stringify(delegateWithSig));
      console.log(nostrPrivkey);
      localStorage.setItem("nostrPrivkey", nostrPrivkey);
      localStorage.setItem(
        "nostrDelegateEvent",
        JSON.stringify(delegateWithSig)
      );
      // store event and privkey to localStorage
      // stringify this, wrap it in NIP-01
    }
  }, [isSuccess]);

  return (
    <div>
      <ConnectButton></ConnectButton>
      <button disabled={isLoading} onClick={() => signMessage()}>
        Sign message
      </button>
      {isSuccess && <div>Signature: {data}</div>}
      {isError && <div>Error signing message</div>}
      <p>{`priv: ${nostrPrivkey}`}</p>
      <p>{`pub: ${pubkeyHex}`}</p>
    </div>
  );
}
