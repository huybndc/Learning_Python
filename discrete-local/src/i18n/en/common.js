export const common = {
  /* app shell */
  'app.short': 'Discrete Math',
  'app.book': 'Mathematics for Computer Science (MIT 6.042J)',
  'nav.ch1': 'Propositions & logic',
  'nav.ch6': 'Divisibility & gcd',
  'nav.ch7': 'Congruences & RSA',

  /* errors from logic/ */
  'err.propEmpty': 'No formula yet.',
  'err.propParen': 'Missing ) (position {pos}).',
  'err.propChar': 'Unexpected "{ch}" at position {pos}. Variables are lowercase p…z; operators: ¬ ∧ ∨ ⊕ → ↔ (or ~ & | -> <->).',
  'err.propEnd': 'The formula ends too early (position {pos}).',
  'err.propNode': 'Unknown node in the formula: {t}.',
  'err.needInt': 'An integer is needed.',
  'err.modPositive': 'The modulus n must be positive.',
  'err.needNonNeg': 'The exponent must be non-negative.',
  'err.needPositive': 'A positive integer is needed.',
  'err.rsaE': 'e = {e} is not coprime to φ = {phi}, so there is no d.',
  'err.tooBig': 'Number too large to compute exactly (n up to about 94 million).',
  'err.badQuizKind': 'Invalid question type: {kind}.',
  'err.prefix': 'Error: ',
};
