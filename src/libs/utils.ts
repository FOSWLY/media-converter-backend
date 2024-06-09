import Sqids from "sqids";

const sqids = new Sqids({
  minLength: 8,
  alphabet: Bun.env.HASH_ALPHABET,
});

export function getUid() {
  const numberCode = +`${Math.floor(Date.now() / 1000)}`;
  return sqids.encode([numberCode]);
}

export function getCurrentDate() {
  return new Date().toLocaleDateString("EN-US").replaceAll("/", "-");
}
