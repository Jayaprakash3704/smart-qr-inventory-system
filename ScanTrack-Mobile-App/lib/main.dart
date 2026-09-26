import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:qr_reader/pages/welcome_page.dart';
import 'package:qr_reader/pages/sales_page.dart' as qr_reader;
import 'package:qr_reader/pages/home_page.dart';
import 'package:qr_reader/pages/inventory_page.dart';
import 'package:qr_reader/pages/product_detail_page.dart';
import 'package:qr_reader/pages/qr_scanner_page.dart';
import 'package:qr_reader/pages/stock_in_page.dart';
import 'package:qr_reader/pages/stock_out_page.dart';
import 'package:qr_reader/pages/notifications_page.dart';
import 'package:qr_reader/pages/settings_page.dart';
import 'package:qr_reader/pages/login_page.dart';
import 'package:qr_reader/pages/splash_screen.dart';
import 'package:qr_reader/services/offline_sync_service.dart';
import 'package:qr_reader/services/user_session.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:qr_reader/services/auth_service.dart';


void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint("Firebase init error: $e");
  }

  try {
    await dotenv.load(fileName: ".env");
  } catch (e) {
    debugPrint("DotEnv init error: $e");
  }

  await OfflineSyncService().init();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));

  runApp(const ScanTrackApp());
}

class ScanTrackApp extends StatelessWidget {
  const ScanTrackApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ScanTrack',
      debugShowCheckedModeBanner: false,
      theme: _buildTheme(),
      home: const SplashScreen(),
      routes: {
        '/home':         (_) => const HomePage(),
        '/inventory':    (_) => const InventoryPage(),
        '/qr-scanner':   (_) => const QrScannerPage(),
        '/stock-in':     (_) => const StockInPage(),
        '/stock-out':    (_) => const StockOutPage(),
        '/sales':        (_) => const qr_reader.SalesPage(),
        '/notifications':(_) => const NotificationsPage(),
        '/settings':     (_) => const SettingsPage(),
      },
      onGenerateRoute: (settings) {
        if (settings.name != null && settings.name!.startsWith('/product/')) {
          final id = settings.name!.replaceFirst('/product/', '');
          return MaterialPageRoute(builder: (_) => ProductDetailPage(productId: id));
        }
        return null;
      },
    );
  }

  ThemeData _buildTheme() {
    const brand = Color(0xFFF97316);
    const bg = Color(0xFFF8FAFC);
    const surface = Colors.white;

    return ThemeData(
      useMaterial3: true,
      fontFamily: 'Roboto',
      scaffoldBackgroundColor: bg,
      colorScheme: ColorScheme.fromSeed(
        seedColor: brand,
        primary: brand,
        onPrimary: Colors.white,
        secondary: const Color(0xFF1E293B),
        surface: surface,
        background: bg,
        error: const Color(0xFFEF4444),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: Color(0xFF1E293B),
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontSize: 19, fontWeight: FontWeight.w700,
          color: Color(0xFF1E293B), letterSpacing: -0.3,
        ),
        iconTheme: IconThemeData(color: Color(0xFF64748B)),
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFF1F5F9), width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: brand,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: brand, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFEF4444)),
        ),
        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
        labelStyle: const TextStyle(color: Color(0xFF64748B)),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: brand,
        unselectedItemColor: Color(0xFF94A3B8),
        elevation: 0,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 11),
        unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
        type: BottomNavigationBarType.fixed,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        backgroundColor: const Color(0xFF1E293B),
        contentTextStyle: const TextStyle(color: Colors.white, fontSize: 14),
      ),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  User? _user;
  bool _isLoading = true;
  String? _authError;
  StreamSubscription<User?>? _authSub;

  @override
  void initState() {
    super.initState();
    _authSub = FirebaseAuth.instance.authStateChanges().listen(_handleAuthState);
  }

  Future<void> _handleAuthState(User? user) async {
    if (!mounted) return;
    
    if (user == null) {
      setState(() {
        _user = null;
        _isLoading = false;
        // Don't clear authError here, let LoginPage display it once.
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _authError = null; // Clear error on new login attempt
    });

    try {
      await UserSession().fetch();
      if (mounted) {
        setState(() {
          _user = user;
          _isLoading = false;
        });
      }
    } catch (e) {
      // API returned 401/403 or some other unrecoverable error
      await AuthService.signOut();
      if (mounted) {
        setState(() {
          _user = null;
          _isLoading = false;
          _authError = 'Access Denied: You are not registered in the system.';
        });
      }
    }
  }

  @override
  void dispose() {
    _authSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Verifying access...', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14)),
            ],
          ),
        ),
      );
    }

    if (_user != null && _authError == null) {
      return const WelcomePage();
    }

    return LoginPage(externalError: _authError);
  }
}
