/**
 * Test Logger - Structured logging for test debugging and audit
 * Node.js native implementation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface TestLogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';
  testName: string;
  message: string;
  data?: any;
  error?: Error;
}

export class TestLogger {
  private logDir: string;
  private testName: string;
  private logFile: string;
  private startTime: number;

  constructor(testName: string) {
    this.testName = testName;
    this.startTime = Date.now();
    
    // Create timestamp-based directory
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .substring(0, 19); // YYYY-MM-DDTHH-MM-SS
    
    this.logDir = path.join('logs', timestamp, 'unit-tests');
    this.logFile = path.join(this.logDir, `${testName}.test.log`);
    
    this.ensureLogDirectory();
    this.writeTestHeader();
  }

  private ensureLogDirectory(): void {
    try {
      fs.mkdirSync(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  private writeTestHeader(): void {
    const header = [
      `=====================================`,
      `Test Run: ${this.testName}`,
      `Started: ${new Date().toISOString()}`,
      `Node.js: ${process.version}`,
      `Platform: ${os.platform()} ${os.arch()}`,
      `Working Directory: ${process.cwd()}`,
      `=====================================`,
      ''
    ].join('\n');

    this.writeToFile(header);
  }

  private writeToFile(content: string): void {
    try {
      fs.appendFileSync(this.logFile, content + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private formatLogEntry(entry: TestLogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level}]`,
      `[${entry.testName}]`,
      entry.message
    ];

    if (entry.data) {
      try {
        const jsonString = JSON.stringify(entry.data, null, 2);
        // Limit data size to prevent serialization issues
        if (jsonString.length > 10000) {
          parts.push('\nData: [Large object truncated for serialization safety]');
        } else {
          parts.push('\nData:', jsonString);
        }
      } catch (error) {
        parts.push('\nData: [Unable to serialize - contains circular references or non-serializable data]');
      }
    }

    if (entry.error) {
      parts.push('\nError:', entry.error.stack || entry.error.message);
    }

    return parts.join(' ');
  }

  info(message: string, data?: any): void {
    const entry: TestLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      testName: this.testName,
      message,
      data
    };

    this.writeToFile(this.formatLogEntry(entry));
  }

  error(message: string, error?: Error, data?: any): void {
    const entry: TestLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      testName: this.testName,
      message,
      ...(error && { error }),
      ...(data && { data })
    };

    this.writeToFile(this.formatLogEntry(entry));
    console.error(`[${this.testName}] ${message}`, error);
  }

  warn(message: string, data?: any): void {
    const entry: TestLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      testName: this.testName,
      message,
      data
    };

    this.writeToFile(this.formatLogEntry(entry));
  }

  debug(message: string, data?: any): void {
    const entry: TestLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      testName: this.testName,
      message,
      data
    };

    this.writeToFile(this.formatLogEntry(entry));
  }

  testStart(testCase: string): void {
    this.info(`🧪 Starting test case: ${testCase}`);
  }

  testEnd(testCase: string, success: boolean, duration?: number): void {
    const status = success ? '✅ PASS' : '❌ FAIL';
    const durationText = duration ? ` (${duration}ms)` : '';
    this.info(`${status} Test case: ${testCase}${durationText}`);
  }

  expectation(expected: any, actual: any, passed: boolean): void {
    this.debug(`Expectation ${passed ? 'PASSED' : 'FAILED'}`, {
      expected,
      actual,
      passed
    });
  }

  summary(): void {
    const duration = Date.now() - this.startTime;
    const footer = [
      '',
      `=====================================`,
      `Test Run Completed: ${this.testName}`,
      `Duration: ${duration}ms`,
      `Ended: ${new Date().toISOString()}`,
      `Log File: ${this.logFile}`,
      `=====================================`
    ].join('\n');

    this.writeToFile(footer);
    console.log(`📄 Test log written to: ${this.logFile}`);
  }

  static createLogger(testName: string): TestLogger {
    return new TestLogger(testName);
  }
}
