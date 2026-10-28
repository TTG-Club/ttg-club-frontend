import { readdirSync } from 'node:fs';

import { createResolver, defineNuxtModule } from '@nuxt/kit';
import { consola } from 'consola';

// Функция для генерации алиасов
function generateAliases(
  baseDir: string,
  resolver: ReturnType<typeof createResolver>,
  prefix = '~',
): Record<string, string> {
  const aliases: Record<string, string> = {};
  const basePath = resolver.resolve('..', baseDir);

  try {
    const folders = readdirSync(basePath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory() && !/^[_|.]/.test(dirent.name))
      .map((dirent) => dirent.name);

    for (const folder of folders) {
      const alias = `${prefix}${folder}`; // Например, ~spells
      const path = resolver.resolve(basePath, folder);

      if (aliases[alias]) {
        consola.warn(`Коллизия алиаса: ${alias} уже существует. Пропускаем.`);

        continue;
      }

      aliases[alias] = path;
    }
  } catch (error) {
    consola.error(`Ошибка при чтении директории ${baseDir}:`, error);
  }

  return aliases;
}

export default defineNuxtModule({
  meta: {
    name: 'auto-aliases',
    configKey: 'autoAliases',
  },
  defaults: {
    baseDirs: ['app/features'], // По умолчанию только features
    prefix: '~', // Префикс по умолчанию
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const aliases: Record<string, string> = {};

    for (const baseDir of options.baseDirs) {
      Object.assign(
        aliases,
        generateAliases(baseDir, resolver, options.prefix),
      );
    }

    // Добавляем алиасы в nuxt.options.alias
    Object.assign(nuxt.options.alias, aliases);
  },
});
