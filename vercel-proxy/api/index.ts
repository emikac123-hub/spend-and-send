// Spend & Send - Health Check Endpoint

export const config = {
  runtime: 'edge',
};

export default async function handler(): Promise<Response> {
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'Spend & Send API Proxy',
      endpoints: {
        chat: '/api/chat (POST)',
      },
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
