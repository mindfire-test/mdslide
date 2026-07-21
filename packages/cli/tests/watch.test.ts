/// <reference types="node" />
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import http from 'http';
import path from 'path';
import net from 'net';
import { watchCommand } from '../src/commands/watch.ts';
import process from 'process';

// Mock chokidar watcher
let watcherChangeHandler: any = null;
let watcherErrorHandler: any = null;
const mockWatcher = {
  on: vi.fn().mockImplementation((event, cb) => {
    if (event === 'change') watcherChangeHandler = cb;
    if (event === 'error') watcherErrorHandler = cb;
    return mockWatcher;
  }),
  close: vi.fn().mockResolvedValue(undefined),
};
const mockWatchSpy = vi.fn().mockReturnValue(mockWatcher);

vi.mock('chokidar', () => ({
  default: {
    watch: (...args: any[]) => mockWatchSpy(...args),
  },
}));

// Mock open package
vi.mock('open', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

// Mock signals/shutdown handler
let shutdownHandler: any = null;
vi.mock('../src/middleware/signals.ts', () => ({
  onShutdown: vi.fn().mockImplementation((cb) => {
    shutdownHandler = cb;
  }),
}));

// Setup conditional mock for compile.ts runCompile
let mockRunCompileThrow = false;
vi.mock('../src/commands/compile.ts', async () => {
  const actual = await vi.importActual<any>('../src/commands/compile.ts');
  return {
    ...actual,
    runCompile: vi.fn().mockImplementation(async (...args) => {
      if (mockRunCompileThrow) {
        throw new Error('mock compilation failure');
      }
      return actual.runCompile(...args);
    }),
  };
});

describe('CLI Watch Command', () => {
  const tmpDir = path.join(__dirname, 'tmp-watch');
  const sampleMd = path.join(tmpDir, 'slides.md');

  let exitSpy: any;
  let logSpy: any;
  let serverSpy: any;
  let netSpy: any;
  let requestListener: any;
  let mockNetPortInUse = false;

  const mockServer = {
    listen: vi.fn((port, hostOrCallback, cb) => {
      const callback = typeof hostOrCallback === 'function' ? hostOrCallback : cb;
      callback?.();
    }),
    close: vi.fn(),
    once: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    mockRunCompileThrow = false;
    mockNetPortInUse = false;
    watcherChangeHandler = null;
    watcherErrorHandler = null;
    shutdownHandler = null;

    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(sampleMd, '# Title\n');

    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((code?: string | number | null | undefined) => {
        throw new Error(`process.exit called with code: ${code}`);
      });
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    requestListener = null;
    serverSpy = vi.spyOn(http, 'createServer').mockImplementation((cb) => {
      requestListener = cb;
      return mockServer as any;
    });

    netSpy = vi.spyOn(net, 'createServer').mockImplementation(() => {
      const mockNetServer = {
        once: vi.fn((event, cb) => {
          if (mockNetPortInUse && event === 'error') {
            setTimeout(() => cb(new Error('EADDRINUSE')), 0);
          } else if (!mockNetPortInUse && event === 'listening') {
            setTimeout(() => cb(), 0);
          }
          return mockNetServer;
        }),
        listen: vi.fn().mockReturnThis(),
        close: vi.fn((cb) => cb?.()),
      };
      return mockNetServer as any;
    });

    mockWatchSpy.mockClear();
    mockWatcher.on.mockClear();
    mockWatcher.close.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    exitSpy.mockRestore();
    logSpy.mockRestore();
    serverSpy.mockRestore();
    netSpy.mockRestore();
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('watchCommand starts HTTP server and watches slide file', async () => {
    await watchCommand(sampleMd, { logLevel: 'silent', port: 3500 });

    expect(serverSpy).toHaveBeenCalled();
    expect(mockServer.listen).toHaveBeenCalledWith(3500, '127.0.0.1', expect.any(Function));
    expect(mockWatchSpy).toHaveBeenCalledWith(path.resolve(sampleMd), { ignoreInitial: true });
    expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
  });

  test('watchCommand opens browser if open option is set to true', async () => {
    const { default: open } = await import('open');
    await watchCommand(sampleMd, { logLevel: 'silent', port: 3500, open: true });
    expect(open).toHaveBeenCalledWith('http://localhost:3500');
  });

  test('watchCommand exits with code 1 if preferred port and all scanned ports are in use', async () => {
    mockNetPortInUse = true;
    await expect(watchCommand(sampleMd, { logLevel: 'silent', port: 3500 })).rejects.toThrow(
      'Port 3500 is already in use'
    );
  });

  test('watchCommand fails and exits if compilation throws error on startup', async () => {
    mockRunCompileThrow = true;
    await expect(watchCommand(sampleMd, { logLevel: 'silent' })).rejects.toThrow(
      'mock compilation failure'
    );
  });

  test('watchCommand fails and exits if input file does not exist', async () => {
    await expect(watchCommand('nonexistent.md', { logLevel: 'silent' })).rejects.toThrow(
      'Input file not found'
    );
  });

  test('request listener handles routes and SSE registration / client disconnection', async () => {
    await watchCommand(sampleMd, { logLevel: 'silent', port: 3500 });
    expect(requestListener).not.toBeNull();

    // Mock response object
    const resWrite = vi.fn();
    const resWriteHead = vi.fn();
    const resEnd = vi.fn();
    const mockRes = {
      writeHead: resWriteHead,
      write: resWrite,
      end: resEnd,
      on: vi.fn(),
    };

    // 1. Live reload SSE stream
    const mockReqSse = { url: '/~live-reload', on: vi.fn() };

    // Capture close listener registered on request
    let sseCloseHandler: any = null;
    mockReqSse.on.mockImplementation((event, cb) => {
      if (event === 'close') sseCloseHandler = cb;
    });

    requestListener(mockReqSse, mockRes);
    expect(resWriteHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        'Content-Type': 'text/event-stream',
      })
    );

    // Trigger close to verify clients list cleanup
    expect(sseCloseHandler).not.toBeNull();
    sseCloseHandler();

    // 2. Normal slide HTML request
    const mockReqHtml = { url: '/', on: vi.fn() };
    requestListener(mockReqHtml, mockRes);
    expect(resWriteHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        'Content-Type': 'text/html; charset=utf-8',
      })
    );
    expect(resEnd).toHaveBeenCalledWith(expect.stringContaining('<!DOCTYPE html>'));
  });

  test('watcher handles change events with debounced successful and failed recompilations', async () => {
    await watchCommand(sampleMd, { logLevel: 'silent', port: 3500 });
    expect(watcherChangeHandler).not.toBeNull();

    // 1. Trigger successful recompile change event
    watcherChangeHandler();
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 2. Trigger failed recompile change event
    mockRunCompileThrow = true;
    watcherChangeHandler();
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Verify error handler logs compiled error page content
    const resWriteHead = vi.fn();
    const resEnd = vi.fn();
    const mockRes = {
      writeHead: resWriteHead,
      write: vi.fn(),
      end: resEnd,
    };
    requestListener({ url: '/' }, mockRes);
    expect(resEnd).toHaveBeenCalledWith(expect.stringContaining('Compilation Error'));
  });

  test('--json emits an NDJSON recompile event line for each save', async () => {
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    await watchCommand(sampleMd, { logLevel: 'silent', port: 3500, json: true });
    expect(watcherChangeHandler).not.toBeNull();

    const startupLine = JSON.parse(writeSpy.mock.calls[0][0] as string);
    expect(startupLine.success).toBe(true);

    watcherChangeHandler();
    await new Promise((resolve) => setTimeout(resolve, 150));

    const recompileLine = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
    expect(recompileLine).toEqual({ event: 'recompile', success: true, slides: 1, warnings: [] });

    mockRunCompileThrow = true;
    watcherChangeHandler();
    await new Promise((resolve) => setTimeout(resolve, 150));

    const failedLine = JSON.parse(writeSpy.mock.calls.at(-1)![0] as string);
    expect(failedLine.event).toBe('recompile');
    expect(failedLine.success).toBe(false);
    expect(failedLine.error).toContain('mock compilation failure');
  });

  test('watcher handles error events gracefully', async () => {
    await watchCommand(sampleMd, { logLevel: 'silent', port: 3500 });
    expect(watcherErrorHandler).not.toBeNull();

    // Trigger error event on chokidar
    watcherErrorHandler(new Error('Chokidar system error'));
  });

  test('shutdown listener terminates http server, watcher, and SSE clients', async () => {
    await watchCommand(sampleMd, { logLevel: 'silent', port: 3500 });
    expect(shutdownHandler).not.toBeNull();

    // Mock client registered
    const resWrite = vi.fn();
    const mockRes = {
      writeHead: vi.fn(),
      write: resWrite,
      end: vi.fn(),
    };
    requestListener({ url: '/~live-reload', on: vi.fn() }, mockRes);

    // Trigger shutdown callback
    shutdownHandler();

    expect(mockServer.close).toHaveBeenCalled();
    expect(mockWatcher.close).toHaveBeenCalled();
    expect(mockRes.end).toHaveBeenCalled();
  });
});
