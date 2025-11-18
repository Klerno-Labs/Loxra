// Simple CLI to ingest legacy or ISO messages and emit validated ISO-20022 XML
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { getIngestionService } from '@core/messageIngestion';
import { buildIso20022Xml } from '@iso/xmlBuilder';
import { validateXml, prettyPrintXml } from '@iso/validator';
import { detectMessageType } from '@iso/parser/parse';
import { IsoMessageType, MessagePayload } from '@shared/types';

type CliOptions = {
  input?: string;
  output?: string;
  type?: IsoMessageType;
  skipValidate?: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-i':
      case '--input':
        opts.input = argv[++i];
        break;
      case '-o':
      case '--output':
        opts.output = argv[++i];
        break;
      case '-t':
      case '--type':
        opts.type = argv[++i] as IsoMessageType;
        break;
      case '--skip-validate':
        opts.skipValidate = true;
        break;
      default:
        break;
    }
  }
  return opts;
}

async function readInput(inputPath?: string): Promise<string> {
  if (inputPath) {
    const full = path.resolve(process.cwd(), inputPath);
    return fs.readFile(full, 'utf8');
  }
  // stdin fallback
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const raw = (await readInput(opts.input)).trim();
  if (!raw) {
    console.error('No input provided. Use --input <file> or pipe data via stdin.');
    process.exit(1);
  }

  let xmlOut = '';
  let messageType: IsoMessageType | undefined = opts.type;
  const ingestion = await getIngestionService().ingest(raw);

  if (!ingestion.success && ingestion.errors?.length) {
    console.error('Ingestion failed:', ingestion.errors.join('; '));
    process.exit(1);
  }

  if (ingestion.detectedFormat === 'legacy' && ingestion.isoPayload) {
    messageType = ingestion.isoPayload.type;
    xmlOut = buildIso20022Xml(ingestion.isoPayload as MessagePayload);
    console.info(`Detected legacy format via adapter "${ingestion.adapterId}". Target: ${messageType}`);
  } else {
    // Input was XML; use detected type if possible
    messageType = messageType || ingestion.isoMessageType || detectMessageType(raw) || 'pain.001';
    xmlOut = raw;
    console.info(`Detected XML input. Using type: ${messageType}`);
  }

  if (!opts.skipValidate) {
    const validation = await validateXml(xmlOut, messageType);
    if (!validation.valid) {
      console.error('Validation failed:', validation.errors);
      process.exit(1);
    }
  }

  if (opts.output) {
    const outPath = path.resolve(process.cwd(), opts.output);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, xmlOut, 'utf8');
    console.info(`Wrote XML to ${outPath}`);
  } else {
    const pretty = await prettyPrintXml(xmlOut);
    process.stdout.write(pretty);
  }
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
