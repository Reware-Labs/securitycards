import {
  siAiohttp,
  siActix,
  siAxios,
  siCaddy,
  siCheerio,
  siDjango,
  siDotnet,
  siDrizzle,
  siExpress,
  siFastapi,
  siFastify,
  siFlask,
  siGin,
  siGo,
  siHono,
  siJinja,
  siJavascript,
  siJsonwebtokens,
  siKoa,
  siLaravel,
  siLangchain,
  siMongoose,
  siNestjs,
  siOpenjdk,
  siPython,
  siPrisma,
  siPydantic,
  siPhp,
  siQuarkus,
  siReact,
  siRuby,
  siRubyonrails,
  siSpring,
  siSqlalchemy,
  siSvelte,
  siSwift,
  siTypescript,
  siTypeorm,
  siVapor,
  siVllm,
  siRust,
  type SimpleIcon,
} from 'simple-icons';

export interface LogoDefinition {
  title: string;
  path: string;
  source: 'library' | 'language';
}

const languageIcons: Record<string, SimpleIcon> = {
  'c#': siDotnet,
  csharp: siDotnet,
  go: siGo,
  java: siOpenjdk,
  javascript: siJavascript,
  php: siPhp,
  python: siPython,
  ruby: siRuby,
  rust: siRust,
  swift: siSwift,
  typescript: siTypescript,
};

const libraryIcons: Record<string, SimpleIcon> = {
  'actix-web': siActix,
  aiohttp: siAiohttp,
  axios: siAxios,
  caddy: siCaddy,
  cheerio: siCheerio,
  django: siDjango,
  'drizzle-orm': siDrizzle,
  express: siExpress,
  fastapi: siFastapi,
  fastify: siFastify,
  flask: siFlask,
  gin: siGin,
  hono: siHono,
  jinja: siJinja,
  koa: siKoa,
  laravel: siLaravel,
  langchain: siLangchain,
  mongoose: siMongoose,
  nest: siNestjs,
  pyjwt: siJsonwebtokens,
  prisma: siPrisma,
  pydantic: siPydantic,
  quarkus: siQuarkus,
  react: siReact,
  rails: siRubyonrails,
  'spring-framework': siSpring,
  sqlalchemy: siSqlalchemy,
  'svelte-kit': siSvelte,
  'type-orm': siTypeorm,
  vapor: siVapor,
  vllm: siVllm,
};

export function getLibraryLogo(language: string, library: string): LogoDefinition | null {
  const libraryIcon = libraryIcons[library.toLowerCase()];
  const icon = libraryIcon ?? languageIcons[language.toLowerCase()];
  if (!icon) return null;
  return {
    title: libraryIcon ? icon.title : `${icon.title} language`,
    path: icon.path,
    source: libraryIcon ? 'library' : 'language',
  };
}
