"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");

  function polishText(input: string) {
    let text = input.trim();

    // remove extra spaces
    text = text.replace(/\s+/g, " ");

    // fix space before punctuation
    text = text.replace(/\s+([.,!?])/g, "$1");

    // capitalize first letter
    text = text.charAt(0).toUpperCase() + text.slice(1);

    // ensure sentence ends properly
    if (!/[.!?]$/.test(text)) {
      text += ".";
    }

    return text;
  }


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
        onClick={() => setOutput(polishText(text))}
        disabled={!text.trim()}
      >
        Polish Text
      </button>

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
