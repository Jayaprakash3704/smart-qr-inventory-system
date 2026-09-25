import 'package:flutter/material.dart';
import 'package:qr_reader/services/api_service.dart';
import 'package:qr_reader/pages/home_page.dart' show _buildBottomNav;

class InventoryPage extends StatefulWidget {
  const InventoryPage({super.key});

  @override
  State<InventoryPage> createState() => _InventoryPageState();
}

class _InventoryPageState extends State<InventoryPage> {
  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _filtered = [];
  bool _loading = true;
  String? _error;
  String _search = '';
  String _statusFilter = 'All';

  static const _statusOptions = ['All', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final products = await ApiService().getProducts();
      if (mounted) {
        setState(() {
          _products = products;
          _loading = false;
          _applyFilters();
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  void _applyFilters() {
    _filtered = _products.where((p) {
      final name = (p['name'] ?? '').toString().toLowerCase();
      final sku  = (p['sku']  ?? '').toString().toLowerCase();
      final q    = _search.toLowerCase();
      final matchSearch = _search.isEmpty || name.contains(q) || sku.contains(q);
      final matchStatus = _statusFilter == 'All' || p['status'] == _statusFilter;
      return matchSearch && matchStatus;
    }).toList();
  }

  void _showAddProduct() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AddProductSheet(onAdded: _load),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh_outlined)),
          IconButton(
            onPressed: _showAddProduct,
            icon: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.add, color: Colors.white, size: 18),
            ),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          // ── Search + Filter ───────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Column(
              children: [
                TextField(
                  onChanged: (v) => setState(() { _search = v; _applyFilters(); }),
                  decoration: const InputDecoration(
                    hintText: 'Search by name or SKU...',
                    prefixIcon: Icon(Icons.search, size: 20, color: Color(0xFF94A3B8)),
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 34,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: _statusOptions.map((s) {
                      final active = _statusFilter == s;
                      final labelMap = {
                        'All': 'All', 'IN_STOCK': 'In Stock',
                        'LOW_STOCK': 'Low Stock', 'OUT_OF_STOCK': 'Out of Stock'
                      };
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GestureDetector(
                          onTap: () => setState(() { _statusFilter = s; _applyFilters(); }),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14),
                            decoration: BoxDecoration(
                              color: active ? Theme.of(context).colorScheme.primary : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            alignment: Alignment.center,
                            child: Text(labelMap[s] ?? s,
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                                color: active ? Colors.white : const Color(0xFF64748B))),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // ── Count ─────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(children: [
              Text('${_filtered.length} products',
                style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600)),
            ]),
          ),

          // ── List ──────────────────────────────────────────────────
          Expanded(
            child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                ? _errorView()
                : _filtered.isEmpty
                  ? _emptyView()
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                      itemCount: _filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (_, i) => _ProductTile(
                        product: _filtered[i],
                        onTap: () => Navigator.pushNamed(context, '/product/${_filtered[i]['id']}')
                          .then((_) => _load()),
                      ),
                    ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomNav(context, 1),
    );
  }

  Widget _errorView() {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Icon(Icons.wifi_off, size: 48, color: Color(0xFF94A3B8)),
        const SizedBox(height: 12),
        Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF64748B))),
        const SizedBox(height: 16),
        ElevatedButton(onPressed: _load, child: const Text('Retry')),
      ]),
    );
  }

  Widget _emptyView() {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Icon(Icons.inventory_2_outlined, size: 56, color: Color(0xFFCBD5E1)),
        const SizedBox(height: 12),
        const Text('No products found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF94A3B8))),
        const SizedBox(height: 6),
        Text(_search.isNotEmpty ? 'Try a different search' : 'Add your first product with the + button',
          style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 13)),
      ]),
    );
  }
}

// ── Product Tile ──────────────────────────────────────────────────────
class _ProductTile extends StatelessWidget {
  final Map<String, dynamic> product;
  final VoidCallback onTap;
  const _ProductTile({required this.product, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final status = product['status'] as String? ?? 'IN_STOCK';
    final statusConfig = {
      'IN_STOCK':    [const Color(0xFF22C55E), const Color(0xFFF0FDF4), 'In Stock'],
      'LOW_STOCK':   [const Color(0xFFF59E0B), const Color(0xFFFFFBEB), 'Low Stock'],
      'OUT_OF_STOCK':[const Color(0xFFEF4444), const Color(0xFFFFF1F2), 'Out of Stock'],
    };
    final cfg = statusConfig[status] ?? [const Color(0xFF94A3B8), const Color(0xFFF8FAFC), status];
    final qty = product['quantity'] as int? ?? 0;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFF1F5F9)),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Row(
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: cfg[1] as Color,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.inventory_2_outlined, color: cfg[0] as Color, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product['name'] ?? 'Unknown',
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Color(0xFF1E293B)),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 3),
                  Text('${product['sku'] ?? ''} · ${product['category'] ?? ''}',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('$qty',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: cfg[0] as Color)),
                Text(product['unit'] ?? 'pcs',
                  style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
              ],
            ),
            const SizedBox(width: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: cfg[1] as Color,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(cfg[2] as String,
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: cfg[0] as Color)),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Add Product Bottom Sheet ───────────────────────────────────────────
class _AddProductSheet extends StatefulWidget {
  final VoidCallback onAdded;
  const _AddProductSheet({required this.onAdded});

  @override
  State<_AddProductSheet> createState() => _AddProductSheetState();
}

class _AddProductSheetState extends State<_AddProductSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _skuCtrl  = TextEditingController();
  final _qtyCtrl  = TextEditingController(text: '0');
  final _thresholdCtrl = TextEditingController(text: '5');
  final _supplierCtrl  = TextEditingController();
  final _locationCtrl  = TextEditingController(text: 'Warehouse');
  String _category = 'General';
  String _unit = 'pcs';
  bool _loading = false;

  static const _categories = ['General', 'Electronics', 'Food & Beverage', 'Clothing', 'Office Supplies', 'Tools', 'Medical'];
  static const _units = ['pcs', 'kg', 'g', 'L', 'mL', 'box', 'pack', 'roll', 'set', 'pair'];

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ApiService().createProduct({
        'name': _nameCtrl.text.trim(),
        'sku': _skuCtrl.text.trim(),
        'category': _category,
        'quantity': int.tryParse(_qtyCtrl.text) ?? 0,
        'unit': _unit,
        'location': _locationCtrl.text.trim(),
        'supplier': _supplierCtrl.text.trim(),
        'low_stock_threshold': int.tryParse(_thresholdCtrl.text) ?? 5,
      });
      if (mounted) {
        Navigator.pop(context);
        widget.onAdded();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Product added successfully!'), backgroundColor: Color(0xFF22C55E)));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: const Color(0xFFEF4444)));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 60),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 0),
            width: 40, height: 4,
            decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Row(
              children: [
                const Text('Add New Product', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
                const Spacer(),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(20, 8, 20, MediaQuery.of(context).viewInsets.bottom + 20),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    _field('Product Name *', _nameCtrl, required: true),
                    const SizedBox(height: 12),
                    _field('SKU (leave blank for auto-generate)', _skuCtrl),
                    const SizedBox(height: 12),
                    Row(children: [
                      Expanded(child: _dropdown('Category', _categories, _category, (v) => setState(() => _category = v!))),
                      const SizedBox(width: 12),
                      Expanded(child: _dropdown('Unit', _units, _unit, (v) => setState(() => _unit = v!))),
                    ]),
                    const SizedBox(height: 12),
                    Row(children: [
                      Expanded(child: _field('Qty', _qtyCtrl, number: true)),
                      const SizedBox(width: 12),
                      Expanded(child: _field('Low Stock Alert', _thresholdCtrl, number: true)),
                    ]),
                    const SizedBox(height: 12),
                    _field('Location / Aisle', _locationCtrl),
                    const SizedBox(height: 12),
                    _field('Supplier', _supplierCtrl),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _submit,
                        child: _loading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Add Product'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl, {bool required = false, bool number = false}) {
    return TextFormField(
      controller: ctrl,
      keyboardType: number ? TextInputType.number : TextInputType.text,
      validator: required ? (v) => (v == null || v.trim().isEmpty) ? '$label is required' : null : null,
      decoration: InputDecoration(labelText: label),
    );
  }

  Widget _dropdown(String label, List<String> options, String value, ValueChanged<String?> onChanged) {
    return DropdownButtonFormField<String>(
      value: value,
      decoration: InputDecoration(labelText: label),
      items: options.map((o) => DropdownMenuItem(value: o, child: Text(o, style: const TextStyle(fontSize: 13)))).toList(),
      onChanged: onChanged,
    );
  }

  @override
  void dispose() {
    _nameCtrl.dispose(); _skuCtrl.dispose(); _qtyCtrl.dispose();
    _thresholdCtrl.dispose(); _supplierCtrl.dispose(); _locationCtrl.dispose();
    super.dispose();
  }
}
