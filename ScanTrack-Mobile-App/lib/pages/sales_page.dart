import 'package:flutter/material.dart';
import 'package:qr_reader/services/api_service.dart';
import 'package:qr_reader/pages/qr_scanner_page.dart' as qr_scanner;

class SalesPage extends StatefulWidget {
  const SalesPage({super.key});

  @override
  State<SalesPage> createState() => _SalesPageState();
}

class _SalesPageState extends State<SalesPage> {
  List<Map<String, dynamic>> _sales = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadSales();
  }

  Future<void> _loadSales() async {
    setState(() => _loading = true);
    try {
      final sales = await ApiService().getSales();
      if (mounted) setState(() { _sales = sales; _loading = false; });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showCreateSaleModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const _CreateSaleModal(),
    ).then((_) => _loadSales());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(title: const Text('Sales')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadSales,
              child: _sales.isEmpty
                  ? const Center(child: Text('No sales found.'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _sales.length,
                      itemBuilder: (context, index) {
                        final sale = _sales[index];
                        final customer = sale['customer_name'] ?? 'Unknown Customer';
                        final status = sale['status'] ?? 'UNKNOWN';
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: ListTile(
                            leading: const CircleAvatar(
                              backgroundColor: Color(0xFFE0E7FF),
                              child: Icon(Icons.shopping_cart, color: Color(0xFF4F46E5)),
                            ),
                            title: Text(customer, style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text('Status: $status\nDate: ${sale['created_at'].toString().split('T').first}'),
                            isThreeLine: true,
                          ),
                        );
                      },
                    ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateSaleModal,
        icon: const Icon(Icons.add),
        label: const Text('New Sale'),
        backgroundColor: const Color(0xFF4F46E5),
      ),
    );
  }
}

class _CreateSaleModal extends StatefulWidget {
  const _CreateSaleModal();

  @override
  State<_CreateSaleModal> createState() => _CreateSaleModalState();
}

class _CreateSaleModalState extends State<_CreateSaleModal> {
  final _formKey = GlobalKey<FormState>();
  final _customerCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  List<Map<String, dynamic>> _products = [];
  String? _selectedProductId;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    ApiService().getProducts().then((p) {
      if (mounted) setState(() => _products = p);
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _selectedProductId == null) {
      if (_selectedProductId == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please scan or select a product')));
      }
      return;
    }

    setState(() => _submitting = true);
    try {
      final qty = int.parse(_qtyCtrl.text);
      await ApiService().createSale(
        _customerCtrl.text.trim(),
        [{'product_id': _selectedProductId, 'quantity': qty}],
        _notesCtrl.text.trim(),
      );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Sale created successfully!'),
          backgroundColor: Color(0xFF22C55E),
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString()),
          backgroundColor: const Color(0xFFEF4444),
        ));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 20, right: 20, top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('New Sale', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextFormField(
              controller: _customerCtrl,
              decoration: const InputDecoration(labelText: 'Customer Name', prefixIcon: Icon(Icons.person)),
              validator: (v) => v!.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 12),
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
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.qr_code_scanner, color: Color(0xFF4F46E5)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _selectedProductId == null
                            ? 'Tap to scan product'
                            : _products.firstWhere((p) => p['id'] == _selectedProductId, orElse: () => {'name': 'Unknown'})['name'] ?? 'Unknown',
                        style: TextStyle(
                          color: _selectedProductId == null ? Colors.grey : Colors.black,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _qtyCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Quantity', prefixIcon: Icon(Icons.production_quantity_limits)),
              validator: (v) => (v == null || int.tryParse(v) == null || int.parse(v) <= 0) ? 'Valid qty required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _notesCtrl,
              decoration: const InputDecoration(labelText: 'Notes (Optional)'),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F46E5)),
                child: _submitting
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Record Sale'),
              ),
            )
          ],
        ),
      ),
    );
  }
}
