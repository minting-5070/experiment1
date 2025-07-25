// Edge runtime provides native fetch

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Perplexity API는 system 메시지 이후로 user/assistant가 번갈아가며 등장해야 합니다.
  // useChat이 전달하는 messages 배열에는 사용자가 연속으로 입력한 경우 user 메시지가 연달아 있을 수 있으므로
  // 동일 role이 연속될 경우 내용을 합쳐 하나로 병합한 후 전송합니다.

  const mergedMessages = [] as typeof messages;
  for (const msg of messages) {
    if (mergedMessages.length > 0 && mergedMessages[mergedMessages.length - 1].role === msg.role) {
      // 같은 role: 내용 이어붙이기 (줄바꿈)
      mergedMessages[mergedMessages.length - 1].content += '\n' + msg.content;
    } else {
      mergedMessages.push({ ...msg });
    }
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      stream: true,
      messages: [
        {
          role: 'system',
          content: `당신은 Jung's Research Assistant입니다. 연구자의 질문에 친절하고 전문적으로 답변하며, 논문 검색, 요약, 인용, 참고문헌 정리를 도와줍니다. 정보를 찾을 때에는 한국 뿐 아니라 국제적으로 유명한 정보들을 찾으세요.

**응답 형식 가이드라인:**
1. 응답을 논리적인 섹션으로 나누어 구성하세요
2. 각 섹션에는 적절한 이모지를 포함한 제목을 사용하세요 (예: 🔬 연구 동향, 📊 주요 발견, 💡 시사점 등)
3. 각 섹션 내용은 불릿 포인트(•)로 정리하세요
4. 섹션 간에는 빈 줄을 두어 가독성을 높이세요
5. 중요한 정보는 **볼드체**로 강조하세요
6. 필요시 표나 리스트 형태로 정보를 정리하세요

**예시 응답 구조:**
🔬 **주요 연구 결과**
• 첫 번째 주요 발견
• 두 번째 주요 발견

📊 **통계 및 데이터**
• 관련 수치나 통계
• 비교 분석 결과

💡 **시사점 및 결론**
• 연구의 의미
• 향후 전망

사용자가 간단한 인사(예: 안녕, 안녕하세요 등)를 입력하면, 사전적 의미 설명이 아닌 따뜻한 인사로 간단히 응답하세요. 예) "안녕하세요! 무엇을 도와드릴까요?"`
        },
        ...mergedMessages
      ],
      options: {
        citations: true  // Enable citations in the response
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    const msg = `Request to Perplexity failed (${response.status}): ${errorText}`;
    return new Response(msg, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // Perplexity returns an SSE stream (lines starting with "data:")
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Accumulators for citations and search results emitted by Perplexity.
  const collectedCitations: any[] = []; // May contain citation identifiers or URLs or objects depending on model
  const collectedSearchResults: any[] = []; // Objects containing { title, url, ... }

  let remainder = '';

  const transformStream = new TransformStream({
    transform(chunk, controller) {
      // Append new chunk to any leftover data from previous chunk
      const text = remainder + decoder.decode(chunk, { stream: true });

      // Split into lines; the last element may be incomplete
      const parts = text.split('\n');
      remainder = parts.pop() ?? '';

      for (const line of parts) {
        // Perplexity sends "data:" JSON chunks and finally "data: [DONE]".
        if (line.startsWith('data:')) {
          // Handle the [DONE] sentinel – we'll flush in the separate flush() callback.
          if (line.trim() === 'data:[DONE]' || line.trim() === 'data: [DONE]') {
            continue;
          }

          try {
            // Remove the leading 'data:' prefix and any whitespace after it.
            const jsonStr = line.slice(5).trimStart();
            const data = JSON.parse(jsonStr);

            // Stream the partial content tokens to the client.
            const deltaContent = data.choices?.[0]?.delta?.content;
            if (deltaContent) {
              controller.enqueue(encoder.encode(deltaContent));
            }

            // Accumulate citations if they appear inside delta (rare) or top-level.
            const deltaCitations = data.choices?.[0]?.delta?.citations ?? data.citations;
            if (Array.isArray(deltaCitations) && deltaCitations.length > 0) {
              collectedCitations.push(...deltaCitations);
            }

            // Accumulate search_results if present (title + url information).
            if (Array.isArray(data.search_results) && data.search_results.length > 0) {
              collectedSearchResults.push(...data.search_results);
            }
          } catch (e) {
            // Ignore JSON parse errors which can happen on partial chunks.
          }
        }
      }
    },

    flush(controller) {
      // Process any leftover data in remainder
      if (remainder.startsWith('data:')) {
        try {
          const data = JSON.parse(remainder.slice(5).trimStart());
          if (data.choices?.[0]?.delta?.content) {
            controller.enqueue(encoder.encode(data.choices[0].delta.content));
          }
          const deltaCitations = data.choices?.[0]?.delta?.citations ?? data.citations;
          if (Array.isArray(deltaCitations) && deltaCitations.length > 0) collectedCitations.push(...deltaCitations);
          if (Array.isArray(data.search_results) && data.search_results.length > 0) collectedSearchResults.push(...data.search_results);
        } catch (e) {
          // ignore
        }
      }

      // Build a unique list of citations with titles & URLs if possible.
      // Strategy: If search_results available, use them for rich info;
      // otherwise treat collectedCitations as URLs and render those.

      const unique: { url: string; title: string }[] = [];

      if (collectedSearchResults.length > 0) {
        for (const sr of collectedSearchResults) {
          if (!sr.url) continue;
          if (unique.some((u) => u.url === sr.url)) continue;
          unique.push({ url: sr.url, title: sr.title || sr.url });
        }
      } else if (collectedCitations.length > 0) {
        for (const cite of collectedCitations) {
          const url = typeof cite === 'string' ? cite : cite?.url;
          if (!url) continue;
          if (unique.some((u) => u.url === url)) continue;
          unique.push({ url, title: url });
        }
      }

      if (unique.length > 0) {
        const citationLines = unique.map((c, idx) => `- [${idx + 1}] ${c.title ? `[${c.title}](${c.url})` : c.url}`);
        const citationsText = `\n\n참고문헌:\n${citationLines.join('\n')}`;
        controller.enqueue(encoder.encode(citationsText));
      }
    },
  });

  return new Response(response.body?.pipeThrough(transformStream), {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}