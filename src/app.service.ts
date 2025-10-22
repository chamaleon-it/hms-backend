import { Injectable } from '@nestjs/common';
import os from 'os';

@Injectable()
export class AppService {
  getHello() {
    const time = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const totalMem = os.totalmem(),
      freeMem = os.freemem(),
      usedMem = totalMem - freeMem;
    const cpus = os.cpus();
    const cpuUsage =
      (cpus.reduce((acc, c) => {
        const t = Object.values(c.times).reduce((a, b) => a + b, 0);
        return acc + (t - c.times.idle) / t;
      }, 0) /
        cpus.length) *
      100;
    const memory = {
      totalMB: (totalMem / 1024 / 1024).toFixed(2),
      usedMB: (usedMem / 1024 / 1024).toFixed(2),
      freeMB: (freeMem / 1024 / 1024).toFixed(2),
      usagePercent: ((usedMem / totalMem) * 100).toFixed(2),
    };
    return {
      message: 'Server is running smoothly 🚀',
      data: { time, cpu: cpuUsage.toFixed(2), memory },
    };
  }
}
