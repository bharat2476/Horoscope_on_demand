import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    return nextResolve(pathToFileURL(path.join(root, 'src', `${specifier.slice(2)}.ts`)).href, context);
  }
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && path.extname(specifier).length === 0) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
}
