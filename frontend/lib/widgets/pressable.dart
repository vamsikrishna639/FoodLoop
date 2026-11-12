// Makes any widget tappable with consistent feedback: a small scale-down on
// press, a pointer cursor on web, a visible focus ring and keyboard support.
import 'package:material_ui/material_ui.dart';

import '../core/theme/tokens.dart';

class Pressable extends StatefulWidget {
  const Pressable({
    super.key,
    required this.onTap,
    required this.builder,
    this.semanticLabel,
    this.selected,
    this.focusRadius = FlRadius.slip,
  });

  final VoidCallback? onTap;

  /// Builds the child. [hovered] lets the child lift itself on hover.
  final Widget Function(BuildContext context, bool hovered) builder;
  final String? semanticLabel;
  final bool? selected;
  final double focusRadius;

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _pressed = false;
  bool _hovered = false;
  bool _focused = false;

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onTap != null;
    final fl = context.fl;

    return Semantics(
      button: true,
      enabled: enabled,
      selected: widget.selected,
      label: widget.semanticLabel,
      child: FocusableActionDetector(
        enabled: enabled,
        mouseCursor: enabled ? SystemMouseCursors.click : SystemMouseCursors.basic,
        onShowHoverHighlight: (v) => setState(() => _hovered = v),
        onShowFocusHighlight: (v) => setState(() => _focused = v),
        // Enter / Space activate it, like a real button.
        actions: {
          ActivateIntent: CallbackAction<ActivateIntent>(onInvoke: (_) => widget.onTap?.call()),
        },
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTapDown: enabled ? (_) => setState(() => _pressed = true) : null,
          onTapUp: enabled ? (_) => setState(() => _pressed = false) : null,
          onTapCancel: enabled ? () => setState(() => _pressed = false) : null,
          onTap: widget.onTap,
          child: AnimatedScale(
            scale: _pressed ? 0.98 : 1,
            duration: FlMotion.of(context, FlMotion.fast),
            curve: FlMotion.easeOut,
            child: DecoratedBox(
              // Focus ring is drawn in front so it is never clipped away.
              position: DecorationPosition.foreground,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(widget.focusRadius),
                border: _focused ? Border.all(color: fl.ink, width: 2) : null,
              ),
              child: widget.builder(context, _hovered && enabled),
            ),
          ),
        ),
      ),
    );
  }
}
