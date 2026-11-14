// Alerts: the user's notifications, newest first, grouped by day like the
// pages of a duplicate receipt book.
//
//   Today
//   * APPROVED · NEW                              12 min ago
//     Your request for 8 boxes of Chicken Biryani was approved.
//   ------------------------------------------------------------
//     PICKUP                                      25 min ago
//     Kiran Kumar will collect your Chicken Biryani.
//
// An unread line has a chilli dot, the word NEW and a bolder message, so
// "unread" never depends on colour alone. Tapping a line marks it read.
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/format.dart';
import '../../core/theme/tokens.dart';
import '../../models/app_notification.dart';
import '../../providers/notifications_provider.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/fl_button.dart';
import '../../widgets/page_frame.dart';
import '../../widgets/pressable.dart';
import '../../widgets/skeleton_token.dart';
import '../../widgets/slip_snackbar.dart';

class AlertsScreen extends StatefulWidget {
  const AlertsScreen({super.key});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  bool _markingAll = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<NotificationsProvider>().load();
    });
  }

  Future<void> _markAll() async {
    setState(() => _markingAll = true);
    try {
      final message = await context.read<NotificationsProvider>().markAllRead();
      if (mounted) showSlip(context, message);
    } on ApiException catch (e) {
      if (mounted) showSlip(context, e.message, error: true);
    }
    if (mounted) setState(() => _markingAll = false);
  }

  @override
  Widget build(BuildContext context) {
    final n = context.watch<NotificationsProvider>();
    final items = n.items;

    Widget body;
    if (items == null && n.error != null) {
      body = EmptyState.error(message: n.error!, onRetry: n.load);
    } else if (items == null) {
      body = const SkeletonToken();
    } else if (items.isEmpty) {
      body = const EmptyState(
        art: EmptyArt.slip,
        title: 'Nothing to tell you yet',
        message: 'Approvals, pickups and deliveries that concern you are printed here as they happen.',
      );
    } else {
      // Group by day, keeping the newest-first order.
      final groups = <String, List<AppNotification>>{};
      for (final a in items) {
        groups.putIfAbsent(Fmt.day(a.createdAt), () => []).add(a);
      }
      body = Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final g in groups.entries) ...[
            Padding(
              padding: const EdgeInsets.only(top: FlSpace.lg, bottom: FlSpace.xs),
              child: Semantics(header: true, child: Text(g.key, style: context.text.titleMedium)),
            ),
            for (final a in g.value)
              _AlertLine(key: ValueKey(a.id), alert: a, onTap: () => n.markRead(a.id)),
          ],
        ],
      );
    }

    final unread = n.unread;
    return PageFrame(
      title: 'Alerts',
      // No lede over the empty state, which already says it all.
      lede: items == null || items.isEmpty
          ? null
          : unread == 0
              ? 'All read. New ones are printed here as they happen.'
              : '$unread unread. Tap a line to mark it read.',
      maxWidth: 680,
      actions: [
        if (unread > 0)
          FlButton(
            label: 'Mark all read',
            icon: Icons.done_all,
            variant: FlButtonVariant.outline,
            loading: _markingAll,
            loadingLabel: 'Marking',
            onPressed: _markAll,
          ),
      ],
      children: [body],
    );
  }
}

class _AlertLine extends StatelessWidget {
  const _AlertLine({super.key, required this.alert, required this.onTap});
  final AppNotification alert;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final fl = context.fl;
    final a = alert;
    final unread = !a.isRead;

    return Pressable(
      // A read line has nothing left to do, so it is not a button any more.
      onTap: unread ? onTap : null,
      focusRadius: FlRadius.stamp,
      semanticLabel: '${unread ? 'Unread. ' : ''}${a.message} ${Fmt.ago(a.createdAt)}${unread ? '. Mark as read' : ''}',
      builder: (context, hovered) => Container(
        constraints: const BoxConstraints(minHeight: 48),
        padding: const EdgeInsets.symmetric(vertical: FlSpace.md, horizontal: FlSpace.xs),
        decoration: BoxDecoration(
          color: hovered ? fl.surfaceSunken : fl.surfaceSunken.withValues(alpha: 0),
          border: Border(bottom: BorderSide(color: fl.line)),
        ),
        child: ExcludeSemantics(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // The unread dot fades out when the line is read (120ms).
              SizedBox(
                width: 20,
                child: Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: AnimatedOpacity(
                    opacity: unread ? 1 : 0,
                    duration: FlMotion.of(context, FlMotion.fast),
                    curve: FlMotion.easeOut,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(color: fl.chilli, shape: BoxShape.circle),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text.rich(
                            TextSpan(children: [
                              TextSpan(text: a.word),
                              if (unread)
                                TextSpan(text: '  ·  NEW', style: TextStyle(color: fl.chilliDeep)),
                            ]),
                            style: fl.monoSmall.copyWith(color: fl.ink, fontWeight: FontWeight.w700),
                          ),
                        ),
                        const SizedBox(width: FlSpace.sm),
                        Text(Fmt.ago(a.createdAt), style: fl.monoSmall),
                      ],
                    ),
                    const SizedBox(height: FlSpace.xs),
                    Text(
                      a.message,
                      style: context.text.bodyLarge?.copyWith(
                        fontWeight: unread ? FontWeight.w600 : FontWeight.w400,
                        color: unread ? fl.ink : fl.inkSoft,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
