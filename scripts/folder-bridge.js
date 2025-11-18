#!/usr/bin/env node
// Minimal folder watcher: drop files into inbound/, get ISO XML in outbound/
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { getIngestionService } = require('../dist/core/messageIngestion');
const { buildIso20022Xml } = require('../dist/iso/xmlBuilder');
const { validateXml } = require('../dist/iso/validator');
const { detectMessageType } = require('../dist/iso/parser/parse');

const inbound = path.resolve(process.cwd(), 'inbound');
const outbound = path.resolve(process.cwd(), 'outbound');

async function ensureDirs() {
  await fsp.mkdir(inbound, { recursive: true });
  await fsp.mkdir(outbound, { recursive: true });
}

async function processFile(file) {
  const filePath = path.join(inbound, file);
  const raw = await fsp.readFile(filePath, 'utf8');
  const ingestion = await getIngestionService().ingest(raw);
  if (!ingestion.success && ingestion.errors) {
    console.error(`Failed ${file}:`, ingestion.errors.join('; '));
    return;
  }
  const isoPayload = ingestion.isoPayload;
  const type = ingestion.isoMessageType || (isoPayload && isoPayload.type) || detectMessageType(raw) || 'pain.001';
  const xmlOut = isoPayload ? buildIso20022Xml(isoPayload) : raw;
  const validation = await validateXml(xmlOut, type);
  if (!validation.valid) {
    console.error(`Validation failed for ${file}:`, validation.errors);
    return;
  }
  const outPath = path.join(outbound, `${path.parse(file).name}.xml`);
  await fsp.writeFile(outPath, xmlOut, 'utf8');
  console.log(`Processed ${file} -> ${outPath} (${type})`);
  await fsp.unlink(filePath);
}

async function watch() {
  await ensureDirs();
  console.log(`Watching ${inbound} -> ${outbound}`);
  fs.watch(inbound, async (_event, filename) => {
    if (!filename) return;
    try {
      await processFile(filename);
    } catch (err) {
      console.error('Error processing file', filename, err?.message || err);
    }
  });
}

watch().catch((err) => {
  console.error(err);
  process.exit(1);
});
