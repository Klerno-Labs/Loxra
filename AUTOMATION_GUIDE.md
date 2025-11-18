# Loxra Automation Guide

Complete guide for setting up and using Loxra's folder bridge automation, CLI tools, and HTTP API.

## Quick Start

### 1. Setup & Install

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# OUT_HTTP_URL=http://your-endpoint.com/api/messages
# OUT_SFTP_URL=sftp://user:pass@host:22/path
# OUT_AMQP_URL=amqp://user:pass@localhost:5672
# OUT_AMQP_QUEUE=iso20022
# RETRIES=3
# POLL_MS=1500

# Install dependencies
npm install
```

### 2. Validate & Build

```bash
# Run tests
npm test

# Build the application
npm run build
```

### 3. Smoke Test the App

Launch the packaged app from `release/` directory and verify:

- **Builder**: Generate pacs.008/009/002/camt.053 messages and verify valid XML output
- **Validator**: Paste XML or legacy samples (MT/Fedwire/ACH), verify detection and validation
- **Export/Save**: Confirm export and save functionality works

## Folder Bridge Automation

The folder bridge automatically processes incoming files, converts legacy formats to ISO-20022, validates, and delivers to configured endpoints.

### Architecture

```
inbound/           outbound/          error/
  ├─ file1.txt  →  ├─ file1.xml      ├─ failed.txt
  ├─ file2.mt   →  ├─ file2.xml      └─ invalid.xml
  └─ file3.xml  →  └─ file3.xml
       │                  │
       ↓                  ↓
   Detection         Validation
   Adapters          XSD Check
   Canonical         
   Model             ↓
                  Push to:
                  - HTTP POST
                  - SFTP
                  - AMQP
```

### Running the Bridge

```bash
npm run folder:bridge
```

The bridge will:

1. Create `inbound/`, `outbound/`, and `error/` directories if they don't exist
2. Poll `inbound/` every `POLL_MS` milliseconds (default: 1500ms)
3. Process each file:
   - Auto-detect format (XML, SWIFT MT, Fedwire, ACH, legacy demo)
   - Parse using appropriate adapter
   - Convert to canonical model
   - Generate ISO-20022 compliant XML
   - Validate against XSD schemas
   - Write to `outbound/` as `.xml` file
4. Optionally push to configured endpoints (HTTP/SFTP/AMQP)
5. Retry failed files up to `RETRIES` times (default: 3)
6. Move permanently failed files to `error/`
7. Log all events as structured JSON

### Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `OUT_HTTP_URL` | HTTP POST endpoint for validated XML | `http://api.example.com/messages` | No |
| `OUT_SFTP_URL` | SFTP URL for file upload | `sftp://user:pass@host:22/uploads` | No |
| `OUT_AMQP_URL` | AMQP broker connection string | `amqp://user:pass@localhost:5672` | No |
| `OUT_AMQP_QUEUE` | AMQP queue name | `iso20022` | No (default: `iso20022`) |
| `RETRIES` | Max retry attempts before moving to error | `3` | No (default: `3`) |
| `POLL_MS` | Polling interval in milliseconds | `1500` | No (default: `1500`) |

### Example Workflows

#### Basic File Processing

```bash
# 1. Start the bridge
npm run folder:bridge

# 2. Drop a legacy file
cat > inbound/payment.txt << EOF
LEGACY:DEMO:v1
TYPE:CREDIT
TXN_ID:ABC123
DEBTOR_NAME:Acme Corp
DEBTOR_ACCT:DE89370400440532013000
CREDITOR_NAME:Widget Inc
CREDITOR_ACCT:GB29NWBK60161331926819
AMOUNT:5000.00
CURRENCY:EUR
END
EOF

# 3. Check output
ls outbound/  # payment.xml
cat outbound/payment.xml  # ISO-20022 pacs.008 XML

# 4. View logs
# JSON logs show: adapterId, type, validation, push status
```

#### HTTP Integration

```bash
# .env configuration
OUT_HTTP_URL=https://api.your-bank.com/iso20022
RETRIES=5

# Bridge will POST validated XML with headers:
# Content-Type: application/xml
# X-ISO-Type: pacs.008
# X-Source-File: payment.txt
```

#### SFTP Integration

```bash
# .env configuration
OUT_SFTP_URL=sftp://user:password@sftp.example.com:22/iso-messages

# Files uploaded as: {original-name}-{iso-type}.xml
# Example: payment-pacs.008.xml
```

#### AMQP Integration

```bash
# .env configuration
OUT_AMQP_URL=amqp://guest:guest@localhost:5672
OUT_AMQP_QUEUE=iso20022-validated

# Message format:
{
  "type": "pacs.008",
  "fileName": "payment.txt",
  "xml": "<ISO XML content>"
}
```

### Error Handling

Files are retried up to `RETRIES` times with exponential backoff. After max retries, files move to `error/` directory.

**Common errors:**
- Empty file
- Malformed legacy format
- No matching adapter
- Invalid canonical message
- XSD validation failure
- Network timeout (HTTP/SFTP/AMQP)

**Error logs include:**
- Filename
- Attempt count
- Error message
- Timestamp

### JSON Logging

All events are logged as JSON for easy parsing and monitoring:

```json
{
  "event": "ingest_success",
  "adapterId": "legacy-demo",
  "type": "pacs.008",
  "detectedFormat": "legacy",
  "bytes": 2048
}
```

```json
{
  "event": "push_http",
  "status": 200,
  "type": "pacs.008",
  "fileName": "payment.txt"
}
```

## CLI Ingestion Tool

For one-off message conversions without the bridge.

### Usage

```bash
# Convert legacy to ISO XML
npm run ingest -- -i examples/demo-credit-transfer.txt -o output.xml

# Read from stdin, write to stdout
cat message.txt | npm run ingest

# Specify message type explicitly
npm run ingest -- -i payment.txt -o out.xml -t pacs.008

# Skip validation (faster, useful for testing)
npm run ingest -- -i message.xml --skip-validate -o quick.xml
```

### Options

- `-i, --input <path>` - Input file path (or stdin if omitted)
- `-o, --output <path>` - Output file path (or stdout if omitted)
- `-t, --type <type>` - Force ISO message type (pacs.008, pain.001, etc.)
- `--skip-validate` - Skip XSD validation (not recommended for production)

### Examples

```bash
# SWIFT MT103 to pacs.008
npm run ingest -- -i mt103.txt -o pacs008.xml -t pacs.008

# Fedwire to pain.001
npm run ingest -- -i fedwire.txt -o pain001.xml

# Pipe processing
find inbound/ -name "*.txt" | xargs -I {} npm run ingest -- -i {} -o {}.xml
```

## HTTP API Server

RESTful API for message conversion and validation.

### Starting the Server

```bash
npm run api

# Server starts on port 3000 (or PORT environment variable)
# Listening at http://localhost:3000
```

### Endpoints

#### POST /ingest

Convert any format (legacy or XML) to validated ISO-20022 XML.

**Request:**

```json
{
  "xml": "<legacy or ISO XML content>",
  "type": "pacs.008"  // optional, auto-detected if omitted
}
```

**Response (200 OK):**

```json
{
  "adapterId": "legacy-demo",
  "detectedFormat": "legacy",
  "isoMessageType": "pacs.008",
  "validation": {
    "valid": true,
    "errors": []
  },
  "xml": "<ISO-20022 pacs.008 XML>"
}
```

**Error Response (400):**

```json
{
  "error": "ingest_failed",
  "details": ["Missing DEBTOR_NAME field"]
}
```

#### POST /generate

Generate ISO-20022 XML from a structured payload.

**Request:**

```json
{
  "payload": {
    "type": "pacs.008",
    "FIToFICstmrCdtTrf": {
      "GrpHdr": {
        "MsgId": "MSG123",
        "CreDtTm": "2024-11-16T10:00:00Z"
      },
      "CdtTrfTxInf": [{
        "PmtId": {
          "InstrId": "INST001",
          "EndToEndId": "E2E001"
        },
        "IntrBkSttlmAmt": {
          "Ccy": "EUR",
          "Value": "1000.00"
        }
      }]
    }
  }
}
```

**Response (200 OK):**

```json
{
  "validation": {
    "valid": true,
    "errors": []
  },
  "xml": "<ISO-20022 pacs.008 XML>"
}
```

### cURL Examples

```bash
# Ingest legacy format
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "xml": "LEGACY:DEMO:v1\nTYPE:CREDIT\nTXN_ID:123\nEND"
  }'

# Generate from payload
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d @payload.json
```

## Supported Message Formats

### ISO-20022 (Native)

- **pain.001** - Customer Credit Transfer Initiation
- **pacs.008** - FI to FI Customer Credit Transfer
- **pacs.009** - Financial Institution Credit Transfer
- **pacs.002** - Payment Status Report
- **camt.053** - Bank to Customer Statement

### Legacy Formats (via Adapters)

- **SWIFT MT** - MT103, MT202, etc. (via SwiftMT103Adapter)
- **Fedwire** - FED format (via FedwireAdapter)
- **ACH/NACHA** - ACH file format (via AchNachAdapter)
- **Legacy Demo** - Simple key-value format (via LegacyDemoAdapter)

## Monitoring & Troubleshooting

### Health Checks

```bash
# Check if bridge is running
ps aux | grep folder-bridge

# Monitor logs in real-time
npm run folder:bridge | jq .

# Count processed files
ls outbound/ | wc -l

# Check error rate
ls error/ | wc -l
```

### Common Issues

**Files not processing:**
- Check `POLL_MS` interval
- Verify file permissions
- Ensure no file locks
- Check logs for errors

**Validation failures:**
- Verify adapter compatibility
- Check XSD schema versions
- Validate legacy format syntax
- Review error logs in `error/` directory

**Push failures:**
- Verify network connectivity
- Check credentials in `.env`
- Test endpoints manually
- Review retry count in logs

**Performance issues:**
- Reduce `POLL_MS` for higher throughput
- Increase `RETRIES` for unreliable networks
- Use AMQP for async processing
- Batch files for bulk operations

## Production Deployment

### Systemd Service (Linux)

```ini
[Unit]
Description=Loxra Folder Bridge
After=network.target

[Service]
Type=simple
User=loxra
WorkingDirectory=/opt/loxra
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run folder:bridge
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build:main
CMD ["npm", "run", "folder:bridge"]
```

### Windows Service

Use `node-windows` or `nssm` to run as a Windows service.

```bash
npm install -g node-windows
node install-windows-service.js
```

## Security Considerations

- Store credentials in `.env`, never commit to git
- Use HTTPS/SFTP/AMQPS for encrypted transmission
- Validate all input messages before processing
- Rotate credentials regularly
- Monitor error logs for suspicious patterns
- Use network segmentation for sensitive deployments
- Enable audit logging for compliance

## Performance Tuning

| Scenario | Recommended Settings |
|----------|---------------------|
| High volume (>1000 files/hour) | `POLL_MS=500`, use AMQP for async delivery |
| Unreliable network | `RETRIES=10`, exponential backoff |
| Large files (>10MB) | Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096` |
| Low latency required | `POLL_MS=100`, pre-warm adapters |
| Multiple inbound sources | Run separate bridges per source with different folders |

## Support & Resources

- **Documentation**: See [README.md](./README.md) and [ADAPTER_SYSTEM.md](./ADAPTER_SYSTEM.md)
- **Examples**: Check `examples/` directory for sample messages
- **Tests**: Run `npm test` to verify setup
- **Issues**: Report bugs on GitHub Issues
- **Community**: Join discussions on GitHub Discussions

## License

MIT - See [LICENSE](./LICENSE) file
