/// Default public URL baked in at build time.
/// Override at build with: --dart-define=KPAI_PUBLIC_URL=https://kidplayai.techseeding.com.au
const String kpaiPublicUrl = String.fromEnvironment(
  'KPAI_PUBLIC_URL',
  defaultValue: 'http://localhost:9512',
);

final RegExp _previewPath = RegExp(r'^/api/sandbox/[^/]+/preview/?$');

/// Returns the canonicalized URL if [raw] is a valid sandbox preview URL
/// matching the configured public origin, otherwise null.
String? validateSandboxPreviewUrl(String? raw) {
  if (raw == null || raw.trim().isEmpty) return null;
  final Uri? uri = Uri.tryParse(raw.trim());
  if (uri == null || !uri.hasScheme || !uri.hasAuthority) return null;

  final Uri base = Uri.parse(kpaiPublicUrl);
  if (uri.scheme != base.scheme) return null;
  if (uri.host != base.host) return null;
  if (uri.port != base.port) return null;

  if (!_previewPath.hasMatch(uri.path)) return null;
  return uri.toString();
}
