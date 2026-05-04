import type { Milestone } from './types';

export async function getEmbeddedMilestones(): Promise<Milestone[]> {
  const generatedModule = (await import('./embeddedScrapbook.generated')) as {
    embeddedMilestones?: Milestone[];
  };

  return generatedModule.embeddedMilestones ?? [];
}
