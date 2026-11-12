// A claim or pickup history printed like a till receipt: torn zigzag edges,
// mono text and dotted leaders between each label and its time.
//
//     Chicken Biryani
//     REQUEST RECEIPT  #FL-0003
//     ---------------------------------
//     Requested ............. 12:40 PM
//     Approved .............. 12:52 PM
//     Picked up ................ --:--
import 'package:material_ui/material_ui.dart';

import '../core/theme/tokens.dart';
import 'paper_shapes.dart';

/// One printed line. [value] is null for a step that has not happened yet.
class ReceiptEntry {
  const ReceiptEntry(this.label, this.value, {this.emphasis = false});
  final String label;
  final String? value;
  final bool emphasis; // bold line, e.g. the current step
}

class ReceiptTimeline extends StatelessWidget {
  const ReceiptTimeline({
    super.key,
    required this.title,
    required this.heading,
    required this.entries,
    this.reference,
    this.stamp,
    this.footer,
  });

  final String title; // e.g. the dish and quantity
  final String heading; // e.g. REQUEST RECEIPT
  final String? reference; // e.g. #FL-0003
  final List<ReceiptEntry> entries;
  final Widget? stamp; // a StatusStamp printed over the corner
  final String? footer;

  @override
  Widget build(BuildContext context) {
    final fl = context.fl;

    return CustomPaint(
      foregroundPainter: ReceiptOutlinePainter(fl.line),
      child: ClipPath(
        clipper: const ReceiptClipper(),
        child: ColoredBox(
          color: fl.surface,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(FlSpace.lg, FlSpace.xl, FlSpace.lg, FlSpace.xl),
            child: Stack(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // The title leads; the receipt type and number print under it.
                    // Room is left on the right so the stamp never covers text.
                    Padding(
                      padding: EdgeInsets.only(right: stamp == null ? 0 : 104),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title, style: context.text.titleLarge),
                          const SizedBox(height: FlSpace.xs),
                          Text(
                            [heading.toUpperCase(), ?reference].join('  '),
                            style: fl.monoSmall,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: FlSpace.md),
                    DottedLine(color: fl.controlBorder, dot: 4, gap: 3, height: 1),
                    const SizedBox(height: FlSpace.md),
                    for (final e in entries) _ReceiptRow(entry: e),
                    if (footer != null) ...[
                      const SizedBox(height: FlSpace.sm),
                      DottedLine(color: fl.controlBorder, dot: 4, gap: 3, height: 1),
                      const SizedBox(height: FlSpace.md),
                      Text(footer!.toUpperCase(),
                          textAlign: TextAlign.center, style: fl.monoSmall),
                    ],
                  ],
                ),
                if (stamp != null) Positioned(right: 0, top: 6, child: stamp!),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ReceiptRow extends StatelessWidget {
  const _ReceiptRow({required this.entry});
  final ReceiptEntry entry;

  @override
  Widget build(BuildContext context) {
    final fl = context.fl;
    final done = entry.value != null;
    final style = fl.mono.copyWith(
      color: done ? fl.ink : fl.inkSoft,
      fontWeight: entry.emphasis ? FontWeight.w700 : FontWeight.w500,
    );

    return Semantics(
      label: '${entry.label}: ${entry.value ?? 'not yet'}',
      child: ExcludeSemantics(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 5),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Flexible(child: Text(entry.label, style: style)),
              // The dotted leader fills whatever space is left.
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(6, 0, 6, 5),
                  child: DottedLine(color: fl.perforation, dot: 2, gap: 4),
                ),
              ),
              Text(entry.value ?? '--:--', style: style),
            ],
          ),
        ),
      ),
    );
  }
}
