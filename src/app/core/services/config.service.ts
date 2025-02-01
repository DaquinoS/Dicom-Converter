import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as ini from 'ini';
import * as path from 'path';

@Injectable()
export class InitialConfigService {
  private readonly config: any;

  constructor() {
    const configPath = path.resolve(process.cwd(), 'config.ini');
    this.config = ini.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  get inputFilesDir(): string {
    return this.config.INPUT_FILES_DIR;
  }

  get outputFilesDir(): string {
    return this.config.OUTPUT_FILES_DIR;
  }

  get wadoServerPort(): number {
    return parseInt(this.config.WADO_SERVER_PORT, 10);
  }

  get defaultLanguage(): string {
    return this.config.DEFAULT_LANGUAGE;
  }
}