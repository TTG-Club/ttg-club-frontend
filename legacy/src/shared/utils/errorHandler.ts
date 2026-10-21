import isDev from '@/shared/utils/isDev';

export const errorHandler = (err: any) => {
  if (isDev) {
    console.error(err);
  }
};
