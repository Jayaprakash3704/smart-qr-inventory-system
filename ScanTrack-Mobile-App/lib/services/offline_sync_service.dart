import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'api_service.dart';

class OfflineSyncService {
  static final OfflineSyncService _instance = OfflineSyncService._();
  OfflineSyncService._();
  factory OfflineSyncService() => _instance;

  Database? _db;

  Future<void> init() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'offline_queue.db');

    _db = await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            method TEXT,
            path TEXT,
            body TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        ''');
      },
    );

    // Listen for network changes to trigger sync
    Connectivity().onConnectivityChanged.listen((List<ConnectivityResult> results) {
      if (results.contains(ConnectivityResult.mobile) || results.contains(ConnectivityResult.wifi)) {
        syncNow();
      }
    });
  }

  Future<void> enqueue(String method, String path, Map<String, dynamic> body) async {
    if (_db == null) await init();
    await _db!.insert('queue', {
      'method': method,
      'path': path,
      'body': jsonEncode(body),
    });
    
    // Try syncing immediately in case we're online
    syncNow();
  }

  bool _isSyncing = false;

  Future<void> syncNow() async {
    if (_isSyncing || _db == null) return;
    _isSyncing = true;

    try {
      final connectivityResult = await Connectivity().checkConnectivity();
      if (connectivityResult.contains(ConnectivityResult.none)) {
        _isSyncing = false;
        return;
      }

      final items = await _db!.query('queue', orderBy: 'id ASC');
      if (items.isEmpty) {
        _isSyncing = false;
        return;
      }

      for (var item in items) {
        final id = item['id'] as int;
        final method = item['method'] as String;
        final path = item['path'] as String;
        final body = jsonDecode(item['body'] as String);

        bool success = false;
        try {
          if (method == 'POST') {
            await ApiService().post(path, body);
            success = true;
          } else if (method == 'PUT') {
            await ApiService().put(path, body);
            success = true;
          }
        } catch (e) {
          // If it's a 4xx error (validation), drop the queue item to prevent blocking.
          if (e is ApiException && e.statusCode >= 400 && e.statusCode < 500) {
            success = true; // Mark as success to delete it
          }
        }

        if (success) {
          await _db!.delete('queue', where: 'id = ?', whereArgs: [id]);
        } else {
          // Stop syncing if network failed
          break;
        }
      }
    } finally {
      _isSyncing = false;
    }
  }
}
