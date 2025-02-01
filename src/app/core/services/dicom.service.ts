import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import * as chokidar from 'chokidar';
import { Subject } from 'rxjs';
import * as notifier from 'node-notifier';
import { I18nService } from 'nestjs-i18n';
import { InitialConfigService } from './config.service';

@Injectable()
export class DicomService implements OnModuleInit, OnApplicationShutdown {
  private readonly watchDir: string;
  private readonly outputDir: string;
  private readonly port: number;
  private sseSubject = new Subject<string>();
  private wadoServerProcess: ChildProcess | null = null; // Armazena a referência ao processo do WADO Server

  constructor(
    private readonly i18n: I18nService,
    private readonly configService: InitialConfigService,
  ) {
    this.watchDir = this.configService.inputFilesDir;
    this.outputDir = this.configService.outputFilesDir;
    this.port = this.configService.wadoServerPort;
  }

  onModuleInit() {
    this.startMonitoring();
    this.startWadoServer();
  }

  onApplicationShutdown() {
    this.stopWadoServer(); // Encerra o processo ao desligar o módulo
  }

  get sseStream() {
    return this.sseSubject.asObservable();
  }

  private startMonitoring() {
    const watcher = chokidar.watch(this.watchDir, {
      persistent: true,
      ignoreInitial: false,
      depth: 1,
    });

    let debounceTimeout: NodeJS.Timeout;

    watcher.on('add', (filePath) => {
      if (filePath.endsWith('.dcm')) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          this.runStaticWadoCreator();
          this.sseSubject.next(
            `${this.i18n.t('messages.NEW_FILE_DETECTED')}: ${filePath}`,
          );
          this.sendSystemNotification(
            this.i18n.t('messages.NEW_FILE_DETECTED'),
            `${this.i18n.t('messages.FILE_DETECTED')}: ${filePath}`,
          );
        }, 1000);
      }
    });
  }

  private runStaticWadoCreator() {
    const creatorProcess = spawn('node', [
      'packages/static-wado-creator/bin/mkdicomweb.js',
      this.watchDir,
      '-o',
      this.outputDir,
    ]);

    creatorProcess.stdout.on('data', (data) => {
      console.log(`static-wado-creator: ${data}`);
    });

    creatorProcess.stderr.on('data', (data) => {
      console.error(`static-wado-creator error: ${data}`);
    });

    creatorProcess.on('close', (code) => {
      console.log(`static-wado-creator process exited with code ${code}`);
      this.sseSubject.next(this.i18n.t('messages.PROCESSING_COMPLETED'));
      this.sendSystemNotification(
        this.i18n.t('messages.PROCESSING_COMPLETED'),
        this.i18n.t('messages.ALL_FILES_PROCESSED'),
      );
    });
  }

  private sendSystemNotification(title: string, message?: string) {
    notifier.notify({
      title,
      message,
      sound: true,
    });
  }

  private startWadoServer() {
    this.wadoServerProcess = spawn('node', [
      'packages/static-wado-webserver/bin/dicomwebserver.mjs',
      '-p',
      this.port.toString(),
      '-o',
      this.outputDir,
    ]);

    this.wadoServerProcess.stdout.on('data', (data) => {
      console.log(`static-wado-webserver: ${data}`);
    });

    this.wadoServerProcess.stderr.on('data', (data) => {
      console.error(`static-wado-webserver error: ${data}`);
    });

    this.wadoServerProcess.on('close', (code) => {
      console.log(`static-wado-webserver process exited with code ${code}`);
    });

    console.log(`WADO Server started on port ${this.port}`);
  }

  private stopWadoServer() {
    if (this.wadoServerProcess) {
      console.log('Stopping WADO Server...');
      this.wadoServerProcess.kill(); // Encerra o processo do WADO Server
      this.wadoServerProcess = null;
    }
  }
}