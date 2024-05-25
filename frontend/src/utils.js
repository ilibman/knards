export function getNewScore(score) {
  let upScore, downScore, seq = [0, 1], n1 = 1, n2 = 1;
  if (isNaN(score)) {
    upScore = 0;
    downScore = 0;
  } else if (score < 0) {
    upScore = 0;
    downScore = 0;
  } else if (score === 0) {
    upScore = 1;
    downScore = 0;
  } else if (score === 1) {
    upScore = 2;
    downScore = 0;
  } else {
    do {
      seq.push(n1 + n2);
      n1 = n2;
      n2 = seq[seq.length - 1];
    } while (n2 !== score);
    seq.push(seq[seq.length - 2] + seq[seq.length - 1]);
  }

  return {
    upScore: seq.length > 2 ? seq[seq.length - 1] : upScore,
    downScore: seq.length > 2 ? seq[seq.length - 3] : downScore,
    downToOneThirdScore:
      seq.length > 2 ? seq[Math.floor(seq.length / 3)] : downScore,
    downToZeroScore: 0
  }
}