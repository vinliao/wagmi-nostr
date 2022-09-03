import useSWR from "swr";

export default function List() {
  const fetcher = (url: string) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN}`,
      },
    }).then((res) => res.json());

  const { data, error } = useSWR(
    `${process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL}/lrange/wagmi_nostr/1/-1`,
    fetcher
  );

  if (error) return <div>failed to load</div>;
  if (!data) return <div>loading...</div>;

  console.log(data);
  // render data
  return (
    <div className="w-full">
      {data.result.map((event: any) => {
        try {
          const jsonEvent = JSON.parse(event);
          return (
            <div className="mb-5">
              <div className="flex justify-between">
                <span className="text-black font-semibold">
                  {jsonEvent.pubkey.slice(0, 5) +
                    "..." +
                    jsonEvent.pubkey.slice(-5)}
                </span>
                {/* <span className="text-stone-400">{format(time * 1000)}</span> */}
                <span className="text-neutral-400">somet ime</span>
              </div>
              <p className="break-words text-neutral-500 mb-1">
                {jsonEvent.content}
              </p>
            </div>
          );
        } catch {
          console.log("a broken event");
        }
      })}
    </div>
  );
}
