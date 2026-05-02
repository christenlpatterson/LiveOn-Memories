import type { Milestone } from './types';

const embeddedModules = import.meta.glob('./embeddedScrapbook.generated.ts', {
  eager: true,
}) as Record<string, { embeddedMilestones?: Milestone[] }>;

export async function getEmbeddedMilestones(): Promise<Milestone[]> {
  const generatedModule = Object.values(embeddedModules)[0];
  return generatedModule?.embeddedMilestones ?? [];
}
