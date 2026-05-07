import 'package:flutter/material.dart';

import 'landing_page.dart';

void main() {
  runApp(const KidPlayAIApp());
}

class KidPlayAIApp extends StatelessWidget {
  const KidPlayAIApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KidPlayAI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFFFF6B6B)),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFFFF8F0),
      ),
      home: const LandingPage(),
    );
  }
}
