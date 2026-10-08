import { hashPassword, verifyPassword } from './password';

describe('senhas scrypt', () => {
  it('usa salt aleatório e verifica senha sem armazenar texto puro', async () => {
    const password = 'senha-exclusiva-do-teste';
    const one = await hashPassword(password);
    const two = await hashPassword(password);
    expect(one).not.toBe(two);
    expect(one).not.toContain(password);
    expect(await verifyPassword(password, one)).toBe(true);
    expect(await verifyPassword('incorreta', one)).toBe(false);
    expect(await verifyPassword(password, 'invalid')).toBe(false);
  });
});
