import 'package:shared_preferences/shared_preferences.dart';
import 'package:qr_reader/services/api_service.dart';
import 'package:qr_reader/services/auth_service.dart';

/// Singleton that holds the authenticated user's role fetched from backend.
/// Call [UserSession.fetch()] after Firebase sign-in.
/// Access role via [UserSession.role] or [UserSession.isAdmin].
class UserSession {
  static final UserSession _instance = UserSession._();
  UserSession._();
  factory UserSession() => _instance;

  static const _roleKey = 'user_role';
  static const _emailKey = 'user_email';

  String _role = 'staff';
  String _email = '';

  String get role => _role;
  String get email => _email;
  bool get isAdmin => _role == 'admin';

  /// Fetches the user role from the backend /api/users/me endpoint.
  /// Falls back to cached value if network is unavailable.
  Future<void> fetch() async {
    try {
      final data = await ApiService().get('/api/users/me');
      if (data is Map) {
        _role = (data['role'] as String?) ?? 'staff';
        _email = (data['email'] as String?) ?? (AuthService.currentUser?.email ?? '');
        // Persist for offline resilience
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_roleKey, _role);
        await prefs.setString(_emailKey, _email);
      }
    } on ApiException catch (e) {
      if (e.statusCode == 401 || e.statusCode == 403) {
        rethrow; // Force logout for auth/role errors
      }
      _fallbackToCache();
    } catch (_) {
      _fallbackToCache();
    }
  }

  Future<void> _fallbackToCache() async {
    final prefs = await SharedPreferences.getInstance();
    _role = prefs.getString(_roleKey) ?? 'staff';
    _email = prefs.getString(_emailKey) ?? (AuthService.currentUser?.email ?? '');
  }

  /// Clears session data on sign-out.
  Future<void> clear() async {
    _role = 'staff';
    _email = '';
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_roleKey);
    await prefs.remove(_emailKey);
  }
}
