import 'package:flutter/material.dart';
import 'package:qr_reader/services/api_service.dart';
import 'package:qr_reader/pages/home_page.dart' show buildBottomNav;
import 'package:qr_reader/pages/qr_scanner_page.dart' as qr_scanner;

class StockInPage extends StatefulWidget {
  const StockInPage({super.key});

  @override
  State<StockInPage> createState() => _StockInPageState();
}

class _StockInPageState extends State<StockInPage> {
  final _formKey = GlobalKey<FormState>();
  final _qtyCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  final _supplierCtrl = TextEditingController();
  
  List<Map<String, dynamic>> _products = [];
  String? _selectedProductId;
  bool _loading = true;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final products = await ApiService().getProducts();
      if (mounted) setState(() { _products = products; _loading = false; });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _selectedProductId == null) {
      if (_selectedProductId == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a product')));
      }
      return;
    }
    
    setState(() => _submitting = true);
    
    try {
      await ApiService().stockIn(
        _selectedProductId!,
        int.parse(_qtyCtrl.text),
        _notesCtrl.text.trim(),
        _supplierCtrl.text.trim(),
      );
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Stock added successfully!'),
          backgroundColor: Color(0xFF22C55E),
        ));
        // Reset
        _qtyCtrl.clear(); _notesCtrl.clear(); _supplierCtrl.clear();
        setState(() => _selectedProductId = null);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.toString()), backgroundColor: const Color(0xFFEF4444)));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  void dispose() {
    _qtyCtrl.dispose(); _notesCtrl.dispose(); _supplierCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Stock In')),
      body: _loading 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Product', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () async {
                      final scannedId = await Navigator.push<String>(
                        context,
                        MaterialPageRoute(builder: (_) => const qr_scanner.QrScannerPage(returnResult: true)),
                      );
                      if (scannedId != null && mounted) {
                        setState(() => _selectedProductId = scannedId);
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.qr_code_scanner, color: Theme.of(context).colorScheme.primary),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _selectedProductId == null 
                                ? 'Tap to scan product QR' 
                                : _products.firstWhere((p) => p['id'] == _selectedProductId, orElse: () => {'name': 'Unknown Product'})['name'] ?? 'Unknown Product',
                              style: TextStyle(
                                fontSize: 14, 
                                color: _selectedProductId == null ? const Color(0xFF94A3B8) : const Color(0xFF1E293B),
                                fontWeight: _selectedProductId == null ? FontWeight.normal : FontWeight.w600,
                              ),
                            ),
                          ),
                          if (_selectedProductId != null)
                            const Icon(Icons.check_circle, color: Color(0xFF22C55E), size: 20),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 20),
                  
                  const Text('Quantity', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _qtyCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(hintText: 'E.g. 50', prefixIcon: Icon(Icons.add_box)),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Required';
                      if (int.tryParse(v) == null || int.parse(v) <= 0) return 'Must be > 0';
                      return null;
                    },
                  ),
                  
                  const SizedBox(height: 20),
                  
                  const Text('Supplier (Optional)', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _supplierCtrl,
                    decoration: const InputDecoration(hintText: 'Supplier name', prefixIcon: Icon(Icons.local_shipping)),
                  ),
                  
                  const SizedBox(height: 20),
                  
                  const Text('Notes (Optional)', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _notesCtrl,
                    maxLines: 3,
                    decoration: const InputDecoration(hintText: 'Any additional details...'),
                  ),
                  
                  const SizedBox(height: 32),
                  
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _submitting ? null : _submit,
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF22C55E)),
                      child: _submitting 
                        ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Confirm Stock In', style: TextStyle(fontSize: 16)),
                    ),
                  )
                ],
              ),
            ),
          ),
      bottomNavigationBar: buildBottomNav(context, 3),
    );
  }
}
