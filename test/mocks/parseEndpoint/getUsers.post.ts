import type { Empty, User } from './base';

export interface Request {
  _id: string
}

export interface Response200 {
  user: User;
  empty: Empty;
}

export type Response404 = Empty;
