import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { DicomService } from '../services/dicom.service';

@Controller('events')
export class EventsController {
  constructor(private readonly dicomService: DicomService) {}

  @Get('sse')
  sse(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const subscription = this.dicomService.sseStream.subscribe((message) => {
      res.write(`data: ${JSON.stringify({ message })}\n\n`);
    });

    res.on('close', () => {
      subscription.unsubscribe();
      res.end();
    });
  }
}
