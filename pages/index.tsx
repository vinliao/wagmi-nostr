import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSignMessage, useAccount } from "wagmi";
import { useState, useEffect } from "react";
import List from "../components/List";
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
  const [text, setText] = useState("");

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
    const delegatedEvent = await createEvent(text, nostrPrivkey, pubkeyHex, [
      "delegateId",
      delegateId,
    ]);

    console.log(JSON.stringify(delegatedEvent));
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL
      }/lpush/wagmi_nostr/${JSON.stringify(delegatedEvent)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN}`,
        },
      }
    );
    console.log(response)
  }

  return (
    <div className="flex flex-col items-center mx-auto max-w-md py-3">
      <div className="mb-10">
        <ConnectButton></ConnectButton>
      </div>
      <div className="flex w-full mb-10">
        <input
          placeholder="Type something..."
          type="text"
          className="flex-1 focus:outline-none pr-5"
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={() => createNostrEventWithDelegate()}
          className="bg-neutral-900 text-neutral-50 py-1.5 px-3 rounded-xl drop-shadow-xl focus:outline-none hover:scale-105 transition"
        >
          send
        </button>
      </div>
      <List />
    </div>
  );
}
