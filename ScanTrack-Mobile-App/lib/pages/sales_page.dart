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
  final _notesCtrl = TextEditingController();

  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _items = [{'product_id': null, 'quantity': 1, 'unit_price': 0.0}];
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    ApiService().getProducts().then((p) {
      if (mounted) setState(() => _products = p);
    });
  }

  void _addItem() {
    setState(() {
      _items.add({'product_id': null, 'quantity': 1, 'unit_price': 0.0});
    });
  }

  void _removeItem(int index) {
    setState(() {
      _items.removeAt(index);
    });
  }

  void _updateItem(int index, String key, dynamic value) {
    setState(() {
      _items[index][key] = value;
      if (key == 'product_id') {
        final product = _products.firstWhere((p) => p['id'] == value, orElse: () => {});
        _items[index]['unit_price'] = (product['sell_price'] ?? 0).toDouble();
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_items.any((i) => i['product_id'] == null)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a product for each item')));
      return;
    }

    setState(() => _submitting = true);
    try {
      await ApiService().createSale(
        _customerCtrl.text.trim(),
        _items,
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
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Sale Items *', style: TextStyle(fontWeight: FontWeight.bold)),
                TextButton.icon(
                  onPressed: _addItem,
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Add Item'),
                ),
              ],
            ),
            ConstrainedBox(
              constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.5),
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _items.length,
                itemBuilder: (context, i) {
                  final qty = _items[i]['quantity'] as int;
                  final unitPrice = _items[i]['unit_price'] as double;
                  final total = qty * unitPrice;
                  
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: _items[i]['product_id'],
                                isExpanded: true,
                                hint: const Text('Select product...'),
                                decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                                items: _products.where((p) => p['status'] != 'OUT_OF_STOCK').map((p) {
                                  return DropdownMenuItem<String>(
                                    value: p['id'],
                                    child: Text('${p['name']} (${p['quantity']} ${p['unit']} left)'),
                                  );
                                }).toList(),
                                onChanged: (v) => _updateItem(i, 'product_id', v),
                              ),
                            ),
                            if (_items.length > 1) ...[
                              const SizedBox(width: 8),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.red),
                                onPressed: () => _removeItem(i),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                initialValue: qty.toString(),
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(labelText: 'Qty', contentPadding: EdgeInsets.symmetric(horizontal: 12)),
                                onChanged: (v) {
                                  setState(() {
                                    _items[i]['quantity'] = int.tryParse(v) ?? 1;
                                  });
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.grey.shade300),
                                ),
                                child: Text(
                                  '₹${total.toStringAsFixed(2)}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.black87),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
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
