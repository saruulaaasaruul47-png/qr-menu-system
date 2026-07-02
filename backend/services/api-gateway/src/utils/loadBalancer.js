export const createRoundRobin = (targets) => {
  let index = 0;

  return () => {
    const target = targets[index % targets.length];
    index += 1;
    return target;
  };
};
