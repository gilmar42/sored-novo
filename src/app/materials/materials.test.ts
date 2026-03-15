
import { parseFraction } from '../../utils/measurements';

describe('parseFraction', () => {
  test('converte frações simples corretamente', () => {
    expect(parseFraction('1/2')).toBe(0.5);
    expect(parseFraction('3/4')).toBe(0.75);
    expect(parseFraction('1/4')).toBe(0.25);
  });

  test('converte números mistos corretamente', () => {
    expect(parseFraction('1 1/2')).toBe(1.5);
    expect(parseFraction('2 3/4')).toBe(2.75);
  });

  test('identifica números inteiros corretamente', () => {
    expect(parseFraction('5')).toBe(5);
    expect(parseFraction('10')).toBe(10);
  });

  test('trata decimais com vírgula ou ponto', () => {
    expect(parseFraction('1.5')).toBe(1.5);
    expect(parseFraction('1,5')).toBe(1.5);
  });

  test('retorna 0 para entradas inválidas', () => {
    expect(parseFraction('')).toBe(0);
    expect(parseFraction('abc')).toBe(0);
  });
});
