// import { NextResponse } from "next/server";

// function basicPolish(input: string) {
//     let text = input.trim();
//     text = text.replace(/\s+/g, " ");
//     text = text.replace(/\s+([.,!?])/g, "$1");
//     text = text.charAt(0).toUpperCase() + text.slice(1);
//     if (!/[.!?]$/.test(text)) text += ".";
//     return text;
// }

// function systemPromptByMode(mode: string, tone: string) {
//     switch (mode) {
//         case "rewrite":
//             return `
// You are a text improvement assistant.

// Rules (STRICT):
// - Fix grammar, spelling, and clarity ONLY.
// - Keep the EXACT meaning and structure.
// - Do NOT rephrase or rewrite the sentence.
// - Do NOT add new words unless fixing errors.
// - Do NOT change the sentence structure.
// - Use a ${tone} tone only for word choice adjustments.

// Input: "create today's Status"
// Output: "Create today's status."

// Input: "the report need to be done by friday"
// Output: "The report needs to be done by Friday."

// Output ONLY the corrected text with NO explanations.
// `;
//         case "resume":
//             return "Rewrite the text as a single strong resume bullet. Use an action verb. Be concise. Output ONLY the final sentence.";

//         case "linkedin":
//             return "Rewrite the text for LinkedIn. Professional and confident tone. One short paragraph. Output ONLY the final text.";

//         case "email":
//             return "Rewrite the text as a short, clear, professional cold email. Polite and confident. Output ONLY the email body.";

//         default:
//             return `
// You are a prompt clarity assistant.

// Rules (STRICT):
// - Make the prompt clearer and more actionable for an AI.
// - Keep the CORE intent exactly the same.
// - Do NOT add details that weren't implied.
// - Do NOT assume context (dates, subjects, etc.).
// - Only improve clarity, grammar, and structure.
// - If already clear, make minimal changes.

// Examples:
// Input: "create today's Status"
// Output: "Create a status update for today."

// Input: "write email about meeting"
// Output: "Write an email about the meeting."

// Input: "explain how to cook pasta"
// Output: "Explain how to cook pasta." (already clear)

// Output ONLY the improved prompt with NO explanations.
// `;
//     }
// }




// export async function POST(req: Request) {
//     try {
//         const body = await req.json();
//         const text = body.text;
//         const mode = body.mode || "prompt";
//         const tone = body.tone || "neutral";

//         if (!text || !text.trim()) {
//             return NextResponse.json({ error: "Text is required" }, { status: 400 });
//         }

//         if (text.length > 1000) {
//             return NextResponse.json({ error: "Text too long" }, { status: 400 });
//         }

//         const response = await fetch(
//             "https://api.groq.com/openai/v1/chat/completions",
//             {
//                 method: "POST",
//                 headers: {
//                     Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({
//                     model: "llama-3.1-8b-instant",
//                     messages: [
//                         {
//                             role: "system",
//                             content: systemPromptByMode(mode, tone),
//                         },
//                         { role: "user", content: text },
//                     ],
//                     temperature: 0.3,
//                     max_tokens: 150,
//                 }),
//             }
//         );

//         if (!response.ok) {
//             const err = await response.text();
//             console.error("Groq error:", err);
//             return NextResponse.json(
//                 { error: "AI service error" },
//                 { status: 500 }
//             );
//         }

//         const data = await response.json();
//         const result =
//             data?.choices?.[0]?.message?.content || basicPolish(text);

//         return NextResponse.json({ result });
//     } catch (err) {
//         console.error("Server error:", err);
//         return NextResponse.json(
//             { error: "AI processing failed" },
//             { status: 500 }
//         );
//     }
// }


import { NextResponse } from "next/server";

/**
 * Fallback basic polish (used only if LanguageTool fails)
 */
function basicPolish(input: string) {
    let text = input.trim();
    text = text.replace(/\s+/g, " ");
    text = text.replace(/\s+([.,!?])/g, "$1");
    text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!/[.!?]$/.test(text)) text += ".";
    return text;
}

/**
 * AI prompts for NON-rewrite modes only
 */
function systemPromptByMode(mode: string) {
    switch (mode) {
        case "resume":
            return `
Rewrite the text as a single strong resume bullet.
- Start with an action verb
- Be concise and professional
- Do NOT add explanations
Output ONLY the final sentence.
`;

        case "linkedin":
            return `
Rewrite the text for LinkedIn.
- Professional and confident tone
- One short paragraph
- No emojis
Output ONLY the final text.
`;

        case "email":
            return `
Rewrite the text as a clear, professional email.
- Polite and confident
- No subject line
- No explanations
Output ONLY the email body.
`;

        default: // prompt
            return `
You are a prompt clarity assistant.

Rules (STRICT):
- Rewrite the input into a clear AI instruction
- Preserve intent exactly
- Do NOT add assumptions, dates, or context
- Do NOT explain
- If already clear, make minimal changes

Output ONLY the improved prompt.
`;
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const text: string = body.text;
        const mode: string = body.mode || "prompt";

        if (!text || !text.trim()) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        if (text.length > 1000) {
            return NextResponse.json({ error: "Text too long" }, { status: 400 });
        }

        /**
         * =========================
         * REWRITE MODE (RULE-BASED)
         * =========================
         */
        if (mode === "rewrite") {
            try {
                const ltRes = await fetch("https://api.languagetool.org/v2/check", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        text,
                        language: "en-US",
                    }),
                });

                const ltData = await ltRes.json();
                let corrected = text;

                // Apply replacements safely from end to start
                ltData.matches
                    .sort((a: any, b: any) => b.offset - a.offset)
                    .forEach((m: any) => {
                        if (m.replacements?.length) {
                            corrected =
                                corrected.slice(0, m.offset) +
                                m.replacements[0].value +
                                corrected.slice(m.offset + m.length);
                        }
                    });

                return NextResponse.json({ result: corrected });
            } catch (e) {
                // Deterministic fallback
                return NextResponse.json({ result: basicPolish(text) });
            }
        }

        /**
         * =========================
         * AI MODES (GROQ)
         * =========================
         */
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
                            content: systemPromptByMode(mode),
                        },
                        {
                            role: "user",
                            content: text,
                        },
                    ],
                    temperature: 0.3,
                    max_tokens: 200,
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
