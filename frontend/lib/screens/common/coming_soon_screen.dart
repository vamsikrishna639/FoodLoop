// A stand-in for screens that are built in a later stage. It keeps the
// navigation testable now and is replaced as each stage lands.
import 'package:material_ui/material_ui.dart';

import '../../widgets/empty_state.dart';
import '../../widgets/page_frame.dart';

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
class ActivityRailPlaceholder extends StatelessWidget {
  const ActivityRailPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return const SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(24, 48, 24, 24),
      child: EmptyState(
        art: EmptyArt.slip,
        title: 'Activity',
        message: 'Quiet for now. Requests, approvals and deliveries will print here as they happen.',
      ),
    );
  }
}
