import assert from 'node:assert/strict';
import { test } from 'node:test';
import { editLink, isHttpUrl, parseDuration, pickWinners } from '../src/util.js';

test('parseDuration', () => {
  assert.equal(parseDuration('30m'), 30 * 60_000);
  assert.equal(parseDuration('1d12h'), 36 * 3_600_000);
  assert.equal(parseDuration('abc'), null);
  assert.equal(parseDuration('0m'), null);
  assert.equal(parseDuration(''), null);
});

test('pickWinners returns unique entries, capped at pool size', () => {
  const entries = ['a', 'b', 'c'];
  const winners = pickWinners(entries, 5);
  assert.equal(winners.length, 3);
  assert.equal(new Set(winners).size, 3);
  assert.deepEqual(entries, ['a', 'b', 'c']);
  assert.deepEqual(pickWinners([], 2), []);
});

test('isHttpUrl', () => {
  assert.ok(isHttpUrl('https://example.com/x'));
  assert.ok(!isHttpUrl('javascript:alert(1)'));
  assert.ok(!isHttpUrl('nope'));
});

test('editLink changes fields, renames in place and validates', () => {
  const links = {
    a: { url: 'https://a.example', description: 'A' },
    b: { url: 'https://b.example', description: 'B' },
  };
  const edited = editLink(links, 'a', { url: 'https://neu.example' });
  assert.deepEqual(edited.links.a, { url: 'https://neu.example', description: 'A' });
  assert.equal(links.a.url, 'https://a.example');

  const renamed = editLink(links, 'a', { newName: 'c', description: 'C' });
  assert.deepEqual(Object.keys(renamed.links), ['c', 'b']);
  assert.deepEqual(renamed.links.c, { url: 'https://a.example', description: 'C' });

  assert.equal(editLink(links, 'x', { url: 'https://x.example' }).error, 'missing');
  assert.equal(editLink(links, 'a', {}).error, 'nothing');
  assert.equal(editLink(links, 'a', { url: 'nope' }).error, 'invalid-url');
  assert.equal(editLink(links, 'a', { newName: 'b' }).error, 'exists');
});
