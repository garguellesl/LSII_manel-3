import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { THEME_STORAGE_KEY } from '../theme';

const bootstrap = readFileSync(resolve(process.cwd(), 'public/theme-init.js'), 'utf8');
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

describe('pre-render theme bootstrap', () => {
  it.each([
    ['light', 'light'],
    ['dark', 'dark'],
    [null, 'dark'],
    ['corrupt', 'dark'],
  ])('applies stored %s as %s without React', (stored, expected) => {
    const root = { dataset: {} as Record<string, string>, style: {} as Record<string, string> };
    const storage = { getItem: jest.fn(() => stored) };
    runInNewContext(bootstrap, { document: { documentElement: root }, window: { localStorage: storage } });
    expect(storage.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
    expect(root.dataset).toEqual({ theme: expected, bsTheme: expected });
    expect(root.style.colorScheme).toBe(expected);
  });

  it('survives unavailable storage before the body exists', () => {
    const root = { dataset: {} as Record<string, string>, style: {} as Record<string, string> };
    runInNewContext(bootstrap, {
      document: { documentElement: root },
      window: {
        get localStorage() {
          throw new Error('denied');
        },
      },
    });
    expect(root.dataset.theme).toBe('dark');
  });

  it('loads the blocking initializer and theme stylesheet in head before the application', () => {
    const init = html.indexOf('<script src="/theme-init.js"></script>');
    const css = html.indexOf('<link rel="stylesheet" href="/themes.css"');
    const body = html.indexOf('<body>');
    expect(init).toBeGreaterThan(0);
    expect(css).toBeGreaterThan(init);
    expect(body).toBeGreaterThan(css);
    expect(html).toContain('data-theme="dark"');
  });

  it('keeps component palettes centralized, including comments and avatar identity', () => {
    for (const file of ['src/App.css', 'src/components/comments.css', 'src/components/UserAvatar.tsx']) {
      const source = readFileSync(resolve(process.cwd(), file), 'utf8');
      expect(source).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
    }
  });
});
