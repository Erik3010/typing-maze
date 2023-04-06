export const easeAnimation = (distance, frame, step) => {
  frame /= step / 2;
  if (frame < 1) {
    return (distance / 2) * Math.pow(frame, 3);
  }
  frame -= 2;
  return (distance / 2) * (Math.pow(frame, 3) + 2);
};
