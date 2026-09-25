import 'package:flutter/material.dart';
import 'package:qr_reader/services/api_service.dart';

class StockOutPage extends StatefulWidget {
  const StockOutPage({super.key});

  @override
  State<StockOutPage> createState() => _StockOutPageState();
}

class _StockOutPageState extends State<StockOutPage> {
  final _formKey = GlobalKey<FormState>();
  final _qtyCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  
  List<Map<String, dynamic>> _products = [];
  String? _selectedProductId;
  String _reason = 'SALE';
  bool _loading = true;
  bool _submitting = false;

  final _reasons = ['SALE', 'DAMAGE', 'RETURN', 'INTERNAL_USE', 'LOSS'];

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
    
    // Check local stock first for better UX
    final p = _products.firstWhere((e) => e['id'] == _selectedProductId);
    final currentQty = p['quantity'] as int? ?? 0;
    final reqQty = int.parse(_qtyCtrl.text);
    
    if (reqQty > currentQty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Insufficient stock. Only $currentQty available.'),
        backgroundColor: const Color(0xFFEF4444),
      ));
      return;
    }

    setState(() => _submitting = true);
    
    try {
      await ApiService().stockOut(
        _selectedProductId!,
        reqQty,
        _reason,
        _notesCtrl.text.trim(),
      );
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Stock removed successfully!'),
          backgroundColor: Color(0xFF22C55E),
        ));
        // Reset
        _qtyCtrl.clear(); _notesCtrl.clear();
        setState(() { _selectedProductId = null; _reason = 'SALE'; });
        _load(); // Reload products to get new quantities
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
    _qtyCtrl.dispose(); _notesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Stock Out')),
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
                      child: Text('${p['name']} (Qty: ${p['quantity']})', style: const TextStyle(fontSize: 14)),
                    )).toList(),
                    onChanged: (v) => setState(() => _selectedProductId = v),
                    validator: (v) => v == null ? 'Required' : null,
                  ),
                  
                  const SizedBox(height: 20),
                  
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Quantity', style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            TextFormField(
                              controller: _qtyCtrl,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(hintText: 'Amount', prefixIcon: Icon(Icons.remove_circle_outline)),
                              validator: (v) {
                                if (v == null || v.isEmpty) return 'Required';
                                if (int.tryParse(v) == null || int.parse(v) <= 0) return 'Must be > 0';
                                return null;
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Reason', style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<String>(
                              value: _reason,
                              decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 14)),
                              items: _reasons.map((r) => DropdownMenuItem(value: r, child: Text(r, style: const TextStyle(fontSize: 13)))).toList(),
                              onChanged: (v) => setState(() => _reason = v!),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 20),
                  
                  const Text('Notes (Optional)', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _notesCtrl,
                    maxLines: 3,
                    decoration: const InputDecoration(hintText: 'Reason details, reference #...'),
                  ),
                  
                  const SizedBox(height: 32),
                  
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _submitting ? null : _submit,
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
                      child: _submitting 
                        ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Confirm Stock Out', style: TextStyle(fontSize: 16)),
                    ),
                  )
                ],
              ),
            ),
          ),
    );
  }
}
