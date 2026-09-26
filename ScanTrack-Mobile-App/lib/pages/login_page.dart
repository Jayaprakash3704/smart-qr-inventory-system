import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class LoginPage extends StatefulWidget {
  final String? externalError;
  const LoginPage({super.key, this.externalError});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _error = widget.externalError;
  }

  @override
  void didUpdateWidget(LoginPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.externalError != oldWidget.externalError) {
      setState(() { _error = widget.externalError; });
    }
  }

  void _loginEmail() async {
    setState(() { _loading = true; _error = null; });
    try {
      await AuthService.signInWithEmail(_emailCtrl.text.trim(), _passCtrl.text);
      // Navigation is handled by auth wrapper in main.dart
    } catch (e) {
      if (e.toString().contains('invalid-credential')) {
        setState(() => _error = 'Invalid email or password.');
      } else {
        setState(() => _error = e.toString());
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _loginGoogle() async {
    setState(() { _loading = true; _error = null; });
    try {
      final user = await AuthService.signInWithGoogle();
      if (user == null) {
        setState(() => _error = 'Sign in aborted.');
      }
    } catch (e) {
      if (e.toString().contains('sign_in_failed') || e.toString().contains('ApiException: 10')) {
        setState(() => _error = 'Google Sign-In failed. Missing SHA-1 key in Firebase?');
      } else {
        setState(() => _error = e.toString());
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.qr_code_scanner, size: 64, color: Color(0xFFF97316)),
              const SizedBox(height: 16),
              const Text(
                'ScanTrack Mobile',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 32),
              if (_error != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(color: Colors.red.shade100, borderRadius: BorderRadius.circular(8)),
                  child: Text(_error!, style: TextStyle(color: Colors.red.shade900)),
                ),
              TextField(
                controller: _emailCtrl,
                decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email)),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passCtrl,
                decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock)),
                obscureText: true,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _loginEmail,
                child: _loading ? const CircularProgressIndicator(color: Colors.white) : const Text('Sign In'),
              ),
              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _loading ? null : _loginGoogle,
                icon: const Icon(Icons.g_mobiledata, size: 32),
                label: const Text('Sign in with Google'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  side: const BorderSide(color: Colors.grey),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
