/** Real EAN-13 encoder (L/G/R tables) so the drawn barcode is a valid, structured symbol. */
const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
const R = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

export function ean13(twelve: string) {
  const d = twelve.split("").map(Number);
  const sum = d.reduce((s, v, i) => s + v * (i % 2 ? 3 : 1), 0);
  const full = twelve + ((10 - (sum % 10)) % 10);
  const p = PARITY[d[0]];
  let bits = "101";
  for (let i = 1; i <= 6; i++) bits += (p[i - 1] === "L" ? L : G)[+full[i]];
  bits += "01010";
  for (let i = 7; i <= 12; i++) bits += R[+full[i]];
  bits += "101";
  return { digits: full, bits };
}
