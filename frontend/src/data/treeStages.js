export const treeStages = [
  { name: 'Seed', minProgress: 0 },
  { name: 'Sprout', minProgress: 25 },
  { name: 'Small Tree', minProgress: 50 },
  { name: 'Mature Tree', minProgress: 75 },
  { name: 'Blooming Tree', minProgress: 100 },
]

export function getTreeStage(progress) {
  return treeStages.reduce(
    (currentStage, stage) =>
      progress >= stage.minProgress ? stage : currentStage,
    treeStages[0],
  )
}
