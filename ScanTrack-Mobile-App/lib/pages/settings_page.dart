import 'package:flutter/material.dart';
import 'package:qr_reader/services/api_service.dart';
import 'package:qr_reader/services/auth_service.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final _urlCtrl = TextEditingController();
  bool _testing = false;

  @override
  void initState() {
    super.initState();
    _urlCtrl.text = kApiBaseUrl;
  }
  
  Future<void> _testConnection() async {
    setState(() => _testing = true);
    
    try {
      final success = await ApiService().ping();
      
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Connected Successfully!'),
          backgroundColor: Color(0xFF22C55E),
        ));
      } else if (mounted) {
        throw Exception('Ping returned false');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Connection failed: Check .env URL and network'),
          backgroundColor: const Color(0xFFEF4444),
        ));
      }
    } finally {
      if (mounted) setState(() => _testing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Backend Connection', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
            const SizedBox(height: 8),
            const Text('Your server URL is securely loaded from the .env file. To change it, update your .env file and restart the app.', style: TextStyle(color: Color(0xFF64748B))),
            
            const SizedBox(height: 24),
            
            TextFormField(
              controller: _urlCtrl,
              readOnly: true,
              decoration: const InputDecoration(
                labelText: 'Server URL (from .env)',
                prefixIcon: Icon(Icons.link),
              ),
            ),
            
            const SizedBox(height: 24),
            
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _testing ? null : _testConnection,
                icon: _testing 
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.wifi),
                label: const Text('Test Connection'),
              ),
            ),
            
            const SizedBox(height: 48),
            
            const Text('About ScanTrack', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
            const SizedBox(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: Icon(Icons.qr_code_scanner, color: Theme.of(context).colorScheme.primary),
              ),
              title: const Text('Version', style: TextStyle(fontWeight: FontWeight.w600)),
              subtitle: const Text('2.0.0 (Pure REST Rebuild)'),
            ),
            
            const SizedBox(height: 32),
            
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFEE2E2),
                  foregroundColor: const Color(0xFFEF4444),
                  elevation: 0,
                ),
                onPressed: () async {
                  await AuthService.signOut();
                  if (context.mounted) {
                    Navigator.of(context).popUntil((route) => route.isFirst);
                  }
                },
                icon: const Icon(Icons.logout),
                label: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
