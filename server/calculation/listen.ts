import { createServer, type ServerResponse } from 'node:http';

import { acceptPanchang, acceptTransit } from './accept-day';

const port = Number(process.env.CALCULATION_PORT ?? 8082);

function send(response: ServerResponse, body: unknown): void {
  response.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

const server = createServer((request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    });
    response.end();
    return;
  }
  if (request.method !== 'GET') {
    send(response, { status: 'unavailable' });
    return;
  }
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  const cityId = url.searchParams.get('cityId') ?? '';
  const date = url.searchParams.get('date') ?? '';
  try {
    if (url.pathname === '/panchang') {
      send(response, acceptPanchang(cityId, date));
      return;
    }
    if (url.pathname === '/transit') {
      send(response, acceptTransit(cityId, date, url.searchParams.get('rashiId') ?? ''));
      return;
    }
  } catch {
    send(response, { status: 'unavailable' });
    return;
  }
  send(response, { status: 'unavailable' });
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Calculation server listening on http://127.0.0.1:${port}\n`);
});
