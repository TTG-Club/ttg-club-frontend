import isDev from '@/shared/helpers/isDev';

export default function errorHandler(err: any) {
  if (isDev) {
    console.error(err);
  }
}
