import { createHmac, timingSafeEqual } from 'node:crypto';

export const MAX_LIVEKIT_TTL_SECONDS = 2 * 60 * 60;

export type LiveKitTokenInput = {
  apiKey: string;
  apiSecret: string;
  identity: string;
  name: string;
  room: string;
  ttlSeconds: number;
  nowSeconds: number;
  canPublish: boolean;
};

function encode(value: string): string {
  return Buffer.from(value).toString('base64url');
}

export function mintLiveKitToken(input: LiveKitTokenInput): { token: string; expiresAt: string } {
  if (input.apiSecret.trim().length === 0) {
    throw new Error('missing video secret');
  }
  if (input.ttlSeconds <= 0 || input.ttlSeconds > MAX_LIVEKIT_TTL_SECONDS) {
    throw new Error('credential ttl exceeds the short-lived limit');
  }
  const header = encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = input.nowSeconds + input.ttlSeconds;
  const payload = encode(
    JSON.stringify({
      iss: input.apiKey,
      sub: input.identity,
      nbf: input.nowSeconds,
      exp,
      name: input.name,
      video: {
        roomJoin: true,
        room: input.room,
        canPublish: input.canPublish,
        canSubscribe: true,
        canPublishData: true,
        roomRecord: false,
      },
    }),
  );
  const signature = createHmac('sha256', input.apiSecret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return {
    token: `${header}.${payload}.${signature}`,
    expiresAt: new Date(exp * 1000).toISOString(),
  };
}

export function verifyLiveKitToken(token: string, apiSecret: string, nowSeconds: number): boolean {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) {
    return false;
  }
  const expected = createHmac('sha256', apiSecret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return false;
  }
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
    exp?: number;
    video?: { roomRecord?: boolean };
  };
  if (claims.video?.roomRecord === true || typeof claims.exp !== 'number') {
    return false;
  }
  const ttl = claims.exp - nowSeconds;
  return ttl > 0 && ttl <= MAX_LIVEKIT_TTL_SECONDS;
}
