/**
 * File Handling API (PWA) - 当用户通过「打开方式」用 CalmMD 打开 .md 文件时，
 * launchQueue 会收到文件句柄，此处负责消费并回调。
 * 仅 Chromium 系浏览器（Chrome/Edge）支持。
 */

type FileLaunchHandler = (file: File) => void;

let handler: FileLaunchHandler | null = null;

export function setFileLaunchHandler(cb: FileLaunchHandler | null) {
  handler = cb;
}

export function initLaunchQueue() {
  if (typeof window === "undefined") {
    return;
  }

  const win = window as Window & {
    launchQueue?: {
      setConsumer: (consumer: (params: { files: FileSystemFileHandle[] }) => void) => void;
    };
  };

  const launchQueue = win.launchQueue;
  if (!launchQueue) {
    return;
  }

  launchQueue.setConsumer(async (launchParams) => {
    const files = launchParams.files;
    if (!files?.length || !handler) {
      return;
    }

    for (const handle of files) {
      if (handle.kind === "file") {
        try {
          const file = await handle.getFile();
          handler(file);
          break;
        } catch {
          // 用户可能拒绝授权，忽略
        }
      }
    }
  });
}
