import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'auth_service.dart';
import 'offline_sync_service.dart';

String get kApiBaseUrl {
  final url = dotenv.env['API_URL'];
  if (url != null && url.isNotEmpty) {
    return url.endsWith('/api') ? url.substring(0, url.length - 4) : url;
  }
  return 'http://10.0.2.2:5000'; // Fallback
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiService {
  static final ApiService _instance = ApiService._();
  ApiService._();
  factory ApiService() => _instance;

  Uri _url(String path) => Uri.parse('$kApiBaseUrl$path');

  Future<Map<String, String>> get _headers async {
    final token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<dynamic> get(String path) async {
    try {
      final res = await http.get(_url(path), headers: await _headers).timeout(const Duration(seconds: 15));
      return _handleResponse(res);
    } on SocketException {
      throw ApiException(0, 'Cannot connect to server');
    }
  }

  Future<dynamic> post(String path, Map<String, dynamic> body) async {
    try {
      final res = await http.post(_url(path), headers: await _headers, body: jsonEncode(body)).timeout(const Duration(seconds: 15));
      return _handleResponse(res);
    } on SocketException {
      throw ApiException(0, 'Cannot connect to server');
    }
  }

  Future<dynamic> put(String path, Map<String, dynamic> body) async {
    try {
      final res = await http.put(_url(path), headers: await _headers, body: jsonEncode(body)).timeout(const Duration(seconds: 15));
      return _handleResponse(res);
    } on SocketException {
      throw ApiException(0, 'Cannot connect to server');
    }
  }

  Future<dynamic> patch(String path, Map<String, dynamic> body) async {
    try {
      final res = await http.patch(_url(path), headers: await _headers, body: jsonEncode(body)).timeout(const Duration(seconds: 15));
      return _handleResponse(res);
    } on SocketException {
      throw ApiException(0, 'Cannot connect to server');
    }
  }

  Future<dynamic> delete(String path) async {
    try {
      final res = await http.delete(_url(path), headers: await _headers).timeout(const Duration(seconds: 15));
      return _handleResponse(res);
    } on SocketException {
      throw ApiException(0, 'Cannot connect to server');
    }
  }

  dynamic _handleResponse(http.Response res) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.body.isEmpty) return null;
      return jsonDecode(res.body);
    }
    String errorMsg = 'Request failed (${res.statusCode})';
    try {
      final body = jsonDecode(res.body);
      if (body is Map && body['error'] != null) errorMsg = body['error'];
    } catch (_) {}
    throw ApiException(res.statusCode, errorMsg);
  }

  Future<bool> ping() async {
    try {
      final res = await get('/api/health');
      return (res as Map)['status'] == 'OK';
    } catch (_) {
      return false;
    }
  }

  Future<List<Map<String, dynamic>>> getProducts() async {
    final raw = await get('/api/products');
    return List<Map<String, dynamic>>.from(raw as List);
  }

  Future<Map<String, dynamic>> getProduct(String id) async {
    final raw = await get('/api/products/$id');
    return Map<String, dynamic>.from(raw as Map);
  }

  Future<Map<String, dynamic>> createProduct(Map<String, dynamic> data) async {
    final raw = await post('/api/products', data);
    return Map<String, dynamic>.from(raw as Map);
  }

  Future<Map<String, dynamic>> updateProduct(String id, Map<String, dynamic> data) async {
    final raw = await put('/api/products/$id', data);
    return Map<String, dynamic>.from(raw as Map);
  }

  Future<void> deleteProduct(String id) async {
    await delete('/api/products/$id');
  }

  Future<Map<String, dynamic>> stockIn(String id, int quantity, String notes, String supplier) async {
    final path = '/api/products/$id/stock-in';
    final body = {'quantity': quantity, 'notes': notes, 'supplier': supplier};
    try {
      final raw = await post(path, body);
      return Map<String, dynamic>.from(raw as Map);
    } on ApiException catch (e) {
      if (e.statusCode == 0) {
        await OfflineSyncService().enqueue('POST', path, body);
        return {'success': true, 'offline_queued': true};
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> stockOut(String id, int quantity, String reason, String notes) async {
    final path = '/api/products/$id/stock-out';
    final body = {'quantity': quantity, 'reason': reason, 'notes': notes};
    try {
      final raw = await post(path, body);
      return Map<String, dynamic>.from(raw as Map);
    } on ApiException catch (e) {
      if (e.statusCode == 0) {
        await OfflineSyncService().enqueue('POST', path, body);
        return {'success': true, 'offline_queued': true};
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> scanQr(String qrData) async {
    final raw = await post('/api/qr/scan', {'qr_data': qrData});
    return Map<String, dynamic>.from(raw as Map);
  }

  String qrImageUrl(String productId) => '$kApiBaseUrl/api/qr/$productId';

  Future<List<Map<String, dynamic>>> getTransactions({String? productId, int limit = 20}) async {
    var path = '/api/transactions?limit=$limit';
    if (productId != null) path += '&product_id=$productId';
    final raw = await get(path);
    return List<Map<String, dynamic>>.from(raw as List);
  }

  Future<List<Map<String, dynamic>>> getSales() async {
    final raw = await get('/api/orders');
    return List<Map<String, dynamic>>.from(raw as List);
  }

  Future<Map<String, dynamic>> createSale(String customerName, List<Map<String, dynamic>> items, String notes) async {
    final raw = await post('/api/orders', {
      'customer_name': customerName,
      'items': items,
      'notes': notes,
    });
    return Map<String, dynamic>.from(raw as Map);
  }

  Future<Map<String, dynamic>> getSummary() async {
    final raw = await get('/api/reports/summary');
    return Map<String, dynamic>.from(raw as Map);
  }

  Future<List<Map<String, dynamic>>> getLowStock() async {
    final raw = await get('/api/reports/low-stock');
    return List<Map<String, dynamic>>.from(raw as List);
  }

  Future<List<Map<String, dynamic>>> getNotifications() async {
    final raw = await get('/api/notifications');
    return List<Map<String, dynamic>>.from(raw as List);
  }

  Future<void> markAllRead() async {
    await post('/api/notifications/mark-all-read', {});
  }

  Future<void> deleteNotification(String id) async {
    await delete('/api/notifications/$id');
  }

  Future<List<Map<String, dynamic>>> getOrders() async {
    final raw = await get('/api/orders');
    return List<Map<String, dynamic>>.from(raw as List);
  }

  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> data) async {
    final raw = await post('/api/orders', data);
    return Map<String, dynamic>.from(raw as Map);
  }

  Future<void> approveOrder(String id) async {
    await post('/api/orders/$id/approve', {});
  }

  Future<void> cancelOrder(String id) async {
    await post('/api/orders/$id/cancel', {});
  }
}
