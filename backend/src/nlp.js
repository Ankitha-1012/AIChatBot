function toTitle(str) {
  return str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function normalizeStatus(text) {
  const t = text.toLowerCase();
  if (t.includes("in review") || t.includes("reviewed") || t.includes("review")) return "In Review";
  if (t.includes("accepted") || t.includes("accept")) return "Accepted";
  if (t.includes("received") || t.includes("receive")) return "Received";
  if (t.includes("completed") || t.includes("complete") || t.includes("done") || t.includes("finished")) return "Completed";
  if (t.includes("rejected") || t.includes("reject") || t.includes("not accepted")) return "Rejected";
  return null;
}

function parseCreateOrder(message) {
  const lower = message.toLowerCase();
  if (!/(need|order|require|manufacture|make)\b/.test(lower)) return null;

  const quantityMatch = message.match(/\b(\d{1,6})\s*(pcs|pieces|units)?\b/i);
  const materialMatch = message.match(
    /\b(aluminum|aluminium|stainless steel|steel|titanium|brass|copper|iron|abs|acrylic)\b/i
  );
  const deadlineMatch =
    message.match(/\b(?:by|before|deadline(?:\s*is)?)\s+([a-z]+\s+\d{1,2}(?:,\s*\d{4})?)\b/i) ||
    message.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const partMatch =
    message.match(/(?:need|order|require)\s+\d{1,6}\s+([a-z0-9\-\s]+?)(?:,| by | before | deadline|$)/i) ||
    message.match(/part(?:\s*name)?\s*(?:is|:)\s*([a-z0-9\-\s]+)/i);

  if (!quantityMatch || !partMatch) return null;
  // Heuristic cleanup: if the capture accidentally includes trailing verbs like
  // "... delivered", remove them so partName is closer to what users intend.
  const cleanedPart = partMatch[1]
    .replace(/\b(delivered|delivery)\b.*$/i, "")
    .replace(/\b(with|using)\b.*$/i, "")
    .trim();

  return {
    partName: toTitle(cleanedPart || partMatch[1].trim()),
    material: materialMatch ? toTitle(materialMatch[1]) : "Not Specified",
    quantity: Number(quantityMatch[1]),
    deadline: deadlineMatch ? deadlineMatch[1] : "Not Specified",
  };
}

function parseStatusUpdate(message) {
  const idMatch = message.match(/order\s*#?\s*(\d+)/i);
  const status = normalizeStatus(message);
  if (!idMatch || !status) return null;
  if (!/(mark|update|set|move|change|order)/i.test(message)) return null;
  return { orderId: Number(idMatch[1]), status };
}

function parseQualityUpdate(message) {
  if (!/(quality|inspection|checkpoint|qa)/i.test(message)) return null;
  const idMatch = message.match(/order\s*#?\s*(\d+)/i);
  if (!idMatch) return null;
  const noteMatch =
    message.match(/(?:quality\s*update(?:\s*on)?\s*order\s*#?\s*\d+\s*[-—:]\s*)(.+)$/i) ||
    message.match(/(?:order\s*#?\s*\d+\s*[-—:]\s*)(.+)$/i);
  const note = noteMatch ? noteMatch[1].trim() : message.trim();
  return { orderId: Number(idMatch[1]), note };
}

function parseListStatus(message) {
  if (!/(show|list|display)/i.test(message) || !/orders/i.test(message)) return null;
  const t = message.toLowerCase();
  const status = normalizeStatus(message);
  if (status) return { status };
  if (t.includes("all") || t.includes("every")) return { all: true };
  return null;
}

function parseHelpQuery(message) {
  const t = message.toLowerCase();
  if (
    /(help|problem|issue|error|not working|unable|can't|cannot|failed|fail|how to|what should i do)/i.test(
      message
    ) ||
    t.includes("?")
  ) {
    return { text: message.trim() };
  }
  return null;
}

function parseMessage(message) {
  return {
    createOrder: parseCreateOrder(message),
    statusUpdate: parseStatusUpdate(message),
    qualityUpdate: parseQualityUpdate(message),
    listStatus: parseListStatus(message),
    helpQuery: parseHelpQuery(message),
  };
}

module.exports = { parseMessage };
