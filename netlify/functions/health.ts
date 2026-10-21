export default async () => {
  return new Response(
    JSON.stringify({
      status: 'online',
      platform: 'Netlify Functions',
      assistant: 'UKG',
      persona: 'Female Hindi JARVIS AI',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};
