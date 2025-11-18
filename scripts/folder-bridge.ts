// Folder bridge: polls inbound/ for files, ingests legacy/XML, validates, writes ISO XML to outbound/
// Optional: pushes validated XML to an HTTP endpoint (set OUT_HTTP_URL), retries then moves to error/.
import 'dotenv/config';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { getIngestionService } from '@core/messageIngestion';
import { buildIso20022Xml } from '@iso/xmlBuilder';
import { validateXml } from '@iso/validator';
import { detectMessageType } from '@iso/parser/parse';
import { MessagePayload, IsoMessageType } from '@shared/types';
import Client from 'ssh2-sftp-client';
import amqp from 'amqplib';

const INBOUND = path.resolve(process.cwd(), 'inbound');
const OUTBOUND = path.resolve(process.cwd(), 'outbound');
const ERROR_DIR = path.resolve(process.cwd(), 'error');
const POLL_MS = Number(process.env.POLL_MS || 1500);
const MAX_RETRIES = Number(process.env.RETRIES || 3);
const OUT_HTTP_URL = process.env.OUT_HTTP_URL;
const OUT_SFTP_URL = process.env.OUT_SFTP_URL; // sftp://user:pass@host:port/path
const OUT_AMQP_URL = process.env.OUT_AMQP_URL; // amqp://user:pass@host:port/vhost
const OUT_AMQP_QUEUE = process.env.OUT_AMQP_QUEUE || 'iso20022';

let sftpClient: Client | null = null;
let amqpChannel: amqp.Channel | null = null;

function logEvent(event: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ event, ...data }));
}

type AttemptMap = Record<string, number>;
const attempts: AttemptMap = {};

async function ensureDirs() {
  await fsp.mkdir(INBOUND, { recursive: true });
  await fsp.mkdir(OUTBOUND, { recursive: true });
  await fsp.mkdir(ERROR_DIR, { recursive: true });
}

async function loadFile(filePath: string) {
  return fsp.readFile(filePath, 'utf8');
}

async function maybePush(xml: string, type: IsoMessageType, fileName: string) {
  if (!OUT_HTTP_URL) return;
  const res = await fetch(OUT_HTTP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml', 'X-ISO-Type': type, 'X-Source-File': fileName },
    body: xml
  });
  if (!res.ok) {
    throw new Error(`HTTP push failed (${res.status})`);
  }
  logEvent('push_http', { status: res.status, type, fileName });
}

async function pushSftp(xml: string, type: IsoMessageType, fileName: string) {
  if (!OUT_SFTP_URL) return;
  if (!sftpClient) {
    sftpClient = new Client();
    await sftpClient.connect(OUT_SFTP_URL);
  }
  const remoteBase = OUT_SFTP_URL.split('/').slice(3).join('/') || '';
  const remotePath = `${remoteBase}/${fileName.replace(/\.[^.]+$/, '')}-${type}.xml`;
  await sftpClient.put(Buffer.from(xml, 'utf8'), remotePath);
  logEvent('push_sftp', { type, fileName, remotePath });
}

async function pushAmqp(xml: string, type: IsoMessageType, fileName: string) {
  if (!OUT_AMQP_URL) return;
  if (!amqpChannel) {
    const conn = await amqp.connect(OUT_AMQP_URL);
    amqpChannel = await conn.createChannel();
    await amqpChannel.assertQueue(OUT_AMQP_QUEUE, { durable: true });
  }
  const payload = { type, fileName, xml };
  amqpChannel.sendToQueue(OUT_AMQP_QUEUE, Buffer.from(JSON.stringify(payload)), { contentType: 'application/json', persistent: true });
  logEvent('push_amqp', { type, fileName, queue: OUT_AMQP_QUEUE });
}

async function processOne(file: string) {
  const filePath = path.join(INBOUND, file);
  try {
    const raw = (await loadFile(filePath)).trim();
    if (!raw) throw new Error('empty file');

    const ingestion = await getIngestionService().ingest(raw);
    if (!ingestion.success && ingestion.errors) {
      throw new Error(`ingest failed: ${ingestion.errors.join('; ')}`);
    }

    const isoPayload = ingestion.isoPayload as MessagePayload | undefined;
    const type: IsoMessageType =
      isoPayload?.type || ingestion.isoMessageType || detectMessageType(raw) || 'pain.001';
    const xml = isoPayload ? buildIso20022Xml(isoPayload) : raw;
    const validation = await validateXml(xml, type);
    if (!validation.valid) {
      throw new Error(`validation failed: ${JSON.stringify(validation.errors)}`);
    }
    logEvent('ingest_success', {
      adapterId: ingestion.adapterId,
      type,
      detectedFormat: ingestion.detectedFormat,
      bytes: Buffer.byteLength(xml, 'utf8')
    });

    const outFile = path.join(OUTBOUND, `${path.parse(file).name}.xml`);
    await fsp.writeFile(outFile, xml, 'utf8');
    await maybePush(xml, type, file);
    await pushSftp(xml, type, file);
    await pushAmqp(xml, type, file);
    console.log(`Processed ${file} -> ${outFile} (${type})`);
    await fsp.unlink(filePath);
    delete attempts[file];
  } catch (err: any) {
    const count = (attempts[file] || 0) + 1;
    attempts[file] = count;
    if (count >= MAX_RETRIES) {
      const dest = path.join(ERROR_DIR, file);
      await fsp.rename(filePath, dest).catch(async () => {
        // If rename fails (e.g., cross-device), fallback to copy+unlink
        try {
          const data = await fsp.readFile(filePath);
          await fsp.writeFile(dest, data);
          await fsp.unlink(filePath);
        } catch {
          /* ignore */
        }
      });
      console.error(`Moved ${file} to error/ after ${count} attempts`, err?.message || err);
      delete attempts[file];
    } else {
      console.warn(`Retrying ${file} (${count}/${MAX_RETRIES}):`, err?.message || err);
    }
  }
}

async function poll() {
  await ensureDirs();
  setInterval(async () => {
    try {
      const entries = await fsp.readdir(INBOUND);
      for (const file of entries) {
        const full = path.join(INBOUND, file);
        const stat = await fsp.stat(full);
        if (stat.isDirectory()) continue;
        await processOne(file);
      }
    } catch (err) {
      console.error('Poll error:', err?.message || err);
    }
  }, POLL_MS);
  console.log(
    `Folder bridge running. Drop files into ${INBOUND} => ISO XML in ${OUTBOUND}. Errors -> ${ERROR_DIR}. Retries: ${MAX_RETRIES}.`
  );
  if (OUT_HTTP_URL) {
    console.log(`HTTP outflow enabled to ${OUT_HTTP_URL}`);
  }
}

poll().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
