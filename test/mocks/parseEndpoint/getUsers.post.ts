import type { Empty, User } from './base';

export interface UserRequest {
  _id: string
}

export type Request = UserRequest;

export interface Response200 {
  user: User;
  empty: Empty;
}

export type Response404 = Empty;
