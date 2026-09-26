import 'package:flutter/material.dart';
import 'package:qr_reader/services/api_service.dart';
import 'package:qr_reader/services/user_session.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  Map<String, dynamic>? _summary;
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
      final s = await ApiService().getSummary();
      if (mounted) setState(() { _summary = s; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final brand = Theme.of(context).colorScheme.primary;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          color: brand,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Header ──────────────────────────────────────────
                Row(
                  children: [
                    Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        color: brand,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.qr_code_scanner, color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('ScanTrack',
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
                        Text('QR Inventory', style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                      ],
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () => Navigator.pushNamed(context, '/notifications'),
                      icon: const Icon(Icons.notifications_outlined, color: Color(0xFF64748B)),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pushNamed(context, '/settings'),
                      icon: const Icon(Icons.settings_outlined, color: Color(0xFF64748B)),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // ── Stats ──────────────────────────────────────────
                if (_loading)
                  _shimmerStats()
                else if (_error != null)
                  _errorCard()
                else
                  _statsGrid(),

                const SizedBox(height: 24),

                // ── Quick Actions ───────────────────────────────────
                const Text('Quick Actions',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
                const SizedBox(height: 14),

                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.55,
                  children: [
                    _actionCard(
                      context,
                      label: 'Inventory',
                      icon: Icons.inventory_2_outlined,
                      colors: [const Color(0xFF3B82F6), const Color(0xFF1D4ED8)],
                      route: '/inventory',
                    ),
                    _actionCard(
                      context,
                      label: 'Scan QR',
                      icon: Icons.qr_code_scanner,
                      colors: [const Color(0xFFF97316), const Color(0xFFEA580C)],
                      route: '/qr-scanner',
                    ),
                    _actionCard(
                      context,
                      label: 'Stock In',
                      icon: Icons.add_circle_outline,
                      colors: [const Color(0xFF22C55E), const Color(0xFF15803D)],
                      route: '/stock-in',
                    ),
                    _actionCard(
                      context,
                      label: 'Stock Out',
                      icon: Icons.remove_circle_outline,
                      colors: [const Color(0xFFEF4444), const Color(0xFFB91C1C)],
                      route: '/stock-out',
                    ),
                    _actionCard(
                      context,
                      label: 'Sales',
                      icon: Icons.shopping_cart_outlined,
                      colors: [const Color(0xFF4F46E5), const Color(0xFF3730A3)],
                      route: '/sales',
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // ── Recent Activity ─────────────────────────────────
                _RecentTransactions(),

                const SizedBox(height: 24),

                // ── Low Stock Alert ─────────────────────────────────
                _LowStockAlert(),

                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: buildBottomNav(context, 0),
    );
  }

  Widget _statsGrid() {
    final s = _summary ?? {};
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        _statTile('Total Products', '${s['totalProducts'] ?? 0}',
            Icons.category_outlined, const Color(0xFFF97316), const Color(0xFFFFF7ED)),
        _statTile('In Stock', '${s['inStock'] ?? 0}',
            Icons.check_circle_outline, const Color(0xFF22C55E), const Color(0xFFF0FDF4)),
        _statTile('Low Stock', '${s['lowStock'] ?? 0}',
            Icons.warning_amber_outlined, const Color(0xFFF59E0B), const Color(0xFFFFFBEB)),
        _statTile('Out of Stock', '${s['outOfStock'] ?? 0}',
            Icons.do_not_disturb_outlined, const Color(0xFFEF4444), const Color(0xFFFFF1F2)),
      ],
    );
  }

  Widget _statTile(String label, String value, IconData icon, Color color, Color bg) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: color, size: 24),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value,
                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: color)),
              Text(label,
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _actionCard(BuildContext context, {
    required String label, required IconData icon,
    required List<Color> colors, required String route,
  }) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, route),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: colors, begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(color: colors.last.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 6)),
          ],
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: Colors.white.withValues(alpha: 0.9), size: 28),
            Text(label,
              style: const TextStyle(color: Colors.white, fontSize: 14,
                fontWeight: FontWeight.w800, letterSpacing: -0.2)),
          ],
        ),
      ),
    );
  }

  Widget _shimmerStats() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: List.generate(4, (_) => Container(
        decoration: BoxDecoration(
          color: Colors.grey.shade200,
          borderRadius: BorderRadius.circular(16),
        ),
      )),
    );
  }

  Widget _errorCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF1F2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Column(
        children: [
          const Icon(Icons.wifi_off, color: Color(0xFFEF4444), size: 32),
          const SizedBox(height: 8),
          const Text('Cannot connect to server', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFB91C1C))),
          const SizedBox(height: 4),
          Text('Check server IP in Settings', style: TextStyle(fontSize: 12, color: Colors.red.shade400)),
          const SizedBox(height: 12),
          ElevatedButton.icon(onPressed: _load, icon: const Icon(Icons.refresh, size: 16), label: const Text('Retry')),
        ],
      ),
    );
  }
}

// ── Bottom Nav helper (shared) ────────────────────────────────────────
Widget buildBottomNav(BuildContext context, int current, {int unreadNotifs = 0}) {
  final items = [
    {'icon': Icons.home_outlined, 'activeIcon': Icons.home, 'label': 'Home', 'route': '/home'},
    {'icon': Icons.inventory_2_outlined, 'activeIcon': Icons.inventory_2, 'label': 'Inventory', 'route': '/inventory'},
    {'icon': Icons.qr_code_scanner, 'activeIcon': Icons.qr_code_scanner, 'label': 'Scan', 'route': '/qr-scanner'},
    {'icon': Icons.add_box_outlined, 'activeIcon': Icons.add_box, 'label': 'Stock In', 'route': '/stock-in'},
    {'icon': Icons.notifications_outlined, 'activeIcon': Icons.notifications, 'label': 'Alerts', 'route': '/notifications'},
  ];

  return Container(
    decoration: const BoxDecoration(
      color: Colors.white,
      border: Border(top: BorderSide(color: Color(0xFFF1F5F9), width: 1)),
    ),
    child: BottomNavigationBar(
      currentIndex: current,
      onTap: (i) {
        if (i != current) {
          final target = items[i]['route'] as String;
          if (target == '/home') {
            Navigator.pushNamedAndRemoveUntil(context, target, (r) => false);
          } else {
            Navigator.pushNamedAndRemoveUntil(context, target, ModalRoute.withName('/home'));
          }
        }
      },
      items: items.asMap().entries.map((entry) {
        final i = entry.key;
        final item = entry.value;
        // Show badge on Alerts (index 4)
        final showBadge = i == 4 && unreadNotifs > 0;
        return BottomNavigationBarItem(
          icon: showBadge
            ? Badge(
                label: Text('$unreadNotifs', style: const TextStyle(fontSize: 9)),
                child: Icon(item['icon'] as IconData),
              )
            : Icon(item['icon'] as IconData),
          activeIcon: showBadge
            ? Badge(
                label: Text('$unreadNotifs', style: const TextStyle(fontSize: 9)),
                child: Icon(item['activeIcon'] as IconData),
              )
            : Icon(item['activeIcon'] as IconData),
          label: item['label'] as String,
        );
      }).toList(),
    ),
  );
}

// ── Recent Transactions Widget ────────────────────────────────────────
class _RecentTransactions extends StatefulWidget {
  @override
  State<_RecentTransactions> createState() => _RecentTransactionsState();
}

class _RecentTransactionsState extends State<_RecentTransactions> {
  List<Map<String, dynamic>> _txns = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    ApiService().getTransactions(limit: 5).then((t) {
      if (mounted) setState(() { _txns = t; _loading = false; });
    }).catchError((_) {
      if (mounted) setState(() => _loading = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Recent Transactions',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
        const SizedBox(height: 12),
        if (_loading)
          Container(height: 120, decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)))
        else if (_txns.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFF1F5F9))),
            child: const Center(child: Text('No transactions yet', style: TextStyle(color: Color(0xFF94A3B8)))),
          )
        else
          Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFF1F5F9))),
            child: Column(
              children: _txns.asMap().entries.map((entry) {
                final txn = entry.value;
                final isIn = txn['type'] == 'STOCK_IN';
                final isLast = entry.key == _txns.length - 1;
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    border: isLast ? null : const Border(bottom: BorderSide(color: Color(0xFFF8FAFC))),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 36, height: 36,
                        decoration: BoxDecoration(
                          color: isIn ? const Color(0xFFF0FDF4) : const Color(0xFFFFF1F2),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          isIn ? Icons.add : Icons.remove,
                          color: isIn ? const Color(0xFF22C55E) : const Color(0xFFEF4444),
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(txn['product_name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF1E293B))),
                          Text('${isIn ? '+' : '-'}${txn['quantity']} units', style: TextStyle(fontSize: 11, color: isIn ? const Color(0xFF22C55E) : const Color(0xFFEF4444), fontWeight: FontWeight.w600)),
                        ]),
                      ),
                      Text(
                        txn['timestamp'] != null ? _formatDate(txn['timestamp'].toString()) : '',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
      ],
    );
  }

  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso).toLocal();
      return '${d.day}/${d.month}';
    } catch (_) { return ''; }
  }
}

// ── Low Stock Alert Widget ─────────────────────────────────────────────
class _LowStockAlert extends StatefulWidget {
  @override
  State<_LowStockAlert> createState() => _LowStockAlertState();
}

class _LowStockAlertState extends State<_LowStockAlert> {
  List<Map<String, dynamic>> _items = [];

  @override
  void initState() {
    super.initState();
    ApiService().getLowStock().then((items) {
      if (mounted) setState(() => _items = items.take(3).toList());
    }).catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    if (_items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          const Icon(Icons.warning_amber, color: Color(0xFFF59E0B), size: 18),
          const SizedBox(width: 6),
          Text('Low Stock Alert (${_items.length})',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF1E293B))),
        ]),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFFFFBEB),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFFDE68A)),
          ),
          child: Column(
            children: _items.asMap().entries.map((entry) {
              final p = entry.value;
              final isLast = entry.key == _items.length - 1;
              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  border: isLast ? null : const Border(bottom: BorderSide(color: Color(0xFFFDE68A))),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.inventory_2_outlined, color: Color(0xFFF59E0B), size: 20),
                    const SizedBox(width: 10),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      Text('${p['quantity']} ${p['unit']} remaining', style: const TextStyle(fontSize: 12, color: Color(0xFF92400E))),
                    ])),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: p['status'] == 'OUT_OF_STOCK' ? const Color(0xFFFEE2E2) : const Color(0xFFFDE68A),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        p['status'] == 'OUT_OF_STOCK' ? 'OUT' : 'LOW',
                        style: TextStyle(
                          fontSize: 10, fontWeight: FontWeight.w900,
                          color: p['status'] == 'OUT_OF_STOCK' ? const Color(0xFFB91C1C) : const Color(0xFF92400E),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}
