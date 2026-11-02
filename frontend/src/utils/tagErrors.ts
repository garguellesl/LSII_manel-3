export type TagsUpdateErrors = { general?: string; perTag: Record<number, string> };

const TAG_INDEX = /^tags\[(\d+)]$/;

export function parseTagErrors(fields: Record<string, string>): TagsUpdateErrors {
  const result: TagsUpdateErrors = { perTag: {} };
  for (const [key, message] of Object.entries(fields)) {
    const match = TAG_INDEX.exec(key);
    if (match) {
      result.perTag[Number(match[1])] = message;
    } else if (key === 'tags') {
      result.general = message;
    }
  }
  return result;
}
