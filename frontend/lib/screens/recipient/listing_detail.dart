// Listing detail: everything a recipient needs before asking for food.
//
// ListingDetailView is the content. It is used in two places:
//   - ListingDetailScreen, the full page on phones (/home/listing/:id), which
//     the token card "flies" into with a Hero animation;
//   - the side panel next to the list on tablets and desktops.
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';

import '../../core/api/api_client.dart';
import '../../core/format.dart';
import '../../core/responsive/breakpoints.dart';
import '../../core/theme/tokens.dart';
import '../../models/food_listing.dart';
import '../../providers/feed_provider.dart';
import '../../services/food_service.dart';
import '../../widgets/deadline_clock.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/fl_button.dart';
import '../../widgets/portion_meter.dart';
import '../../widgets/quantity_stepper.dart';
import '../../widgets/receipt_timeline.dart';
import '../../widgets/skeleton_token.dart';
import '../../widgets/slip_snackbar.dart';
import '../../widgets/status_stamp.dart';
import '../../widgets/token_card.dart';

class ListingDetailView extends StatefulWidget {
  const ListingDetailView({super.key, required this.listing, this.useHero = false, this.inPanel = false});

  final FoodListing listing;
  final bool useHero; // only the full page takes part in the Hero flight

  /// In the side panel the token card is already visible in the list beside
  /// it, so the panel opens with a plain heading instead of a second card.
  final bool inPanel;

  @override
  State<ListingDetailView> createState() => _ListingDetailViewState();
}

class _ListingDetailViewState extends State<ListingDetailView> {
  int _quantity = 1;

  @override
  void didUpdateWidget(ListingDetailView old) {
    super.didUpdateWidget(old);
    // A different token was picked in the side panel: start the count again.
    if (old.listing.id != widget.listing.id) _quantity = 1;
  }

  @override
  Widget build(BuildContext context) {
    final l = widget.listing;
    final qty = _quantity.clamp(1, l.available < 1 ? 1 : l.available);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.inPanel)
          _PanelHeading(listing: l)
        else
          // The same slip as in the list, so the eye keeps its place.
          TokenCard(
            title: l.title,
            donorName: l.donorName,
            tokenNumber: l.tokenNumber,
            quantity: l.quantity,
            reservedQuantity: l.reservedQuantity,
            unit: l.unit,
            deadline: l.pickupDeadline,
            foodType: l.foodType,
            stamp: l.stamp,
            imageUrl: l.imageUrl,
            heroTag: widget.useHero ? l.heroTag : null,
          ),
        if (l.description.isNotEmpty) ...[
          const SizedBox(height: FlSpace.xl),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: Text(l.description, style: context.text.bodyLarge),
          ),
        ],
        const SizedBox(height: FlSpace.xl),

        // The facts, printed like a receipt.
        ReceiptTimeline(
          title: l.location,
          heading: 'Collect from',
          reference: '#${l.tokenNumber}',
          entries: [
            ReceiptEntry('Prepared', Fmt.dayTime(l.preparedAt)),
            ReceiptEntry('Pickup by', Fmt.dayTime(l.pickupDeadline), emphasis: true),
            ReceiptEntry('Posted', Fmt.quantity(l.quantity, l.unit)),
            ReceiptEntry('Left', Fmt.quantity(l.available, l.unit), emphasis: true),
          ],
        ),
        const SizedBox(height: FlSpace.xl),

        Text('Allergens', style: context.text.titleLarge),
        const SizedBox(height: FlSpace.xs),
        Text(
          l.allergenNotes.isEmpty ? 'None declared by the canteen.' : l.allergenNotes,
          style: context.text.bodyLarge,
        ),
        const SizedBox(height: FlSpace.xl),

        // The request area. Its wording follows the listing's state.
        if (l.canRequest) ...[
          Text('How much do you need?', style: context.text.titleLarge),
          const SizedBox(height: FlSpace.md),
          Wrap(
            spacing: FlSpace.lg,
            runSpacing: FlSpace.md,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              QuantityStepper(
                value: qty,
                max: l.available,
                unit: l.unit,
                onChanged: (v) => setState(() => _quantity = v),
              ),
              FlButton(
                label: 'Request food',
                icon: Icons.back_hand_outlined,
                variant: FlButtonVariant.accent,
                // Sending a request is the claim workflow, built in Stage 3.
                onPressed: () => showSlip(
                  context,
                  'Requests open in Stage 3. You picked ${Fmt.quantity(qty, l.unit)}.',
                  note: true,
                ),
              ),
            ],
          ),
          const SizedBox(height: FlSpace.sm),
          Text('Up to ${Fmt.quantity(l.available, l.unit)} left.', style: context.text.bodySmall),
        ] else
          _ClosedNote(listing: l),
        const SizedBox(height: FlSpace.xl),

        const _SafetyNote(),
        SizedBox(height: context.isMobile ? FlSpace.xl : 0),
      ],
    );
  }
}

/// The top of the side panel: name, canteen, and the countdown.
class _PanelHeading extends StatelessWidget {
  const _PanelHeading({required this.listing});
  final FoodListing listing;

  @override
  Widget build(BuildContext context) {
    final l = listing;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Semantics(header: true, child: Text(l.title, style: context.text.headlineMedium)),
        const SizedBox(height: FlSpace.xs),
        Text('${l.donorName}  ·  #${l.tokenNumber}', style: context.text.bodyMedium?.copyWith(color: context.fl.inkSoft)),
        const SizedBox(height: FlSpace.lg),
        Wrap(
          spacing: FlSpace.xl,
          runSpacing: FlSpace.md,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            if (l.isOpen) DeadlineClock(deadline: l.pickupDeadline) else StatusStamp(l.stamp),
            PortionMeter(total: l.quantity, reserved: l.reservedQuantity, unit: l.unit),
          ],
        ),
      ],
    );
  }
}

/// Why a token cannot be requested, in plain words.
class _ClosedNote extends StatelessWidget {
  const _ClosedNote({required this.listing});
  final FoodListing listing;

  @override
  Widget build(BuildContext context) {
    final (String title, String body) = listing.isExpired
        ? ('Pickup has closed', 'The deadline passed at ${Fmt.time(listing.pickupDeadline)}, so this token is off the counter.')
        : listing.status == 'completed'
            ? ('All handed out', 'This token has been collected and delivered.')
            : ('Every portion is spoken for', 'Approved requests have reserved all of it. If one is cancelled, it comes back here.');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: context.text.titleLarge),
        const SizedBox(height: FlSpace.xs),
        Text(body, style: context.text.bodyLarge?.copyWith(color: context.fl.inkSoft)),
      ],
    );
  }
}

/// The food-safety reminder. A deadline alone does not make food safe.
class _SafetyNote extends StatelessWidget {
  const _SafetyNote();

  @override
  Widget build(BuildContext context) {
    final fl = context.fl;
    return Semantics(
      container: true,
      child: Container(
        padding: const EdgeInsets.all(FlSpace.lg),
        decoration: BoxDecoration(
          color: fl.surfaceSunken,
          borderRadius: BorderRadius.circular(FlRadius.control),
          border: Border.all(color: fl.line),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.health_and_safety_outlined, color: fl.ink, size: 22, semanticLabel: 'Food safety'),
            const SizedBox(width: FlSpace.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Check before you serve', style: context.text.titleMedium),
                  const SizedBox(height: FlSpace.xs),
                  Text(
                    'Look at and smell the food when you collect it, and read the allergens '
                    'above. A pickup deadline is not a promise that food is safe to eat. '
                    'If anything seems off, do not serve it.',
                    style: context.text.bodyMedium,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Full page on phones: /home/listing/:id
// ---------------------------------------------------------------------------

class ListingDetailScreen extends StatefulWidget {
  const ListingDetailScreen({super.key, required this.id});
  final String id;

  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  FoodListing? _listing;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Show the copy already in the feed straight away (so the Hero has
    // something to land on), then fetch a fresh one in the background.
    final cached = context.read<FeedProvider>().items?.where((l) => l.id == widget.id);
    if (cached != null && cached.isNotEmpty) _listing = cached.first;
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final fresh = await context.read<FoodService>().get(widget.id);
      if (!mounted) return;
      setState(() => _listing = fresh);
      context.read<FeedProvider>().replace(fresh);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  void _back() => context.canPop() ? context.pop() : context.go('/home');

  @override
  Widget build(BuildContext context) {
    final gutter = Breakpoints.gutter(context);
    final listing = _listing;

    Widget body;
    if (listing != null) {
      body = ListingDetailView(listing: listing, useHero: true);
    } else if (_error != null) {
      body = EmptyState.error(message: _error!, onRetry: _load);
    } else {
      body = const SkeletonToken();
    }

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(gutter, FlSpace.sm, gutter, FlSpace.xxxl),
      child: Align(
        alignment: Alignment.topLeft,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 640),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // A plain back control, left-aligned with the content.
              TextButton.icon(
                onPressed: _back,
                icon: const Icon(Icons.arrow_back),
                label: const Text('Counter'),
                style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: FlSpace.sm)),
              ),
              const SizedBox(height: FlSpace.sm),
              body,
            ],
          ),
        ),
      ),
    );
  }
}
