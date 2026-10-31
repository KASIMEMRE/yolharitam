// Tüm yazılımcı yol haritaları ve onlarla çalışan SAF yardımcılar (React/Supabase içermez).
import { AI_ENGINEER } from './ai-engineer';
import { ANDROID } from './android';
import { AWS } from './aws';
import { BACKEND } from './backend';
import { CSHARP } from './csharp';
import { CYBER_SECURITY } from './cyber-security';
import { DATA_ENGINEER } from './data-engineer';
import { DATA_SCIENTIST } from './data-scientist';
import { DEVOPS } from './devops';
import { DOCKER } from './docker';
import { DSA } from './dsa';
import { FRONTEND } from './frontend';
import { FULLSTACK } from './fullstack';
import { GAME_DEV } from './game-dev';
import { GIT } from './git';
import { GO } from './go';
import { IOS } from './ios';
import { JAVA } from './java';
import { JAVASCRIPT } from './javascript';
import { KUBERNETES } from './kubernetes';
import { LINUX } from './linux';
import { MLOPS } from './mlops';
import { MOBILE } from './mobile';
import { NEXTJS } from './nextjs';
import { NODEJS } from './nodejs';
import { PYTHON } from './python';
import { QA_ENGINEER } from './qa-engineer';
import { REACT } from './react';
import { RUST } from './rust';
import { SQL } from './sql';
import { SYSTEM_DESIGN } from './system-design';
import { TYPESCRIPT } from './typescript';
import type { DevRoadmap, RoadmapKind, Section, Topic } from './types';

export type * from './types';

// Seçim ekranındaki sıra: önce roller, sonra beceriler
export const DEV_ROADMAPS: DevRoadmap[] = [
  // Roller
  FRONTEND,
  BACKEND,
  FULLSTACK,
  MOBILE,
  IOS,
  ANDROID,
  DEVOPS,
  AI_ENGINEER,
  MLOPS,
  DATA_SCIENTIST,
  DATA_ENGINEER,
  CYBER_SECURITY,
  QA_ENGINEER,
  GAME_DEV,
  // Beceriler
  JAVASCRIPT,
  TYPESCRIPT,
  PYTHON,
  JAVA,
  CSHARP,
  GO,
  RUST,
  REACT,
  NEXTJS,
  NODEJS,
  SQL,
  DSA,
  GIT,
  LINUX,
  DOCKER,
  KUBERNETES,
  AWS,
  SYSTEM_DESIGN,
];

export const KIND_LABEL: Record<RoadmapKind, string> = {
  role: 'Rol yol haritası',
  skill: 'Beceri yol haritası',
};

const BY_ID = new Map(DEV_ROADMAPS.map((r) => [r.id, r]));

// Veritabanındaki topic_path ile haritayı bulur. Eski sürümden kalan konu yolları ('sports/…')
// burada bulunamaz → undefined döner ve ekran "yeni bir harita seç" der (çökmez).
export function getRoadmap(id?: string | null): DevRoadmap | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function allTopics(map: DevRoadmap): Topic[] {
  return map.sections.flatMap((s) => s.topics);
}

export function findTopic(map: DevRoadmap, topicId: string): { topic: Topic; section: Section } | undefined {
  for (const section of map.sections) {
    const topic = section.topics.find((t) => t.id === topicId);
    if (topic) return { topic, section };
  }
  return undefined;
}

export function countTopics(map: DevRoadmap) {
  const topics = allTopics(map);
  return { total: topics.length, core: topics.filter((t) => t.marker === 'core').length };
}
