function generateMessageId() {
  const now = new Date();
  const datePart = now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const rand = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  return `MSG-${datePart}-${rand}`;
}

function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildIsoXml(rawText, msgType, msgId) {
  const created = new Date().toISOString();
  const safeId = msgId && msgId.trim() ? msgId.trim() : generateMessageId();

  const tagName = msgType === "generic" ? "GenericMessage" : msgType;

  const escaped = escapeXml(rawText.trim() || "No content provided.");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:${msgType}">
  <${tagName}>
    <GrpHdr>
      <MsgId>${safeId}</MsgId>
      <CreDtTm>${created}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <InitgPty>
        <Nm>ISO-Translator-Lite-Client</Nm>
      </InitgPty>
    </GrpHdr>
    <RawContent>
      <!-- This is a non-standard helper element that carries the original message.
           In a real implementation, you'd map fields into the proper ISO-20022
           structures instead of dumping raw content. -->
      <OriginalMessage><![CDATA[
${rawText.trim()}
      ]]></OriginalMessage>
      <OriginalMessageEscaped>${escaped}</OriginalMessageEscaped>
    </RawContent>
  </${tagName}>
</Document>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const legacyInput = document.getElementById("legacyInput");
  const msgType = document.getElementById("msgType");
  const msgId = document.getElementById("msgId");
  const xmlOutput = document.getElementById("xmlOutput");
  const generateBtn = document.getElementById("generateBtn");
  const copyBtn = document.getElementById("copyBtn");
  const downloadBtn = document.getElementById("downloadBtn");

  generateBtn.addEventListener("click", () => {
    const rawText = legacyInput.value;
    const type = msgType.value;
    const id = msgId.value;

    if (!rawText.trim()) {
      alert("Paste a legacy/raw message first.");
      legacyInput.focus();
      return;
    }

    const xml = buildIsoXml(rawText, type, id);
    xmlOutput.value = xml;
  });

  copyBtn.addEventListener("click", async () => {
    if (!xmlOutput.value.trim()) {
      alert("Nothing to copy yet. Generate XML first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(xmlOutput.value);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy XML"), 1200);
    } catch (err) {
      console.error("Clipboard error:", err);
      alert("Couldn't copy to clipboard. You can select and copy manually.");
    }
  });

  downloadBtn.addEventListener("click", () => {
    if (!xmlOutput.value.trim()) {
      alert("Nothing to download yet. Generate XML first.");
      return;
    }

    const blob = new Blob([xmlOutput.value], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const id = msgId.value && msgId.value.trim() ? msgId.value.trim() : "message";
    a.href = url;
    a.download = `${id}_iso20022.xml`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
});
