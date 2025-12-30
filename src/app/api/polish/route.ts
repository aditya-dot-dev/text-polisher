import { NextResponse } from "next/server";

function basicPolish(input: string) {
    let text = input.trim();
    text = text.replace(/\s+/g, " ");
    text = text.replace(/\s+([.,!?])/g, "$1");
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!/[.!?]$/.test(text)) text += ".";
    return text;
}


export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text || !text.trim()) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        if (text.length > 1000) {
            return NextResponse.json(
                { error: "Text too long" },
                { status: 400 }
            );
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
                            content:
                                "You polish text. Make it clear, clean, and professional. Do not change meaning.",
                        },
                        { role: "user", content: text },
                    ],
                    temperature: 0.3,
                    max_tokens: 150,
                }),
            }
        );


        const data = await response.json();
        const result =
            data?.choices?.[0]?.message?.content || basicPolish(text);


        return NextResponse.json({ result });
    } catch (e) {
        return NextResponse.json(
            { error: "AI processing failed" },
            { status: 500 }
        );
    }
}
