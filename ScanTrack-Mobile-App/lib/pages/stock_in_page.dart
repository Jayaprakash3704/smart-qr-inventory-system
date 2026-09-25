import 'package:flutter/material.dart';
import 'package:qr_reader/services/api_service.dart';
import 'package:qr_reader/pages/home_page.dart' show _buildBottomNav;

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
      appBar: AppBar(title: const Text('Stock In'), automaticallyImplyLeading: false),
      body: _loading 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Select Product', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _selectedProductId,
                    decoration: const InputDecoration(hintText: 'Choose product...'),
                    items: _products.map((p) => DropdownMenuItem(
                      value: p['id'].toString(),
                      child: Text('${p['name']} (${p['sku'] ?? 'No SKU'})', style: const TextStyle(fontSize: 14)),
                    )).toList(),
                    onChanged: (v) => setState(() => _selectedProductId = v),
                    validator: (v) => v == null ? 'Required' : null,
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
      bottomNavigationBar: _buildBottomNav(context, 3),
    );
  }
}
