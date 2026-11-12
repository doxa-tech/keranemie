const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ids in URLs are user input: check them before querying uuid columns.
export function isUuid(value: string): boolean {
  return UUID.test(value);
}
