import 'package:flutter_test/flutter_test.dart';

import 'package:kidplayai_mobile/url_validator.dart';

void main() {
  test('rejects null and empty', () {
    expect(validateSandboxPreviewUrl(null), isNull);
    expect(validateSandboxPreviewUrl(''), isNull);
    expect(validateSandboxPreviewUrl('   '), isNull);
  });

  test('rejects URLs with mismatched origin', () {
    expect(
      validateSandboxPreviewUrl(
        'https://example.com/api/sandbox/abc/preview',
      ),
      isNull,
    );
  });

  test('rejects valid origin but wrong path', () {
    expect(
      validateSandboxPreviewUrl('http://localhost:9512/api/sandbox/abc'),
      isNull,
    );
    expect(
      validateSandboxPreviewUrl('http://localhost:9512/'),
      isNull,
    );
  });

  test('accepts valid sandbox preview URL on default origin', () {
    final url = validateSandboxPreviewUrl(
      'http://localhost:9512/api/sandbox/abc-123/preview',
    );
    expect(url, 'http://localhost:9512/api/sandbox/abc-123/preview');
  });
}
