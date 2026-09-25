import 'package:flutter/material.dart';
import 'package:qr_reader/services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
    _loadSavedUrl();
  }
  
  Future<void> _loadSavedUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('api_base_url');
    if (saved != null && saved.isNotEmpty) {
      setState(() => _urlCtrl.text = saved);
      kApiBaseUrl = saved;
    }
  }

  Future<void> _testAndSave() async {
    setState(() => _testing = true);
    
    // Temporarily set
    final oldUrl = kApiBaseUrl;
    kApiBaseUrl = _urlCtrl.text.trim();
    
    // Ensure no trailing slash
    if (kApiBaseUrl.endsWith('/')) {
      kApiBaseUrl = kApiBaseUrl.substring(0, kApiBaseUrl.length - 1);
      _urlCtrl.text = kApiBaseUrl;
    }

    try {
      final success = await ApiService().ping();
      
      if (success) {
        // Save to preferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('api_base_url', kApiBaseUrl);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Connected & Saved Successfully!'),
            backgroundColor: Color(0xFF22C55E),
          ));
        }
      } else {
        throw Exception('Ping returned false');
      }
    } catch (e) {
      // Revert on failure
      kApiBaseUrl = oldUrl;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Connection failed: Check URL and network'),
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
            const Text('Enter the local IP address and port of your ScanTrack backend server (e.g., http://192.168.1.100:5000).', style: TextStyle(color: Color(0xFF64748B))),
            
            const SizedBox(height: 24),
            
            TextFormField(
              controller: _urlCtrl,
              decoration: const InputDecoration(
                labelText: 'Server URL',
                hintText: 'http://192.168.x.x:5000',
                prefixIcon: Icon(Icons.link),
              ),
            ),
            
            const SizedBox(height: 24),
            
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _testing ? null : _testAndSave,
                icon: _testing 
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.wifi),
                label: const Text('Test & Save Connection'),
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
              subtitle: const Text('1.0.0 (Pure REST Rebuild)'),
            ),
          ],
        ),
      ),
    );
  }
}
