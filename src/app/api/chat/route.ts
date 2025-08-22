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

  // 요청 헤더 구성 (조직/프로젝트 헤더는 선택)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'OpenAI-Beta': 'responses=1'
  };
  const orgId = process.env.OPENAI_ORG_ID;
  if (orgId) headers['OpenAI-Organization'] = orgId;
  const projectId = process.env.OPENAI_PROJECT;
  if (projectId) headers['OpenAI-Project'] = projectId;

  // 요청 바디 공통 부분
  const requestBodyBase = {
    model: 'gpt-4o',
    tools: [
      {
        type: 'web_search'
      }
    ],
    input: formattedInput
  } as const;

  // 1차: 스트리밍 시도
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...requestBodyBase,
      stream: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    // 스트리밍이 제한된 경우 자동으로 비스트리밍 모드로 재시도
    const shouldRetryWithoutStream =
      errorText.includes('must be verified to stream') ||
      errorText.includes('param') && errorText.includes('stream') ||
      errorText.includes('unsupported_value');

    if (shouldRetryWithoutStream) {
      const nonStreamResp = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...requestBodyBase,
          stream: false
        })
      });

      if (!nonStreamResp.ok) {
        const nonStreamErr = await nonStreamResp.text();
        const msg = `Request to OpenAI failed (${nonStreamResp.status}): ${nonStreamErr}`;
        return new Response(msg, {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      // 비스트리밍 응답 파싱 후 텍스트로 반환
      const data = await nonStreamResp.json();
      let outputText = '';
      try {
        if (typeof data?.output_text === 'string') {
          outputText = data.output_text;
        } else if (Array.isArray(data?.output_text)) {
          outputText = data.output_text.join('');
        } else if (typeof data?.content === 'string') {
          outputText = data.content;
        } else if (data?.choices?.[0]?.message?.content) {
          outputText = data.choices[0].message.content;
        } else {
          outputText = JSON.stringify(data);
        }
      } catch {
        outputText = typeof data === 'string' ? data : JSON.stringify(data);
      }

      return new Response(outputText, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

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

            // 웹 검색 결과 및 annotations 처리 (responses API 구조)
            if (event.type === 'response.tool_calls.delta' && event.tool_calls) {
              // 웹 검색 도구 호출 결과 처리
              for (const toolCall of event.tool_calls) {
                if (toolCall.type === 'web_search' && toolCall.web_search?.results) {
                  for (const result of toolCall.web_search.results) {
                    if (result.url && result.title) {
                      collectedAnnotations.push({
                        type: 'url_citation',
                        url_citation: {
                          url: result.url,
                          title: result.title
                        }
                      });
                    }
                  }
                }
              }
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
            console.log('JSON parse error:', e instanceof Error ? e.message : 'Unknown error', 'Line:', line);
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
          
          // 웹 검색 결과 및 annotations 처리
          if (event.type === 'response.tool_calls.delta' && event.tool_calls) {
            // 웹 검색 도구 호출 결과 처리
            for (const toolCall of event.tool_calls) {
              if (toolCall.type === 'web_search' && toolCall.web_search?.results) {
                for (const result of toolCall.web_search.results) {
                  if (result.url && result.title) {
                    collectedAnnotations.push({
                      type: 'url_citation',
                      url_citation: {
                        url: result.url,
                        title: result.title
                      }
                    });
                  }
                }
              }
            }
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
          // ignore parse errors
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

        // 모든 웹 검색 결과 표시 (학술 사이트 우선, 일반 사이트도 포함)
        const allValidCitations = unique.filter(c => {
          // 한국 사이트만 제외
          return !(c.url.includes('.kr') || c.url.includes('naver.com') || 
                   c.url.includes('daum.net') || c.url.includes('chosun.com') || 
                   c.url.includes('joongang.co.kr'));
        });

        if (allValidCitations.length > 0) {
          // 학술 사이트와 일반 사이트 분리
          const academicCitations = allValidCitations.filter(c => 
            topTierSites.some(site => c.url.includes(site))
          );
          const generalCitations = allValidCitations.filter(c => 
            !topTierSites.some(site => c.url.includes(site))
          );

          let citationsText = '';
          
          if (academicCitations.length > 0) {
            const academicLines = academicCitations.map((c, idx) => `- [${idx + 1}] ${c.title ? `[${c.title}](${c.url})` : c.url}`);
            citationsText += `\n\n📚 **Academic References:**\n${academicLines.join('\n')}`;
          }
          
          if (generalCitations.length > 0) {
            const generalLines = generalCitations.map((c, idx) => `- [${idx + academicCitations.length + 1}] ${c.title ? `[${c.title}](${c.url})` : c.url}`);
            citationsText += `\n\n🔍 **Web Search Results:**\n${generalLines.join('\n')}`;
          }
          
          if (citationsText) {
            controller.enqueue(encoder.encode(citationsText));
          }
        }
      }
    },
  });

  return new Response(response.body?.pipeThrough(transformStream), {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}