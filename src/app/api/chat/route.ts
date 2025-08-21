// Edge runtime provides native fetch
import { SYSTEM_MESSAGE } from './system-message';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // 환경변수 디버깅
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('OPENAI_API_KEY exists:', !!apiKey);
  console.log('OPENAI_API_KEY length:', apiKey?.length || 0);
  
  if (!apiKey) {
    return new Response('OpenAI API key is not configured', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // 메시지 병합 로직
  const mergedMessages = [] as typeof messages;
  for (const msg of messages) {
    if (mergedMessages.length > 0 && mergedMessages[mergedMessages.length - 1].role === msg.role) {
      mergedMessages[mergedMessages.length - 1].content += '\n' + msg.content;
    } else {
      mergedMessages.push({ ...msg });
    }
  }

  const systemMessage = {
    role: 'system' as const,
    content: SYSTEM_MESSAGE
  };

  const formattedInput = [
    systemMessage,
    ...mergedMessages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content
    }))
  ];

  // Chat Completions API로 요청 (안정적)
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      stream: true,
      tools: [
        { "type": "web_search" }
      ],
      input: formattedInput
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    const msg = `Request to OpenAI failed (${response.status}): ${errorText}`;
    return new Response(msg, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // 스트리밍 응답 처리
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const collectedAnnotations: any[] = [];
  let remainder = '';

  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const text = remainder + decoder.decode(chunk, { stream: true });
      const parts = text.split('\n');
      remainder = parts.pop() ?? '';

      for (const line of parts) {
        if (line.startsWith('data:')) {
          if (line.trim() === 'data:[DONE]' || line.trim() === 'data: [DONE]') {
            continue;
          }

          try {
            const jsonStr = line.slice(5).trimStart();
            const event = JSON.parse(jsonStr);

            // Debug: responses API 구조 확인
            console.log('Responses API event:', JSON.stringify(event, null, 2));

            // responses API 이벤트 기반 처리
            if (event.type === 'response.output_text.delta' && event.delta) {
              controller.enqueue(encoder.encode(event.delta));
            }
            // 대안적인 구조들도 확인
            else if (event.delta?.content) {
              controller.enqueue(encoder.encode(event.delta.content));
            }
            else if (event.content) {
              controller.enqueue(encoder.encode(event.content));
            }
            // 기존 chat completions 구조도 유지 (호환성)
            else if (event.choices?.[0]?.delta?.content) {
              controller.enqueue(encoder.encode(event.choices[0].delta.content));
            }

            // annotations 처리 (responses API 구조)
            if (event.annotations && Array.isArray(event.annotations)) {
              collectedAnnotations.push(...event.annotations);
            }
            // 기존 구조도 유지
            else if (event.choices?.[0]?.message?.annotations) {
              collectedAnnotations.push(...event.choices[0].message.annotations);
            }
            else if (event.choices?.[0]?.delta?.annotations) {
              collectedAnnotations.push(...event.choices[0].delta.annotations);
            }

          } catch (e) {
            console.log('JSON parse error:', e.message, 'Line:', line);
          }
        }
      }
    },

    flush(controller) {
      if (remainder.startsWith('data:')) {
        try {
          const event = JSON.parse(remainder.slice(5).trimStart());
          
          // responses API 이벤트 기반 처리
          if (event.type === 'response.output_text.delta' && event.delta) {
            controller.enqueue(encoder.encode(event.delta));
          }
          // 대안적인 구조들도 확인
          else if (event.delta?.content) {
            controller.enqueue(encoder.encode(event.delta.content));
          }
          else if (event.content) {
            controller.enqueue(encoder.encode(event.content));
          }
          // 기존 chat completions 구조도 유지
          else if (event.choices?.[0]?.delta?.content) {
            controller.enqueue(encoder.encode(event.choices[0].delta.content));
          }
          
          // annotations 처리
          if (event.annotations && Array.isArray(event.annotations)) {
            collectedAnnotations.push(...event.annotations);
          }
          else if (event.choices?.[0]?.message?.annotations) {
            collectedAnnotations.push(...event.choices[0].message.annotations);
          }
          else if (event.choices?.[0]?.delta?.annotations) {
            collectedAnnotations.push(...event.choices[0].delta.annotations);
          }
        } catch (e) {
          // ignore
        }
      }

      // Process citations
      const unique: { url: string; title: string }[] = [];

      if (collectedAnnotations.length > 0) {
        for (const annotation of collectedAnnotations) {
          if (annotation.type === 'url_citation' && annotation.url_citation) {
            const { url, title } = annotation.url_citation;
            if (!url) continue;
            // Filter out Korean sites
            if (url.includes('.kr') || url.includes('naver.com') || url.includes('daum.net') || 
                url.includes('chosun.com') || url.includes('joongang.co.kr')) {
              continue;
            }
            if (unique.some((u) => u.url === url)) continue;
            unique.push({ url, title: title || url });
          }
        }
      }

      if (unique.length > 0) {
        // Filter for TOP-TIER academic sites only
        const topTierSites = [
          // Top Science Journals
          'nature.com', 'science.org', 'cell.com', 'nejm.org', 'thelancet.com', 'pnas.org',
          // Preprint servers
          'arxiv.org', 'biorxiv.org', 'medrxiv.org',
          // Academic databases
          'pubmed', 'doi.org', 'ieee.org', 'acm.org',
          // Top publishers
          'springer.com', 'wiley.com', 'elsevier.com', 'oxford', 'cambridge',
          // Business journals
          'journals.aom.org', 'onlinelibrary.wiley.com', 'informs.org',
          // University sites
          '.edu'
        ];
        
        const validCitations = unique.filter(c => {
          // Exclude Korean sites
          if (c.url.includes('.kr') || c.url.includes('naver.com') || 
              c.url.includes('daum.net') || c.url.includes('chosun.com') || 
              c.url.includes('joongang.co.kr')) {
            return false;
          }
          
          // Only include top-tier academic sites
          return topTierSites.some(site => c.url.includes(site));
        });

        if (validCitations.length > 0) {
          const citationLines = validCitations.map((c, idx) => `- [${idx + 1}] ${c.title ? `[${c.title}](${c.url})` : c.url}`);
          const citationsText = `\n\n📚 **References (Top-Tier Academic Sources):**\n${citationLines.join('\n')}`;
          controller.enqueue(encoder.encode(citationsText));
        }
      }
    },
  });

  return new Response(response.body?.pipeThrough(transformStream), {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}