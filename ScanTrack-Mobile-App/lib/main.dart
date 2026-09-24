import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:qr_reader/pages/welcome_page.dart';
import 'package:qr_reader/pages/main_page.dart';
import 'package:qr_reader/pages/reserved_list_page.dart';
import 'package:qr_reader/pages/dispatch_list_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ScanTrack Inventory',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFF97316), // Orange 500
          primary: const Color(0xFFF97316),
          secondary: const Color(0xFF1E293B), // Slate 800
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0,
          centerTitle: true,
          titleTextStyle: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: Colors.black,
          ),
        ),
      ),
      routes: {
        '/': (context) => const WelcomePage(),  // Splash screen
        '/home': (context) => const MainPage(), // Main page
        '/reserved': (context) => const ReservedListPage(),
        '/dispatch': (context) => const DispatchListPage(),
      },
      initialRoute: '/',
    );
  }
}
