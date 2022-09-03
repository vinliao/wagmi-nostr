import useSWR from "swr";
import { format } from "timeago.js";

export default function List() {
  const fetcher = (url: string) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN}`,
      },
    }).then((res) => res.json());

  const {
    data,
    error,
  } = useSWR(
    `${process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL}/lrange/wagmi_nostr/0/-1`,
    fetcher, {refreshInterval: 1000}
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
          className="w-6 h-6 text-slate-900 animate-spin"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
        </svg>
      </div>
    );

  // render data
  return (
    <div className="w-full">
      {data.result.map((event: any) => {
        try {
          const rawEvent = window.atob(event);
          const jsonEvent = JSON.parse(rawEvent);
          return (
            <div key={jsonEvent.id}>
              <div className="flex justify-between">
                <span className="text-slate-800 font-semibold">
                  {jsonEvent.pubkey.slice(0, 5) +
                    "..." +
                    jsonEvent.pubkey.slice(-5)}
                </span>
                <span className="text-slate-400">
                  {format(jsonEvent.created_at * 1000)}
                </span>
              </div>
              <p className="break-words text-slate-500 mb-1">
                {jsonEvent.content}
              </p>
              <div className="py-2 text-center text-slate-400">···</div>
            </div>
          );
        } catch {
          console.log("a broken event");
        }
      })}
    </div>
  );
}
