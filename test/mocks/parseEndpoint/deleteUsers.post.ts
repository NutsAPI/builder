import type { Empty } from './base';
import type { UserRequest } from './getUsers.post';

export type Request = UserRequest;

export type Response200 = Empty;

export type Response503 = {
  reason: 'a' | 'b' | 'c'
};

