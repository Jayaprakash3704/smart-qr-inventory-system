import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:qr_reader/services/api_service.dart';

class QrScannerPage extends StatefulWidget {
  const QrScannerPage({super.key});

  @override
  State<QrScannerPage> createState() => _QrScannerPageState();
}

class _QrScannerPageState extends State<QrScannerPage> {
  final MobileScannerController _ctrl = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
  );
  
  final TextEditingController _manualCtrl = TextEditingController();
  
  bool _processing = false;
  
  @override
  void dispose() {
    _ctrl.dispose();
    _manualCtrl.dispose();
    super.dispose();
  }

  void _onDetectManual(String id) async {
    if (_processing) return;
    setState(() => _processing = true);
    try {
      final res = await ApiService().scanQr(id);
      if (mounted) {
        if (res['product_id'] != null || res['id'] != null) {
          Navigator.pushReplacementNamed(context, '/product/${res['product_id'] ?? res['id']}');
        } else {
          _showError('Product not found.');
        }
      }
    } catch (e) {
      if (mounted) _showError(e.toString());
    }
  }

  void _onDetect(BarcodeCapture capture) async {
    if (_processing) return;
    
    final barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;
    
    final qr = barcodes.first.rawValue;
    if (qr == null || qr.isEmpty) return;

    setState(() => _processing = true);
    
    try {
      final res = await ApiService().scanQr(qr);
      if (mounted) {
        if (res['product_id'] != null) {
          // Success, navigate to product
          Navigator.pushReplacementNamed(context, '/product/${res['product_id']}');
        } else {
          // No product ID returned
          _showError('Invalid QR format or product not found.');
        }
      }
    } catch (e) {
      if (mounted) {
        _showError(e.toString());
      }
    }
  }

  void _showError(String msg) {
    setState(() => _processing = false);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: const Color(0xFFEF4444),
      duration: const Duration(seconds: 3),
      action: SnackBarAction(label: 'OK', textColor: Colors.white, onPressed: () {}),
    ));
    
    // Give user a moment before allowing next scan
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) _ctrl.start(); // Ensure it's listening again if needed
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // Solid background
          Container(color: const Color(0xFFF8FAFC)),
          
          // Restricted Scanner Window
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(color: Theme.of(context).colorScheme.primary, width: 3),
                borderRadius: BorderRadius.circular(20),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(17),
                child: MobileScanner(
                  controller: _ctrl,
                  onDetect: _onDetect,
                ),
              ),
            ),
          ),
          
          // App Bar Area
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Container(
                    decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.05), shape: BoxShape.circle),
                    child: IconButton(
                      icon: const Icon(Icons.close, color: Color(0xFF1E293B)),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                  const Expanded(child: Text('Scan QR Code', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF1E293B), fontSize: 18, fontWeight: FontWeight.bold))),
                  const SizedBox(width: 48), // Balance for back button
                ],
              ),
            ),
          ),
          
          // Bottom text & Manual Entry
          Positioned(
            bottom: 40,
            left: 20,
            right: 20,
            child: Column(
              children: [
                const Text(
                  'Align QR code within the frame\nor enter SKU manually',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 14),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _manualCtrl,
                        decoration: InputDecoration(
                          hintText: 'Enter Product ID/SKU',
                          filled: true,
                          fillColor: Colors.white.withValues(alpha: 0.9),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () {
                        if (_manualCtrl.text.isNotEmpty) {
                          _onDetectManual(_manualCtrl.text.trim());
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                      ),
                      child: const Text('Go'),
                    )
                  ],
                )
              ],
            ),
          ),
          
          if (_processing)
            Container(
              color: Colors.black.withValues(alpha: 0.7),
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text('Processing...', style: TextStyle(color: Colors.white, fontSize: 16)),
                  ],
                ),
              ),
            )
        ],
      ),
    );
  }
}
