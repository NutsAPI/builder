import { exploreEndpoint, isHttpRequestMethod } from '@src/exploreEndpoints';
import { join, resolve } from 'path';

it('exploreEndpoint(mock)', async () => {
  const pathRoot = resolve('./test/mocks/exploreEndpoints');
  const mockData = [
    { 
      uri: '/reset',
      files: [
        { method: 'POST', filePath: join(pathRoot, 'reset.post.ts') },
      ],
    },
    { 
      uri: '/task',
      files: [
        { method: 'GET', filePath: join(pathRoot, 'task.get.ts') },
        { method: 'POST', filePath: join(pathRoot, 'task.post.ts') },
        { method: 'DELETE', filePath: join(pathRoot, 'task.delete.ts') },
      ],
    },
    { 
      uri: '/user/changePassword',
      files: [
        { method: 'POST', filePath: join(pathRoot, 'user/changePassword.post.ts') },
      ],
    },
    { 
      uri: '/user/login',
      files: [
        { method: 'POST', filePath: join(pathRoot, 'user/login.post.ts') },
      ],
    },
    { 
      uri: '/user/register',
      files: [
        { method: 'POST', filePath: join(pathRoot, 'user/register.post.ts') },
      ],
    },
    { 
      uri: '/user/team/delete',
      files: [
        { method: 'POST', filePath: join(pathRoot, 'user/team/delete.post.ts') },
      ],
    },
    { 
      uri: '/user/team/members',
      files: [
        { method: 'GET', filePath: join(pathRoot, 'user/team/members.get.ts') },
        { method: 'POST', filePath: join(pathRoot, 'user/team/members.post.ts') },
      ],
    },
    { 
      uri: '/version/api',
      files: [
        { method: 'GET', filePath: join(pathRoot, 'version/api.get.ts') },
      ],
    },
    { 
      uri: '/version/web',
      files: [
        { method: 'GET', filePath: join(pathRoot, 'version/web.get.ts') },
      ],
    },
  ];
  expect(await exploreEndpoint(pathRoot, '/')).toStrictEqual(mockData);
});

it('isHttpRequestMethod', () => {
  expect(isHttpRequestMethod('GET')).toBe(true);
  expect(isHttpRequestMethod('POST')).toBe(true);
  expect(isHttpRequestMethod('GETS')).toBe(false);
  expect(isHttpRequestMethod('get')).toBe(false);
  expect(isHttpRequestMethod('')).toBe(false);
});
