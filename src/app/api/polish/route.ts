import { NextResponse } from "next/server";

function basicPolish(input: string) {
    let text = input.trim();
    text = text.replace(/\s+/g, " ");
    text = text.replace(/\s+([.,!?])/g, "$1");
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!/[.!?]$/.test(text)) text += ".";
    return text;
}

function systemPromptByMode(mode: string, tone: string) {
    switch (mode) {
        case "rewrite":
            return `
Rewrite the text to correct grammar and improve clarity.
Preserve the original meaning, intent, and sentence type exactly.
Do NOT change a question into a statement or vice versa.
Do NOT ask for additional information.
Do NOT add new context, time references, or details.
If honorifics like "sir" are present, preserve them.
Avoid stacking politeness phrases.
Allow small wording changes only if required to match the selected tone.
Use a ${tone} tone.
Output ONLY the rewritten text.
`;
        case "resume":
            return "Rewrite the text as a single strong resume bullet. Use an action verb. Be concise. Output ONLY the final sentence.";

        case "linkedin":
            return "Rewrite the text for LinkedIn. Professional and confident tone. One short paragraph. Output ONLY the final text.";

        case "email":
            return "Rewrite the text as a short, clear, professional cold email. Polite and confident. Output ONLY the email body.";

        default:
            return `
Rewrite the text into a clear AI prompt.
Preserve ALL context, names, audience, platform, and intent.
Do NOT generalize, oversimplify, or add creativity.
Output ONLY the final rewritten prompt.
`;
    }
}




export async function POST(req: Request) {
    try {
        const body = await req.json();
        const text = body.text;
        const mode = body.mode || "prompt";
        const tone = body.tone || "neutral";

        if (!text || !text.trim()) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        if (text.length > 1000) {
            return NextResponse.json({ error: "Text too long" }, { status: 400 });
        }

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "system",
                            content: systemPromptByMode(mode, tone),
                        },
                        { role: "user", content: text },
                    ],
                    temperature: 0.3,
                    max_tokens: 150,
                }),
            }
        );

        if (!response.ok) {
            const err = await response.text();
            console.error("Groq error:", err);
            return NextResponse.json(
                { error: "AI service error" },
                { status: 500 }
            );
        }

        const data = await response.json();
        const result =
            data?.choices?.[0]?.message?.content || basicPolish(text);

        return NextResponse.json({ result });
    } catch (err) {
        console.error("Server error:", err);
        return NextResponse.json(
            { error: "AI processing failed" },
            { status: 500 }
        );
    }
}
