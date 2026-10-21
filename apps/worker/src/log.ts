/** One JSON object per line, so a log collector can index fields without parsing prose. */
type Level = 'debug' | 'info' | 'warn' | 'error';
const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export interface Logger {
  debug(msg: string, fields?: Record<string, unknown>): void;
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
}

export function createLogger(min: string = 'info', write: (line: string) => void = (l) => process.stdout.write(l + '\n')): Logger {
  const threshold = order[(min === 'fatal' ? 'error' : min === 'trace' ? 'debug' : min) as Level] ?? 20;
  const at = (level: Level) => (msg: string, fields: Record<string, unknown> = {}) => {
    if (order[level] < threshold) return;
    write(JSON.stringify({ time: new Date().toISOString(), level, msg, ...fields }));
  };
  return { debug: at('debug'), info: at('info'), warn: at('warn'), error: at('error') };
}

export const silentLogger: Logger = { debug() {}, info() {}, warn() {}, error() {} };

export const errorFields = (err: unknown) => ({ error: err instanceof Error ? err.message : String(err) });
