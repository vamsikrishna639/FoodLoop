// A stand-in for screens that are built in a later stage. It keeps the
// navigation testable now and is replaced as each stage lands.
import 'package:material_ui/material_ui.dart';

import '../../core/theme/tokens.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/page_frame.dart';
import '../../widgets/paper_shapes.dart';

class ComingSoonScreen extends StatelessWidget {
  const ComingSoonScreen({
    super.key,
    required this.title,
    required this.heading,
    required this.message,
    this.art = EmptyArt.counter,
  });

  final String title;
  final String heading;
  final String message;
  final EmptyArt art;

  @override
  Widget build(BuildContext context) {
    return PageFrame(
      title: title,
      children: [EmptyState(art: art, title: heading, message: message)],
    );
  }
}

/// The right-hand rail on desktop. The live feed arrives in Stage 4.
/// It is deliberately quiet (no illustration) so it never competes with the
/// page beside it.
class ActivityRailPlaceholder extends StatelessWidget {
  const ActivityRailPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    final fl = context.fl;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(FlSpace.xl, FlSpace.xxxl, FlSpace.xl, FlSpace.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Semantics(header: true, child: Text('Activity', style: context.text.titleLarge)),
          const SizedBox(height: FlSpace.md),
          DottedLine(color: fl.perforation, dot: 2, gap: 4),
          const SizedBox(height: FlSpace.md),
          Text('NOTHING PRINTED YET', style: fl.monoSmall),
          const SizedBox(height: FlSpace.sm),
          Text(
            'Requests, approvals and deliveries will print here as they happen.',
            style: context.text.bodyMedium?.copyWith(color: fl.inkSoft),
          ),
        ],
      ),
    );
  }
}
