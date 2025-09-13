import { createPromiseWithResolvers } from '../../shared/lib/promise-with-resolvers'

export enum RenderStage {
  Static = 1,
  Runtime = 2,
  Dynamic = 3,
}

export interface StagedRenderController {
  currentStage: RenderStage
  advanceStage(stage: RenderStage.Runtime | RenderStage.Dynamic): void
}

export class ThreePhaseStagedRenderController {
  currentStage: RenderStage = RenderStage.Static

  runtimeStagePromise = createPromiseWithResolvers<void>()
  dynamicStagePromise = createPromiseWithResolvers<void>()

  advanceStage(stage: RenderStage.Runtime | RenderStage.Dynamic) {
    if (this.currentStage === stage) {
      return
    }
    this.currentStage = stage
    if (stage === RenderStage.Runtime) {
      this.runtimeStagePromise.resolve()
    } else if (stage === RenderStage.Dynamic) {
      this.runtimeStagePromise.resolve() // we might be going directly from Static to Dynamic.
      this.dynamicStagePromise.resolve()
    }
  }
}

export class TwoPhaseStagedRenderController {
  currentStage: RenderStage = RenderStage.Static

  advanceStage(stage: RenderStage.Runtime | RenderStage.Dynamic) {
    if (this.currentStage === stage) {
      return
    }
    this.currentStage = RenderStage.Dynamic
  }
}

export function getEnvironmentNameForStage(currentStage: RenderStage): string {
  switch (currentStage) {
    case RenderStage.Static:
      return 'Prerender'
    case RenderStage.Runtime:
      return 'Runtime Prerender'
    case RenderStage.Dynamic:
      return 'Server'
    default:
      currentStage satisfies never
      return 'Unknown'
  }
}
