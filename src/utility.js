export const easeAnimation = (distance, frame, step) => {
  frame /= step / 2;
  if (frame < 1) {
    return (distance / 2) * Math.pow(frame, 3);
  }
  frame -= 2;
  return (distance / 2) * (Math.pow(frame, 3) + 2);
};

export const getWords = async () => {
  return await (await fetch("./words.json")).json();
};

export const random = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const degreeToRadian = (degree) => degree * (Math.PI / 180);

export const radianToDegree = (radian) => radian * (180 / Math.PI);

export const padString = (string, fillString = "0", count = 2) =>
  string.padStart(count, fillString);
