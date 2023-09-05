import isDev from '@/shared/helpers/isDev';

export const errorHandler = (err: any) => {
  if (isDev) {
    console.error(err);
  }
};
