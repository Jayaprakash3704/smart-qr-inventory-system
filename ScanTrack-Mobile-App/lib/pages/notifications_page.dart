import 'package:flutter/material.dart';
import 'package:qr_reader/services/api_service.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  List<Map<String, dynamic>> _notifs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final n = await ApiService().getNotifications();
      if (mounted) setState(() { _notifs = n; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markAllRead() async {
    try {
      await ApiService().markAllRead();
      _load();
    } catch (_) {}
  }

  Future<void> _deleteNotif(String id) async {
    try {
      await ApiService().deleteNotification(id);
      setState(() => _notifs.removeWhere((n) => n['id'] == id));
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (_notifs.any((n) => !(n['isRead'] == true || n['isRead'] == 1)))
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Mark All Read'),
            )
        ],
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _notifs.isEmpty
          ? _emptyView()
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _notifs.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) => _NotifTile(
                notif: _notifs[i],
                onDelete: () => _deleteNotif(_notifs[i]['id']),
              ),
            ),
    );
  }

  Widget _emptyView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.notifications_off_outlined, size: 48, color: Color(0xFFCBD5E1)),
          const SizedBox(height: 12),
          const Text('No notifications', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF94A3B8))),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: _load, child: const Text('Refresh')),
        ],
      ),
    );
  }
}

class _NotifTile extends StatelessWidget {
  final Map<String, dynamic> notif;
  final VoidCallback onDelete;
  
  const _NotifTile({required this.notif, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final isRead = notif['isRead'] == true || notif['isRead'] == 1;
    final type = notif['type'] ?? 'INFO';
    
    final iconMap = {
      'LOW_STOCK': Icons.warning_amber,
      'OUT_OF_STOCK': Icons.error_outline,
      'INFO': Icons.info_outline,
    };
    
    final colorMap = {
      'LOW_STOCK': const Color(0xFFF59E0B),
      'OUT_OF_STOCK': const Color(0xFFEF4444),
      'INFO': const Color(0xFF3B82F6),
    };
    
    final bgMap = {
      'LOW_STOCK': const Color(0xFFFFFBEB),
      'OUT_OF_STOCK': const Color(0xFFFFF1F2),
      'INFO': const Color(0xFFEFF6FF),
    };

    final color = colorMap[type] ?? colorMap['INFO']!;
    final bg = bgMap[type] ?? bgMap['INFO']!;
    final icon = iconMap[type] ?? iconMap['INFO']!;

    return Dismissible(
      key: Key(notif['id'] ?? notif.hashCode.toString()),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDelete(),
      background: Container(
        padding: const EdgeInsets.only(right: 20),
        alignment: Alignment.centerRight,
        decoration: BoxDecoration(color: const Color(0xFFEF4444), borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isRead ? Colors.white : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isRead ? const Color(0xFFF1F5F9) : Theme.of(context).colorScheme.primary.withValues(alpha: 0.3)),
          boxShadow: isRead ? null : [BoxShadow(color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(notif['title'] ?? 'Notification', style: TextStyle(fontWeight: isRead ? FontWeight.w600 : FontWeight.w800, fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(notif['message'] ?? '', style: TextStyle(color: const Color(0xFF64748B), fontSize: 13, height: 1.4)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
