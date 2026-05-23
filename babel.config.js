/**
 * Babel config for Home Hero.
 *
 * Custom because:
 *   - `@supabase/supabase-js` >= 2.100 contains an optional
 *     `import('@opentelemetry/api')` written as `import(OTEL_PKG)` with
 *     webpack/vite/turbo "ignore" magic comments. Metro doesn't honor those
 *     comments, so the dynamic import survives bundling. Then on iOS the
 *     Hermes bytecode compiler refuses to parse `import(IDENTIFIER)` and
 *     bails the entire Xcode build with "Invalid expression encountered."
 *
 *     The fix below replaces every `import(<identifier-with-OTEL-in-name>)`
 *     with `Promise.resolve(null)` — which is exactly the value Supabase's
 *     `.catch(() => null)` would have yielded when the optional dep is
 *     absent. supabase-js handles null gracefully (tracing is just off).
 *
 *   - Adding any babel.config.js disables Expo's implicit default, so we
 *     have to re-state the preset and re-add the worklets plugin that
 *     react-native-reanimated 4 / react-native-worklets requires.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      stripOtelDynamicImport,
      // Reanimated's worklets transform must come last.
      'react-native-worklets/plugin',
    ],
  };
};

function stripOtelDynamicImport({ types: t }) {
  return {
    name: 'strip-otel-dynamic-import',
    visitor: {
      CallExpression(path) {
        const node = path.node;
        if (
          node.callee.type === 'Import' &&
          node.arguments.length === 1 &&
          t.isIdentifier(node.arguments[0]) &&
          /OTEL/i.test(node.arguments[0].name)
        ) {
          path.replaceWith(
            t.callExpression(
              t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
              [t.nullLiteral()]
            )
          );
        }
      },
    },
  };
}
