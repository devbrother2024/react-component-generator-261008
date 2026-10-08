/** Decode UTF-8 without assuming transport chunks align with lines. */
export async function* readLines(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let index: number;
      while ((index = buffer.indexOf('\n')) >= 0) {
        yield buffer.slice(0, index).replace(/\r$/, '');
        buffer = buffer.slice(index + 1);
      }
      if (done) break;
    }
    if (buffer) yield buffer.replace(/\r$/, '');
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
