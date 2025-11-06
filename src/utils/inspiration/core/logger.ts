/**
 * 高级日志模块（TypeScript）
 * - 命名空间 + 级别控制 + 安全序列化 + 截断
 * - 可扩展 Transport（默认 Console）
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export type Meta = unknown;

export interface LoggerOptions {
  namespace?: string;              // 日志命名空间
  level?: LogLevel;                // 最小输出级别
  jsonMode?: boolean;              // 是否以结构化JSON输出
  enableTimestamp?: boolean;       // 是否展示时间戳
  truncate?: number;               // 对大对象字符串化后的截断长度
  transport?: Transport;           // 输出通道
}

export interface Transport {
  log: (level: LogLevel, msg: string, meta?: Meta) => void;
}

/** -------- 工具函数 -------- */

function safeStringify(obj: unknown): string {
  const cache = new WeakSet();
  try {
    return JSON.stringify(
      obj,
      (_k, v) => {
        if (typeof v === 'object' && v !== null) {
          if (cache.has(v)) return '[Circular]';
          cache.add(v);
        }
        if (v instanceof Error) {
          return { name: v.name, message: v.message, stack: v.stack };
        }
        return v;
      }
    );
  } catch {
    // 兜底
    try {
      return String(obj);
    } catch {
      return '[Unserializable]';
    }
  }
}

function truncate(s: string, len?: number): string {
  if (!len || s.length <= len) return s;
  return s.slice(0, len) + `...(+${s.length - len})`;
}

function levelToTag(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG: return 'DEBUG';
    case LogLevel.INFO:  return 'INFO';
    case LogLevel.WARN:  return 'WARN';
    case LogLevel.ERROR: return 'ERROR';
    default: return String(level);
  }
}

/** -------- 默认 Console Transport -------- */

export class ConsoleTransport implements Transport {
  log(level: LogLevel, msg: string, meta?: Meta) {
    const line = meta === undefined ? msg : `${msg} ${typeof meta === 'string' ? meta : safeStringify(meta)}`;
    switch (level) {
      case LogLevel.ERROR: console.error(line); break;
      case LogLevel.WARN:  console.warn(line);  break;
      case LogLevel.INFO:  console.info ? console.info(line) : console.log(line); break;
      default:             console.log(line);
    }
  }
}

/** -------- Logger 实现 -------- */

export class Logger {
  private ns?: string;
  private minLevel: LogLevel;
  private jsonMode: boolean;
  private ts: boolean;
  private cut?: number;
  private out: Transport;

  constructor(opts: LoggerOptions = {}) {
    this.ns = opts.namespace;
    this.minLevel = opts.level ?? inferDefaultLevel();
    this.jsonMode = !!opts.jsonMode;
    this.ts = opts.enableTimestamp ?? true;
    this.cut = opts.truncate;
    this.out = opts.transport ?? new ConsoleTransport();
  }

  child(namespace: string, overrides: Partial<LoggerOptions> = {}): Logger {
    return new Logger({
      ...overrides,
      namespace: this.ns ? `${this.ns}:${namespace}` : namespace,
      level: overrides.level ?? this.minLevel,
      jsonMode: overrides.jsonMode ?? this.jsonMode,
      enableTimestamp: overrides.enableTimestamp ?? this.ts,
      truncate: overrides.truncate ?? this.cut,
      transport: overrides.transport ?? this.out,
    });
  }

  setLevel(level: LogLevel) { this.minLevel = level; }

  debug(msg: string, ...meta: Meta[]) { this._emit(LogLevel.DEBUG, msg, meta); }
  info (msg: string, ...meta: Meta[]) { this._emit(LogLevel.INFO,  msg, meta); }
  warn (msg: string, ...meta: Meta[]) { this._emit(LogLevel.WARN,  msg, meta); }
  error(msg: string, err?: unknown, ...meta: Meta[]) {
    // 统一 Error 展示
    const packed = err instanceof Error
      ? { name: err.name, message: err.message, stack: err.stack }
      : err;
    this._emit(LogLevel.ERROR, msg, packed !== undefined ? [packed, ...meta] : meta);
  }

  /** 计时工具 */
  time(label: string) {
    const start = performance?.now?.() ?? Date.now();
    return () => {
      const end = performance?.now?.() ?? Date.now();
      this.debug(`⏱ ${label}`, { ms: +(end - start).toFixed(2) });
    };
  }

  private _emit(level: LogLevel, msg: string, metaArr: Meta[]) {
    if (level > this.minLevel) return;
    const prefixTs = this.ts ? new Date().toISOString() : '';
    const prefixNs = this.ns ? `[${this.ns}]` : '';
    const tag = levelToTag(level);

    if (this.jsonMode) {
      const payload = {
        t: this.ts ? Date.now() : undefined,
        ts: this.ts ? prefixTs : undefined,
        level: tag,
        ns: this.ns,
        msg,
        meta: metaArr.length ? metaArr : undefined,
      };
      const s = truncate(safeStringify(payload), this.cut);
      this.out.log(level, s);
    } else {
      // 拼接文本行 + 可选元数据
      const head = [prefixTs, tag, prefixNs].filter(Boolean).join(' ');
      const base = head ? `${head} ${msg}` : msg;
      if (!metaArr.length) {
        this.out.log(level, base);
      } else if (metaArr.length === 1 && (typeof metaArr[0] === 'string')) {
        this.out.log(level, `${base} ${truncate(String(metaArr[0]), this.cut)}`);
      } else {
        // 将复杂 meta 统一安全序列化并截断
        const meta = truncate(safeStringify(metaArr.length === 1 ? metaArr[0] : metaArr), this.cut);
        this.out.log(level, base, meta);
      }
    }
  }
}

/** 根据环境推断默认级别：
 * - 如果有 DEBUG/LOCAL_STORAGE.DEBUG/VERBOSE，则 DEBUG 级
 * - 生产默认 INFO
 */
function inferDefaultLevel(): LogLevel {
  // 浏览器：localStorage.DEBUG = "*" 或包含命名空间
  try {
    // eslint-disable-next-line no-undef
    const dbg = typeof localStorage !== 'undefined' ? localStorage.getItem('DEBUG') : null;
    if (dbg && dbg.length) return LogLevel.DEBUG;
  } catch { /* ignore */ }

  // Node：process.env.DEBUG / VERBOSE / NODE_ENV
  // eslint-disable-next-line no-undef
  try {
    // @ts-ignore - process may not be defined in browser
    const env = typeof process !== 'undefined' && process.env ? process.env : undefined;
    if (env?.DEBUG || env?.VERBOSE === '1' || env?.VERBOSE === 'true') return LogLevel.DEBUG;
    if (env?.NODE_ENV === 'production') return LogLevel.INFO;
  } catch {
    // ignore if process is not available
  }
  return LogLevel.DEBUG;
}

/** -------- 工厂 & 默认实例 -------- */

export function createLogger(opts?: LoggerOptions) {
  return new Logger(opts);
}

// 默认全局实例（命名空间：app）
const defaultLogger = new Logger({ namespace: 'app' });

/** -------- 兼容层（向后兼容你原有的形状） --------
 * 保留 log/warn/error 签名：(msg: string, data?: any, limit?: number)
 * - limit 将作为截断长度处理
 */
export const logger = {
  log: (msg: string, data?: unknown, limit?: number) => {
    const l = defaultLogger.child('compat', { truncate: limit });
    if (data === undefined) { l.info(msg); }
    else { l.info(msg, data); }
  },
  warn: (msg: string, data?: unknown, limit?: number) => {
    const l = defaultLogger.child('compat', { truncate: limit });
    if (data === undefined) { l.warn(msg); }
    else { l.warn(msg, data); }
  },
  error: (msg: string, data?: unknown, limit?: number) => {
    const l = defaultLogger.child('compat', { truncate: limit });
    if (data === undefined) { l.error(msg); }
    else { l.error(msg, data); }
  },
};

/** -------- 兼容层：LoggingAdapter（向后兼容） --------
 * 为了保持与旧代码的兼容性，提供一个简单的适配器类
 */
export class LoggingAdapter {
  private verbose: boolean
  private logger: Logger

  constructor(verbose: boolean = false) {
    this.verbose = verbose
    this.logger = createLogger({ 
      namespace: 'adapter',
      level: verbose ? LogLevel.DEBUG : LogLevel.INFO 
    })
  }

  log(msg: string, data?: unknown, limit?: number) {
    if (data === undefined) {
      this.logger.info(msg)
    } else {
      this.logger.info(msg, data)
    }
  }

  warn(msg: string, data?: unknown, limit?: number) {
    if (data === undefined) {
      this.logger.warn(msg)
    } else {
      this.logger.warn(msg, data)
    }
  }

  error(msg: string, data?: unknown, limit?: number) {
    if (data === undefined) {
      this.logger.error(msg)
    } else {
      this.logger.error(msg, data)
    }
  }
}

/** -------- 使用示例 --------
const log = createLogger({ namespace: 'svc:inspiration', level: LogLevel.INFO, truncate: 2_000 });

// 简单用法
log.info('service started', { port: 8080 });

// 性能计时
const stop = log.time('fetchJourney');
await fetch(...);
stop();

// 错误展示
try { ... } catch (e) {
  log.error('failed to build itinerary', e, { uid, reqId });
}

// 开启 DEBUG（浏览器）：localStorage.setItem('DEBUG', '*')
// 关闭：localStorage.removeItem('DEBUG')
*/
