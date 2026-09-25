import 'package:flutter/material.dart';
import 'package:qr_reader/services/api_service.dart';

class ProductDetailPage extends StatefulWidget {
  final String productId;
  const ProductDetailPage({super.key, required this.productId});

  @override
  State<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends State<ProductDetailPage> {
  Map<String, dynamic>? _product;
  List<Map<String, dynamic>> _txns = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final p = await ApiService().getProduct(widget.productId);
      final t = await ApiService().getTransactions(productId: widget.productId, limit: 10);
      if (mounted) setState(() { _product = p; _txns = t; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  void _showDeleteConfirm() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Product'),
        content: const Text('Are you sure you want to delete this product? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
            onPressed: () async {
              Navigator.pop(context); // Close dialog
              setState(() => _loading = true);
              try {
                await ApiService().deleteProduct(widget.productId);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Product deleted')));
                  Navigator.pop(context); // Return to list
                }
              } catch (e) {
                if (mounted) {
                  setState(() => _loading = false);
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: const Color(0xFFEF4444)));
                }
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_error != null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 48),
          const SizedBox(height: 12),
          Text(_error!),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: _load, child: const Text('Retry'))
        ])),
      );
    }
    if (_product == null) {
      return Scaffold(appBar: AppBar(), body: const Center(child: Text('Product not found')));
    }

    final p = _product!;
    final status = p['status'] as String? ?? 'IN_STOCK';
    final qty = p['quantity'] as int? ?? 0;
    
    final statusColor = status == 'OUT_OF_STOCK' ? const Color(0xFFEF4444) 
                      : status == 'LOW_STOCK' ? const Color(0xFFF59E0B) 
                      : const Color(0xFF22C55E);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Product Details'),
        actions: [
          IconButton(onPressed: _showDeleteConfirm, icon: const Icon(Icons.delete_outline, color: Color(0xFFEF4444))),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Main Card ──────────────────────────────────────────
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFF1F5F9)),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Column(
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 60, height: 60,
                        decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
                        child: Icon(Icons.inventory_2, size: 32, color: Theme.of(context).colorScheme.primary),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(p['name'] ?? 'Unknown', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
                            const SizedBox(height: 4),
                            Text('${p['sku'] ?? 'No SKU'} · ${p['category'] ?? 'Uncategorized'}', style: const TextStyle(color: Color(0xFF64748B))),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider(height: 1, color: Color(0xFFF1F5F9))),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _statCol('In Stock', '$qty', '${p['unit'] ?? 'pcs'}', statusColor),
                      Container(width: 1, height: 40, color: const Color(0xFFF1F5F9)),
                      _statCol('Threshold', '${p['low_stock_threshold'] ?? 5}', '${p['unit'] ?? 'pcs'}', const Color(0xFF1E293B)),
                      Container(width: 1, height: 40, color: const Color(0xFFF1F5F9)),
                      _statCol('Location', '${p['location'] ?? 'WH-1'}', '', const Color(0xFF1E293B)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // ── QR Code ─────────────────────────────────────────────
            Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFF1F5F9))),
                child: Column(
                  children: [
                    Image.network(ApiService().qrImageUrl(p['id']), height: 160, width: 160, errorBuilder: (c, e, s) => const Icon(Icons.qr_code, size: 80, color: Color(0xFFCBD5E1))),
                    const SizedBox(height: 12),
                    Text('Scan to view or update product', style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // ── Info Table ──────────────────────────────────────────
            const Text('Information', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFF1F5F9))),
              child: Column(
                children: [
                  _infoRow('Status', status.replaceAll('_', ' ')),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  _infoRow('Supplier', p['supplier'] ?? 'N/A'),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  _infoRow('Product ID', p['id'] ?? 'N/A'),
                ],
              ),
            ),

            const SizedBox(height: 24),
            
            // ── Recent Activity ─────────────────────────────────────
            const Text('Recent Activity', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
            const SizedBox(height: 12),
            if (_txns.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFF1F5F9))),
                child: const Text('No transactions yet', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF94A3B8))),
              )
            else
              Container(
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFF1F5F9))),
                child: Column(
                  children: _txns.map((t) => _txnRow(t)).toList(),
                ),
              ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _statCol(String label, String value, String unit, Color valColor) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
        const SizedBox(height: 4),
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: valColor)),
            if (unit.isNotEmpty) ...[
              const SizedBox(width: 4),
              Text(unit, style: TextStyle(fontSize: 12, color: valColor.withValues(alpha: 0.7), fontWeight: FontWeight.w600)),
            ]
          ],
        ),
      ],
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF64748B))),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
        ],
      ),
    );
  }

  Widget _txnRow(Map<String, dynamic> txn) {
    final isIn = txn['type'] == 'STOCK_IN';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: isIn ? const Color(0xFFF0FDF4) : const Color(0xFFFFF1F2), borderRadius: BorderRadius.circular(8)),
            child: Icon(isIn ? Icons.arrow_downward : Icons.arrow_upward, size: 16, color: isIn ? const Color(0xFF22C55E) : const Color(0xFFEF4444)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(isIn ? 'Stock In' : 'Stock Out', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                if (txn['reason'] != null) Text(txn['reason'], style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                if (txn['supplier'] != null) Text(txn['supplier'], style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('${isIn ? '+' : '-'}${txn['quantity']}', style: TextStyle(fontWeight: FontWeight.w800, color: isIn ? const Color(0xFF22C55E) : const Color(0xFFEF4444))),
              Text(txn['timestamp'] != null ? txn['timestamp'].toString().substring(0, 10) : '', style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
            ],
          ),
        ],
      ),
    );
  }
}
