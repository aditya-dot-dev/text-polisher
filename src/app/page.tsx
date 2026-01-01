"use client";

import { useState } from "react";

async function polishWithApi(text: string, mode: string, tone: string) {
  const res = await fetch("/api/polish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode, tone }),
  });

  const data = await res.json();
  return data.result;
}

function modeHint(mode: string) {
  switch (mode) {
    case "prompt":
      return "Get clearer prompts for better AI responses.";
    case "resume":
      return "Turn rough lines into strong resume bullets.";
    case "linkedin":
      return "Make LinkedIn text sound professional and confident.";
    case "email":
      return "Rewrite emails to be clear, polite, and effective.";
    default:
      return "";
  }
}

function exampleByMode(mode: string) {
  switch (mode) {
    case "prompt":
      return "write product description for wireless headphones";
    case "resume":
      return "worked on website and improved performance";
    case "linkedin":
      return "i launched a new ecommerce website for electronics";
    case "email":
      return "want to discuss building a website for my business";
    default:
      return "";
  }
}


export default function Home() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);
  const [mode, setMode] = useState("rewrite");
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState("formal");


  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">
        Smart Text Polisher
      </h1>

      <p className="text-sm text-gray-600">
        Improve prompts, resumes, LinkedIn text, and emails — instantly.
      </p>

      <div className="flex gap-2 flex-wrap">
        {[
          { id: "rewrite", label: "Rewrite" },
          { id: "prompt", label: "Prompt" },
          { id: "resume", label: "Resume" },
          { id: "linkedin", label: "LinkedIn" },
          { id: "email", label: "Cold Email" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              if (m.id === "rewrite") setTone("formal");
            }}
            className={`px-3 py-1 rounded border text-sm ${mode === m.id ? "bg-black text-white" : ""
              }`}
          >
            {m.label}
          </button>
        ))}

      </div>
      {mode === "rewrite" && (
        <div className="flex gap-2 mb-2">
          {["casual", "formal", "polite"].map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`px-3 py-1 text-xs border rounded ${tone === t ? "bg-black text-white" : ""
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-600 mb-2">
        {modeHint(mode)}
      </p>


      <textarea
        className="w-full border rounded-md p-3 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-black"
        placeholder={
          mode === "rewrite"
            ? "Paste a sentence to rewrite..."
            : mode === "prompt"
              ? "Paste your AI prompt..."
              : mode === "resume"
                ? "Paste a resume bullet..."
                : mode === "linkedin"
                  ? "Paste LinkedIn text..."
                  : "Paste your email..."
        }

        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={() => setText(exampleByMode(mode))}
        className="text-xs underline text-gray-600"
      >
        Use example
      </button>


      <button
        className="self-start px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
        onClick={async () => {
          try {
            setError("");
            setLoading(true);
            const result = await polishWithApi(text, mode, tone);
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
        <div className="mt-6 rounded-lg border bg-gray-50 p-4 relative">
          <button
            onClick={() => {
              navigator.clipboard.writeText(output);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="absolute top-3 right-3 text-xs px-2 py-1 border rounded bg-white"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>

          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
            {output}
          </pre>
        </div>
      )}


      {output && (
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span>Was this helpful?</span>
          <button
            onClick={() => {
              setFeedback("yes");
              console.log("feedback: yes");
            }}
            className="px-2 py-1 border rounded"
          >
            👍
          </button>

          <button
            onClick={() => {
              setFeedback("no");
              console.log("feedback: no");
            }}
            className="px-2 py-1 border rounded"
          >
            👎
          </button>
          {feedback === "no" && (
            <p className="text-xs text-gray-600 mt-2">
              Tell us what went wrong (copy text + send feedback link).
            </p>
          )}


        </div>
      )}

    </main>
  );
}
