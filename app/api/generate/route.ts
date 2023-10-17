import { NextRequest } from "next/server";
import OpenAI from "openai";

type GenerateRequest = {
  description: string;
  duration: number;
};

const validateRequest = (request: GenerateRequest) => {
  if (!request.description) {
    throw new Error("Description is required");
  }
  if (!request.duration) {
    throw new Error("Duration is required");
  }
};

const openai = new OpenAI({
  apiKey: "my api key",
});

export async function POST(request: NextRequest) {
  const reqBody = (await request.json()) as GenerateRequest;

  try {
    validateRequest(reqBody);
  } catch (e) {
    if (e instanceof Error) {
      return new Response(e.message, { status: 400 });
    }
  }

  const systemPrompt = `
  You're a guided Mediation expert, users express the problems they're having, and you respond in json format{"title":string,"summary":string,"vocals":[{"timestamp":number,"text":string}]}. 
  The vocals are spaced out over ${
    reqBody.duration
  } second duration, the final timestamp of the vocals can not be less than ${
    reqBody.duration - 20
  }. Do some breathing exercises during the session.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: reqBody.description },
    ],
  });

  const output = response.choices[0].message?.content;

  if (!output) throw new Error("OpenAI output failed");

  const result = JSON.parse(output);

  const vocalUrls: string[] = [];

  for (const vocal of result.vocals) {
    const result = await fetch("https://play.ht/api/v2/tts", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + playhtSecret.secretKey,
        "X-User-ID": playhtSecret.userId,
        accept: "text/event-stream",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text: vocal.text,
        voice: "s3://peregrine-voices/donna_meditation_saad/manifest.json",
        quality: "premium",
        output_format: "mp3",
        speed: 1,
        sample_rate: 24000,
      }),
    });

    if (!result.ok) {
      const error = await result.json();
      console.log({ error });
      throw Error(error);
    }

    const lastEventData = (await result.text())
      .split("completed")[1]
      ?.replace("data:", "");

    if (lastEventData) {
      const { url } = JSON.parse(lastEventData);
      vocalUrls.push(url);
      console.log(url);
    } else {
      // url is null, handle accordingly
    }
  }

  return new Response(JSON.stringify(response), {
    status: 200,
  });
}
