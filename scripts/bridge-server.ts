import 'dotenv/config';
import http from 'http';
import { URL } from 'url';
import { getIngestionService } from '@core/messageIngestion';
import { buildIso20022Xml } from '@iso/xmlBuilder';
import { validateXml } from '@iso/validator';
import { detectMessageType } from '@iso/parser/parse';
import { IsoMessageType, MessagePayload } from '@shared/types';

type Body = { payload?: MessagePayload; xml?: string; type?: IsoMessageType };

function json(res: http.ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data, null, 2));
}

async function handleIngest(req: http.IncomingMessage, res: http.ServerResponse, body: string) {
  const parsed: Body = body ? JSON.parse(body) : {};
  const raw = parsed.xml || '';
  if (!raw.trim()) {
    return json(res, 400, { error: 'Missing xml body' });
  }
  const ingestion = await getIngestionService().ingest(raw);
  if (!ingestion.success && ingestion.errors) {
    return json(res, 400, { error: 'ingest_failed', details: ingestion.errors });
  }
  const isoPayload = ingestion.isoPayload as MessagePayload | undefined;
  const messageType: IsoMessageType =
    isoPayload?.type || parsed.type || ingestion.isoMessageType || detectMessageType(raw) || 'pain.001';
  const xmlOut = isoPayload ? buildIso20022Xml(isoPayload) : raw;
  const validation = await validateXml(xmlOut, messageType);
  return json(res, 200, {
    adapterId: ingestion.adapterId,
    detectedFormat: ingestion.detectedFormat,
    isoMessageType: messageType,
    validation,
    xml: xmlOut
  });
}

async function handleGenerate(req: http.IncomingMessage, res: http.ServerResponse, body: string) {
  const parsed: Body = body ? JSON.parse(body) : {};
  if (!parsed.payload) {
    return json(res, 400, { error: 'Missing payload' });
  }
  const xmlOut = buildIso20022Xml(parsed.payload);
  const validation = await validateXml(xmlOut, parsed.payload.type);
  return json(res, 200, { validation, xml: xmlOut });
}

function notFound(res: http.ServerResponse) {
  res.statusCode = 404;
  res.end('Not found');
}

const server = http.createServer(async (req, res) => {
  if (!req.url) return notFound(res);
  const url = new URL(req.url, 'http://localhost');
  if (req.method !== 'POST' || !['/ingest', '/generate'].includes(url.pathname)) {
    return notFound(res);
  }

  let body = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => (body += chunk));
  req.on('end', async () => {
    try {
      if (url.pathname === '/ingest') {
        await handleIngest(req, res, body);
      } else {
        await handleGenerate(req, res, body);
      }
    } catch (err: any) {
      json(res, 500, { error: err?.message || 'Internal error' });
    }
  });
});

const PORT = Number(process.env.PORT || 8787);
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Bridge server listening on http://localhost:${PORT} (POST /ingest or /generate)`);
});
