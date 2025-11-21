import { confirmBus } from './confirmBus';

export function confirm(message: string, title?: string): Promise<boolean> {
  return new Promise((resolve) => {
    confirmBus.emit('open', { message, title, resolve });
  });
}
