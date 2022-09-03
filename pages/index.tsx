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
  async function createEvent(
    content: string,
    privkey: string,
    pubkey: string,
    tags: string[] = []
  ) {
    const unixTime = Math.floor(Date.now() / 1000);
    const data = [0, pubkey, unixTime, 1, [tags], content];

    // id is sha256 of data above
    // sig is schnorr sig of id
    const eventString = JSON.stringify(data);
    const eventByteArray = new TextEncoder().encode(eventString);
    const eventIdRaw = await secp.utils.sha256(eventByteArray);
    const eventId = secp.utils.bytesToHex(eventIdRaw);

    const signatureRaw = await secp.schnorr.sign(eventId, privkey);
    const signature = secp.utils.bytesToHex(signatureRaw);

    return {
      id: eventId,
      pubkey: pubkey,
      created_at: unixTime,
      kind: 1,
      tags: [tags],
      content: content,
      sig: signature,
    };
  }

  const [nostrPrivkey, setNostrPrivkey] = useState("");
  const [pubkeyHex, setPubkeyHex] = useState("");
  const [delegateId, setDelegateId] = useState("");

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

      setDelegateId(localStorage.getItem("delegateId")!);
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

      createEvent(
        JSON.stringify(delegateWithSig),
        nostrPrivkey,
        pubkeyHex
      ).then((event) => {
        localStorage.setItem("delegateId", event.id);
        localStorage.setItem("delegateEvent", JSON.stringify(event));
      });
    }
  }, [isSuccess]);

  async function createNostrEventWithDelegate() {
    const delegatedEvent = await createEvent(
      "Event made with Ethereum address",
      nostrPrivkey,
      pubkeyHex,
      ["delegateId", delegateId]
    );

    console.log(JSON.stringify(delegatedEvent));
  }

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
      <button onClick={() => createNostrEventWithDelegate()}>
        Create Nostr with delegate
      </button>
    </div>
  );
}
