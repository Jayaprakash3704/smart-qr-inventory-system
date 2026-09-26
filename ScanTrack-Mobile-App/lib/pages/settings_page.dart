import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:qr_reader/services/api_service.dart';
import 'package:qr_reader/services/auth_service.dart';
import 'package:qr_reader/services/user_session.dart';
import 'package:qr_reader/pages/home_page.dart' show buildBottomNav;
import 'package:qr_reader/main.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  // Profile edit
  final _nameCtrl = TextEditingController();
  bool _editingName = false;
  bool _savingName  = false;

  // Password change
  final _oldPassCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  bool _savingPass   = false;
  bool _showOldPass  = false;
  bool _showNewPass  = false;

  // Connection test
  bool _testing = false;

  @override
  void initState() {
    super.initState();
    _nameCtrl.text = UserSession().email.split('@').first; // default display name
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final data = await ApiService().get('/api/users/me');
      if (data is Map && mounted) {
        setState(() {
          _nameCtrl.text = (data['display_name'] as String?)?.isNotEmpty == true
              ? data['display_name']!
              : (data['email'] as String? ?? '').split('@').first;
        });
      }
    } catch (_) {}
  }

  Future<void> _saveName() async {
    setState(() => _savingName = true);
    try {
      await ApiService().post('/api/users/me', {'display_name': _nameCtrl.text.trim()});
      // ignore: use_build_context_synchronously
      if (mounted) {
        setState(() => _editingName = false);
        _showSnackbar('Display name updated!', success: true);
      }
    } catch (_) {
      if (mounted) _showSnackbar('Failed to update name', success: false);
    } finally {
      if (mounted) setState(() => _savingName = false);
    }
  }

  Future<void> _changePassword() async {
    if (_newPassCtrl.text.length < 6) {
      return _showSnackbar('New password must be at least 6 characters', success: false);
    }
    setState(() => _savingPass = true);
    try {
      final user = FirebaseAuth.instance.currentUser!;
      final cred = EmailAuthProvider.credential(email: user.email!, password: _oldPassCtrl.text);
      await user.reauthenticateWithCredential(cred);
      await user.updatePassword(_newPassCtrl.text);
      _oldPassCtrl.clear();
      _newPassCtrl.clear();
      if (mounted) _showSnackbar('Password changed successfully!', success: true);
    } on FirebaseAuthException catch (e) {
      if (mounted) _showSnackbar(
        e.code == 'wrong-password' ? 'Current password is incorrect' : e.message ?? 'Failed',
        success: false,
      );
    } finally {
      if (mounted) setState(() => _savingPass = false);
    }
  }

  Future<void> _testConnection() async {
    setState(() => _testing = true);
    try {
      final ok = await ApiService().ping();
      if (mounted) _showSnackbar(ok ? '✅ Connected to server!' : '❌ Connection failed', success: ok);
    } catch (_) {
      if (mounted) _showSnackbar('Cannot reach server', success: false);
    } finally {
      if (mounted) setState(() => _testing = false);
    }
  }

  void _showSnackbar(String msg, {required bool success}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: success ? const Color(0xFF22C55E) : const Color(0xFFEF4444),
    ));
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _oldPassCtrl.dispose();
    _newPassCtrl.dispose();
    super.dispose();
  }

  // ─── Build ──────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final session = UserSession();
    final email   = session.email.isNotEmpty ? session.email : (AuthService.currentUser?.email ?? 'Unknown');
    final isAdmin  = session.isAdmin;
    final initial  = email.isNotEmpty ? email[0].toUpperCase() : 'U';

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            // ── Profile Card ─────────────────────────────────────────────
            _sectionLabel('MY PROFILE'),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Column(
                children: [
                  // Avatar + info
                  Row(
                    children: [
                      Container(
                        width: 64, height: 64,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [Color(0xFFF97316), Color(0xFFEA580C)],
                          ),
                          boxShadow: [BoxShadow(color: const Color(0xFFF97316).withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4))],
                        ),
                        child: Center(child: Text(initial, style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900))),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Editable display name
                            if (_editingName)
                              Row(
                                children: [
                                  Expanded(
                                    child: TextField(
                                      controller: _nameCtrl,
                                      autofocus: true,
                                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                                      decoration: const InputDecoration(
                                        isDense: true,
                                        contentPadding: EdgeInsets.symmetric(horizontal: 0, vertical: 4),
                                        border: UnderlineInputBorder(),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  _savingName
                                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                                    : IconButton(iconSize: 18, icon: const Icon(Icons.check, color: Color(0xFF22C55E)), onPressed: _saveName),
                                  IconButton(iconSize: 18, icon: const Icon(Icons.close, color: Color(0xFF94A3B8)), onPressed: () => setState(() => _editingName = false)),
                                ],
                              )
                            else
                              Row(
                                children: [
                                  Expanded(child: Text(_nameCtrl.text.isNotEmpty ? _nameCtrl.text : 'Set your name', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF1E293B)))),
                                  GestureDetector(
                                    onTap: () => setState(() => _editingName = true),
                                    child: const Icon(Icons.edit_outlined, size: 16, color: Color(0xFF94A3B8)),
                                  ),
                                ],
                              ),
                            const SizedBox(height: 4),
                            Text(email, style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                              decoration: BoxDecoration(
                                color: isAdmin ? const Color(0xFFFFF7ED) : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                isAdmin ? '👑 ADMIN' : '👤 STAFF',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: isAdmin ? const Color(0xFFF97316) : const Color(0xFF64748B)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  const SizedBox(height: 16),

                  // Info rows
                  _infoRow('Email', email),
                  _infoRow('Role', isAdmin ? 'Administrator' : 'Staff Member'),
                  _infoRow('Firebase UID', (AuthService.currentUser?.uid ?? '—').substring(0, 12) + '...'),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Change Password ───────────────────────────────────────────
            _sectionLabel('CHANGE PASSWORD'),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Column(
                children: [
                  _passField('Current Password', _oldPassCtrl, _showOldPass, () => setState(() => _showOldPass = !_showOldPass)),
                  const SizedBox(height: 14),
                  _passField('New Password (min 6 chars)', _newPassCtrl, _showNewPass, () => setState(() => _showNewPass = !_showNewPass)),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _savingPass ? null : _changePassword,
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
                      child: _savingPass
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Update Password', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Connection ────────────────────────────────────────────────
            _sectionLabel('BACKEND CONNECTION'),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _infoRow('Server URL', kApiBaseUrl),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _testing ? null : _testConnection,
                      icon: _testing
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.wifi_rounded),
                      label: const Text('Test Connection'),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── About ─────────────────────────────────────────────────────
            _sectionLabel('ABOUT SCANTRACK'),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Column(
                children: [
                  _infoRow('Application', 'ScanTrack'),
                  _infoRow('Version', '2.0.0'),
                  _infoRow('Platform', 'Flutter Mobile'),
                  _infoRow('Backend', 'Node.js + SQLite'),
                  _infoRow('Auth', 'Firebase Auth'),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // ── Sign Out Button ───────────────────────────────────────────
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFEE2E2),
                  foregroundColor: const Color(0xFFEF4444),
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (_) => AlertDialog(
                      title: const Text('Sign Out'),
                      content: const Text('Are you sure you want to sign out?'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                        TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Sign Out', style: TextStyle(color: Color(0xFFEF4444)))),
                      ],
                    ),
                  );
                  if (confirm == true && mounted) {
                    await UserSession().clear();
                    await AuthService.signOut();
                    if (mounted) {
                      Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const AuthWrapper()), (r) => false);
                    }
                  }
                },
                icon: const Icon(Icons.logout_rounded),
                label: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
      bottomNavigationBar: buildBottomNav(context, -1),
    );
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────
  Widget _sectionLabel(String label) => Text(
    label,
    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF94A3B8), letterSpacing: 1.2),
  );

  Widget _infoRow(String label, String value) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 7),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 100,
          child: Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600)),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B), fontWeight: FontWeight.w600),
            textAlign: TextAlign.end,
          ),
        ),
      ],
    ),
  );

  Widget _passField(String hint, TextEditingController ctrl, bool visible, VoidCallback toggle) => TextFormField(
    controller: ctrl,
    obscureText: !visible,
    decoration: InputDecoration(
      hintText: hint,
      prefixIcon: const Icon(Icons.lock_outline, size: 18),
      suffixIcon: IconButton(icon: Icon(visible ? Icons.visibility_off : Icons.visibility, size: 18), onPressed: toggle),
    ),
  );
}
