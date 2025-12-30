"use client";

import { useState } from "react";

async function polishWithApi(text: string) {
  const res = await fetch("/api/polish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const data = await res.json();
  return data.result;
}


export default function Home() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");




  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-semibold mb-4">
        Text Polisher
      </h1>

      <textarea
        className="w-full border rounded-md p-3 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-black"
        placeholder="Paste your text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        className="self-start px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
        onClick={async () => {
          try {
            setError("");
            setLoading(true);
            const result = await polishWithApi(text);
            setOutput(result);
          } catch {
            setError("Something went wrong. Try again.");
          } finally {
            setLoading(false);
          }
        }}
        disabled={!text.trim()}
      >
        {loading ? "Polishing..." : "Polish Text"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {output && (
        <div className="mt-6 border rounded-md p-3 bg-gray-50 relative">
          <button
            className="absolute top-2 right-2 text-sm underline"
            onClick={() => navigator.clipboard.writeText(output)}
          >
            Copy
          </button>
          {output}
        </div>
      )}
    </main>
  );
}
