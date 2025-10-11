
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { caseContext, strategy, judgeProfile, opposingProfile, round } = await request.json();

    const messages = [
      {
        role: "user",
        content: `You are simulating a legal motion to dismiss hearing. Generate realistic legal arguments for each party and judicial response.

**Case Context:**
${caseContext}

**Defense Strategy:**
${strategy}

**Judge Profile:**
- Pleading Strictness: ${judgeProfile?.characteristics?.pleadingStrictness}/10
- Precedent Weight: ${judgeProfile?.characteristics?.precedentWeight}/10
- Policy Receptivity: ${judgeProfile?.characteristics?.policyReceptivity}/10
- Plaintiff Friendly: ${judgeProfile?.characteristics?.plaintiffFriendly}/10

**Opposing Counsel Profile:**
- Aggressiveness: ${opposingProfile?.aggressivenessScore}/10
- Typical Arguments: ${opposingProfile?.typicalArguments?.join(', ')}

**Round ${round}:**

Generate a realistic courtroom exchange with:
1. Defense argument (2-3 sentences, professional legal language)
2. Opposition response (2-3 sentences, professional legal language) 
3. Judge response (2-3 sentences, professional judicial language)
4. Judge scoring (1-10) with brief rationale
5. Feature attributions (3-4 factors that influenced the judge's assessment)

Respond in JSON format:
{
  "defenseArgument": "string",
  "oppositionResponse": "string", 
  "judgeResponse": "string",
  "judgeScoring": {
    "score": number,
    "rationale": "string",
    "featureAttributions": [
      {"factor": "string", "weight": number, "impact": "string"}
    ]
  }
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`
      }
    ];

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: messages,
        stream: true,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let buffer = '';
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let partialRead = '';

        try {
          while (true) {
            const { done, value } = await reader?.read() ?? { done: true, value: undefined };
            if (done) break;
            
            partialRead += decoder.decode(value, { stream: true });
            let lines = partialRead.split('\n');
            partialRead = lines.pop() ?? '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  try {
                    const finalResult = JSON.parse(buffer);
                    const finalData = JSON.stringify({
                      status: 'completed',
                      result: finalResult
                    });
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                  } catch (e) {
                    console.error('Failed to parse final JSON:', e);
                    controller.error(new Error('Failed to parse response'));
                  }
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  buffer += parsed.choices?.[0]?.delta?.content || '';
                  const progressData = JSON.stringify({
                    status: 'processing',
                    message: 'Generating simulation...'
                  });
                  controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Simulation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate simulation' },
      { status: 500 }
    );
  }
}
