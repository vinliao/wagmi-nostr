import useSWR from "swr";
import { format } from "timeago.js";

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

  if (error) return <div className="text-red-600">loading event failed!</div>;
  if (!data)
    return (
      <div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-neutral-900 animate-spin"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
        </svg>
      </div>
    );

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
                <span className="text-neutral-800 font-semibold">
                  {jsonEvent.pubkey.slice(0, 5) +
                    "..." +
                    jsonEvent.pubkey.slice(-5)}
                </span>
                {/* <span className="text-stone-400">{format(time * 1000)}</span> */}
                <span className="text-neutral-400">
                  {format(jsonEvent.created_at * 1000)}
                </span>
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
