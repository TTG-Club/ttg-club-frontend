import type { OptionalParams } from 'js-file-downloader';
import JsFileDownloader from 'js-file-downloader';

export const downloadByUrl = (
  url: string,
  options?: Exclude<OptionalParams, 'autoStart'>
) => new Promise<void>((resolve, reject) => {
  const opts: OptionalParams = {
    autoStart: true,
    ...options
  };

  new JsFileDownloader({
    url,
    ...opts
  })
    .then(() => resolve)
    .catch(error => reject(error));
});
