import { ForbiddenErrorPage } from './forbidden';
import { InternalServerErrorPage } from './internal-server';
import { NotFoundErrorPage } from './not-found';
import { UnauthorizedErrorPage } from './unauthorized';
import { UnknownErrorPage } from './unknown';

import type { RouteRecordRaw } from 'vue-router';

export const ErrorPage: RouteRecordRaw = {
  name: 'error-page',
  path: '/error',
  children: [
    ForbiddenErrorPage,
    InternalServerErrorPage,
    NotFoundErrorPage,
    UnauthorizedErrorPage,
    UnknownErrorPage
  ]
};
