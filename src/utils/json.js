export function sanitizeJ(s) {
  s = s.replace(/,(\s*[}\]])/g, "$1");
  s = s.replace(/([{,]\s*)'([^']+?)'\s*:/g, '$1"$2":');
  s = s.replace(/:\s*'([^']*?)'/g, ':"$1"');
  return s;
}

export function repairJSON(raw) {
  var s = raw.indexOf("{");
  if (s < 0) return null;
  var t = raw.slice(s);
  var depth = 0, inStr = false, esc = false, last = -1;
  for (var i = 0; i < t.length; i++) {
    var ch = t[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\" && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (!inStr) {
      if (ch === "{" || ch === "[") depth++;
      else if (ch === "}" || ch === "]") { depth--; if (depth === 0) { last = i; break; } }
    }
  }
  if (last >= 0) return t.slice(0, last + 1);
  var out = t;
  var stack = [], inS = false, eS = false;
  for (var i = 0; i < out.length; i++) {
    var ch = out[i];
    if (eS) { eS = false; continue; }
    if (ch === "\\" && inS) { eS = true; continue; }
    if (ch === '"') { inS = !inS; continue; }
    if (!inS) {
      if (ch === "{" || ch === "[") stack.push(ch);
      else if (ch === "}" || ch === "]") stack.pop();
    }
  }
  if (inS) out += '"';
  for (var j = stack.length - 1; j >= 0; j--) out += stack[j] === "{" ? "}" : "]";
  return out;
}

export function parseJSON(raw) {
  var s = raw.indexOf("{");
  if (s < 0) throw new Error("JSON yok");
  var depth = 0, inStr = false, esc = false, end = -1;
  for (var i = s; i < raw.length; i++) {
    var ch = raw[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\" && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (!inStr) {
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
  }
  var sl = end >= 0 ? raw.slice(s, end + 1) : raw.slice(s);
  try {
    return JSON.parse(sl);
  } catch (e1) {
    try {
      return JSON.parse(sanitizeJ(sl));
    } catch (e2) {
      try {
        var rep = repairJSON(raw);
        if (rep) return JSON.parse(rep);
      } catch (e3) {}
      throw new Error("JSON: " + e2.message);
    }
  }
}
