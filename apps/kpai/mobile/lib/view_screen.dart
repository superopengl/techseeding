import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class ViewScreen extends StatefulWidget {
  const ViewScreen({super.key, required this.url});

  final String url;

  @override
  State<ViewScreen> createState() => _ViewScreenState();
}

class _ViewScreenState extends State<ViewScreen>
    with SingleTickerProviderStateMixin {
  late final WebViewController _webController;
  late final AnimationController _drawer;
  static const double _drawerHeight = 220;
  static const double _openThreshold = 80;

  @override
  void initState() {
    super.initState();
    _webController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFFFF8F0))
      ..loadRequest(Uri.parse(widget.url));
    _drawer = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 220),
    );
  }

  @override
  void dispose() {
    _drawer.dispose();
    super.dispose();
  }

  void _onDragUpdate(DragUpdateDetails d) {
    final double delta = d.primaryDelta ?? 0;
    final double next = (_drawer.value + delta / _drawerHeight).clamp(0.0, 1.0);
    _drawer.value = next;
  }

  void _onDragEnd(DragEndDetails d) {
    final bool open = _drawer.value * _drawerHeight > _openThreshold ||
        (d.primaryVelocity ?? 0) > 400;
    if (open) {
      _drawer.animateTo(1.0);
    } else {
      _drawer.animateBack(0.0);
    }
  }

  void _exit() {
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final double topInset = MediaQuery.of(context).padding.top;
    return Scaffold(
      backgroundColor: const Color(0xFFFFF8F0),
      body: Stack(
        children: [
          Positioned.fill(
            child: WebViewWidget(controller: _webController),
          ),
          // Invisible drag handle at top edge for pull-down gesture.
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: topInset + 56,
            child: GestureDetector(
              behavior: HitTestBehavior.translucent,
              onVerticalDragUpdate: _onDragUpdate,
              onVerticalDragEnd: _onDragEnd,
            ),
          ),
          // Drawer that slides in from top.
          AnimatedBuilder(
            animation: _drawer,
            builder: (context, child) {
              final double offset =
                  -(_drawerHeight + topInset) * (1 - _drawer.value);
              return Positioned(
                top: offset,
                left: 0,
                right: 0,
                child: child!,
              );
            },
            child: _DrawerContent(
              height: _drawerHeight + topInset,
              topPadding: topInset,
              onExit: _exit,
              onDragUpdate: _onDragUpdate,
              onDragEnd: _onDragEnd,
            ),
          ),
          // Tap outside to close when drawer is open.
          AnimatedBuilder(
            animation: _drawer,
            builder: (context, _) {
              if (_drawer.value <= 0.01) {
                return const SizedBox.shrink();
              }
              return Positioned(
                top: _drawerHeight + topInset,
                left: 0,
                right: 0,
                bottom: 0,
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => _drawer.animateBack(0.0),
                  child: Container(
                    color: Colors.black.withValues(alpha: 0.25 * _drawer.value),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _DrawerContent extends StatelessWidget {
  const _DrawerContent({
    required this.height,
    required this.topPadding,
    required this.onExit,
    required this.onDragUpdate,
    required this.onDragEnd,
  });

  final double height;
  final double topPadding;
  final VoidCallback onExit;
  final void Function(DragUpdateDetails) onDragUpdate;
  final void Function(DragEndDetails) onDragEnd;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onVerticalDragUpdate: onDragUpdate,
      onVerticalDragEnd: onDragEnd,
      child: Container(
        height: height,
        decoration: const BoxDecoration(
          color: Color(0xFFFFF8F0),
          borderRadius: BorderRadius.only(
            bottomLeft: Radius.circular(20),
            bottomRight: Radius.circular(20),
          ),
          boxShadow: [
            BoxShadow(color: Colors.black26, blurRadius: 12, offset: Offset(0, 4)),
          ],
        ),
        padding: EdgeInsets.only(top: topPadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(height: 8),
            Image.asset('assets/logo.png', width: 64, height: 64),
            const SizedBox(height: 8),
            const Text(
              'KidPlayAI',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Color(0xFF2A2A2A),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: onExit,
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text('Exit or Scan Another'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFFF6B6B),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.black26,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
