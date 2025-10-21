import humanId from "human-id";

export function generatePublicName() {
  return humanId({
    separator: "-",
    addAdverb: true,
    capitalize: false,
  });
}
