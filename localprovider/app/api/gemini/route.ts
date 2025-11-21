// // app/api/gemini/route.ts
// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { callGeminiAnalyze, callGeminiChat } from '../../services/[id]/geminiService'; // implement server-side functions

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     if (body.action === 'analyze') {
//       const result = await callGeminiAnalyze(body.text); // server-only function that uses secret
//       return NextResponse.json(result);
//     } else if (body.action === 'chat') {
//       const result = await callGeminiChat(body.history || [], body.message || '');
//       return NextResponse.json(result);
//     } else {
//       return NextResponse.json({ error: 'invalid action' }, { status: 400 });
//     }
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: 'internal' }, { status: 500 });
//   }
// }
