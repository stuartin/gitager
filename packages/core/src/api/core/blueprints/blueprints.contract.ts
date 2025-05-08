import { z } from 'zod';

export const ComponentsSchema = z.object({
  id: z.string().cuid2().describe('The component id'),
  name: z.string().describe('The name of the component'),
  type: z.literal('plopjs'),
  dependsOn: z.string().optional(),
  inputs: z.object({
    git: z.string().url(),
    plopFile: z.string(),
    plopInputs: z.record(z.string()),
  }),
  outputs: z.record(z.string()).optional(),
});

export const BlueprintsSchema = z.object({
  id: z.string().cuid2().describe('The service id'),
  name: z.string().describe('The name of the service'),
  components: ComponentsSchema.array(),
});

export type BluePrint = z.infer<typeof BlueprintsOptionsSchema>;
export const BlueprintsOptionsSchema = BlueprintsSchema
  .omit({ id: true })
  .extend({
    components: ComponentsSchema.omit({ id: true }).array(),
  });
